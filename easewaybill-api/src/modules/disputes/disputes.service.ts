import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Dispute,
  DisputeStatus,
  EscrowStatus,
  OrderStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { DisputeResolution, ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeResponseDto } from './dto/dispute-response.dto';
import { PaginatedDisputesDto } from './dto/paginated-disputes.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

// Adjust to your product's policy. Consider moving to config/env if it needs
// to differ per environment or be tuned without a redeploy.
const DISPUTE_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours after delivery

type OrderSummary = {
  id: string;
  status: OrderStatus;
  buyerId: string | null;
  sellerId: string;
  trackingCode: string;
  deliveredAt: Date | null;
};

type DisputeWithOrder = Dispute & {
  order?: {
    trackingCode: string;
  };
};

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async raise(
    orderId: string,
    dto: RaiseDisputeDto,
    user: AuthenticatedUser,
  ): Promise<DisputeResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        buyerId: true,
        sellerId: true,
        trackingCode: true,
        deliveredAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    this.assertBuyer(order, user.id);

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Disputes can only be raised on delivered orders. Current status: ${order.status}`,
      );
    }

    this.assertWithinDisputeWindow(order);

    try {
      const dispute = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const existingDispute = await tx.dispute.findUnique({
          where: { orderId },
          select: { id: true },
        });

        if (existingDispute) {
          throw new BadRequestException('A dispute already exists for this order');
        }

        const createdDispute = await tx.dispute.create({
          data: {
            orderId,
            raisedById: user.id,
            reason: dto.reason,
            description: dto.description,
            evidence: dto.evidence ?? Prisma.JsonNull,
            status: DisputeStatus.OPEN,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.DISPUTED,
            escrowStatus: EscrowStatus.DISPUTED,
            disputedAt: new Date(),
          },
        });

        await tx.disputeEvent.create({
          data: {
            disputeId: createdDispute.id,
            actorId: user.id,
            action: 'RAISED',
            metadata: { reason: dto.reason },
          },
        });

        return createdDispute;
      });

      this.logger.log(`Dispute raised for order ${order.trackingCode} by user ${user.id}`);

      this.eventEmitter.emit('dispute.raised', {
        disputeId: dispute.id,
        orderId: order.id,
        trackingCode: order.trackingCode,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        raisedById: user.id,
      });

      return this.format(dispute, order.trackingCode);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A dispute already exists for this order');
      }

      this.logger.error(
        `Failed to raise dispute for order ${orderId}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async resolve(
    orderId: string,
    dto: ResolveDisputeDto,
    admin: AuthenticatedUser,
  ): Promise<DisputeResponseDto> {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can resolve disputes');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        trackingCode: true,
        buyerId: true,
        sellerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.DISPUTED) {
      throw new BadRequestException(`Order is not disputed. Current status: ${order.status}`);
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { orderId },
    });

    if (!dispute) {
      throw new NotFoundException(`No dispute found for order ${orderId}`);
    }

    if (
      dispute.status === DisputeStatus.RESOLVED_FOR_BUYER ||
      dispute.status === DisputeStatus.RESOLVED_FOR_SELLER
    ) {
      throw new BadRequestException('This dispute has already been resolved');
    }

    const buyerWins = dto.resolution === DisputeResolution.RESOLVED_FOR_BUYER;

    const resolvedDispute = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Optimistic lock: only succeeds if the dispute is still OPEN at write time.
      // Prevents two admins resolving the same dispute concurrently — the second
      // request's updateMany affects 0 rows and we reject it below.
      const updateResult = await tx.dispute.updateMany({
        where: { orderId, status: DisputeStatus.OPEN },
        data: {
          status: dto.resolution,
          resolvedById: admin.id,
          resolutionNote: dto.resolutionNote,
          resolvedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(
          'This dispute was already resolved by another admin. Please refresh.',
        );
      }

      const updatedDispute = await tx.dispute.findUniqueOrThrow({
        where: { orderId },
      });

      await tx.order.update({
        where: { id: orderId },
        data: buyerWins
          ? {
              status: OrderStatus.REFUNDED,
              escrowStatus: EscrowStatus.REFUNDED,
              refundedAt: new Date(),
            }
          : {
              status: OrderStatus.COMPLETED,
              escrowStatus: EscrowStatus.RELEASED,
              completedAt: new Date(),
            },
      });

      await tx.disputeEvent.create({
        data: {
          disputeId: updatedDispute.id,
          actorId: admin.id,
          action: 'RESOLVED',
          metadata: { resolution: dto.resolution, note: dto.resolutionNote ?? null },
        },
      });

      return updatedDispute;
    });

    this.logger.log(
      `Dispute for order ${order.trackingCode} resolved as ${dto.resolution} by admin ${admin.id}`,
    );

    this.eventEmitter.emit('dispute.resolved', {
      disputeId: resolvedDispute.id,
      orderId: order.id,
      trackingCode: order.trackingCode,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      resolution: dto.resolution,
      resolvedById: admin.id,
    });

    return this.format(resolvedDispute, order.trackingCode);
  }

  async findOne(orderId: string, user: AuthenticatedUser): Promise<DisputeResponseDto> {
    const canViewAllDisputes = user.role === UserRole.ADMIN;

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(canViewAllDisputes
          ? {}
          : {
              OR: [{ sellerId: user.id }, { buyerId: user.id }],
            }),
      },
      select: {
        id: true,
        trackingCode: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or access denied');
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { orderId },
    });

    if (!dispute) {
      throw new NotFoundException(`No dispute found for order ${orderId}`);
    }

    return this.format(dispute, order.trackingCode);
  }

  /**
   * Admin-only. Lists disputes across the whole platform, paginated.
   * The controller must keep @Roles(UserRole.ADMIN) on this route —
   * this method does not re-check anything the guard doesn't already
   * enforce, so don't expose it on an unguarded path.
   */
  async findAllForAdmin(
    admin: AuthenticatedUser,
    status?: DisputeStatus,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedDisputesDto> {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can list all disputes');
    }

    const safePage = Math.max(1, page);
    const safePageSize = Math.min(Math.max(1, pageSize), 100); // hard cap to prevent abuse

    const where: Prisma.DisputeWhereInput = status ? { status } : {};

    const [disputes, total] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({
        where,
        include: { order: { select: { trackingCode: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data: disputes.map((d: Dispute & { order: { trackingCode: string } }) =>
        this.format(d, d.order.trackingCode),
      ),
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  }

  /**
   * Scoped to the requesting user — only disputes on orders where they are
   * the buyer or the seller. This is the endpoint the disputes page should
   * call; previously there was no scoped list endpoint at all.
   */
  async findMyDisputes(
    user: AuthenticatedUser,
    status?: DisputeStatus,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedDisputesDto> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(Math.max(1, pageSize), 100);

    const where: Prisma.DisputeWhereInput = {
      ...(status ? { status } : {}),
      order: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
    };

    const [disputes, total] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({
        where,
        include: { order: { select: { trackingCode: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      // data: disputes.map((d) => this.format(d, d.order.trackingCode)),
      data: disputes.map((d: Dispute & { order: { trackingCode: string } }) =>
        this.format(d, d.order.trackingCode),
      ),
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  }

  private assertBuyer(order: OrderSummary, userId: string): void {
    if (order.buyerId !== userId) {
      throw new ForbiddenException('Only the buyer of this order can raise a dispute');
    }
  }

  private assertWithinDisputeWindow(order: OrderSummary): void {
    if (!order.deliveredAt) {
      // Defensive: shouldn't happen if status is DELIVERED, but don't let a
      // data inconsistency silently bypass the window check.
      throw new BadRequestException('Order has no delivery timestamp on record');
    }

    const elapsed = Date.now() - order.deliveredAt.getTime();
    if (elapsed > DISPUTE_WINDOW_MS) {
      throw new BadRequestException(
        `Dispute window has expired. Disputes must be raised within ${
          DISPUTE_WINDOW_MS / (60 * 60 * 1000)
        } hours of delivery.`,
      );
    }
  }

  private format(dispute: Dispute | DisputeWithOrder, trackingCode: string): DisputeResponseDto {
    return {
      id: dispute.id,
      orderId: dispute.orderId,
      trackingCode,
      reason: dispute.reason,
      description: dispute.description,
      evidence: dispute.evidence,
      status: dispute.status,
      raisedById: dispute.raisedById,
      resolvedById: dispute.resolvedById,
      resolutionNote: dispute.resolutionNote,
      resolvedAt: dispute.resolvedAt,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  }
}

// import {
//   BadRequestException,
//   ForbiddenException,
//   Injectable,
//   Logger,
//   NotFoundException,
// } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import {
//   Dispute,
//   DisputeStatus,
//   EscrowStatus,
//   OrderStatus,
//   Prisma,
//   UserRole,
// } from '@prisma/client';
// import { PrismaService } from '../../prisma/prisma.service';
// import { EscrowService } from '../escrow/escrow.service';
// import { RaiseDisputeDto } from './dto/raise-dispute.dto';
// import { DisputeResolution, ResolveDisputeDto } from './dto/resolve-dispute.dto';
// import { DisputeResponseDto } from './dto/dispute-response.dto';
// import { PaginatedDisputesDto } from './dto/paginated-disputes.dto';
// import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
// import { NotificationEvents } from '../notifications/notifications.events';
// import type { DisputeEventPayload } from '../notifications/notifications.events';

// const DISPUTE_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours after delivery

// type OrderSummary = {
//   id: string;
//   status: OrderStatus;
//   buyerId: string | null;
//   sellerId: string;
//   trackingCode: string;
//   deliveredAt: Date | null;
// };

// type DisputeWithOrder = Dispute & {
//   order?: {
//     trackingCode: string;
//   };
// };

// @Injectable()
// export class DisputesService {
//   private readonly logger = new Logger(DisputesService.name);

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly eventEmitter: EventEmitter2,
//     private readonly escrowService: EscrowService,
//   ) {}

//   async raise(
//     orderId: string,
//     dto: RaiseDisputeDto,
//     user: AuthenticatedUser,
//   ): Promise<DisputeResponseDto> {
//     const order = await this.prisma.order.findUnique({
//       where: { id: orderId },
//       select: {
//         id: true,
//         status: true,
//         buyerId: true,
//         sellerId: true,
//         trackingCode: true,
//         deliveredAt: true,
//       },
//     });

//     if (!order) {
//       throw new NotFoundException(`Order ${orderId} not found`);
//     }

//     this.assertBuyer(order, user.id);

//     if (order.status !== OrderStatus.DELIVERED) {
//       throw new BadRequestException(
//         `Disputes can only be raised on delivered orders. Current status: ${order.status}`,
//       );
//     }

//     this.assertWithinDisputeWindow(order);

//     try {
//       const dispute = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
//         const existingDispute = await tx.dispute.findUnique({
//           where: { orderId },
//           select: { id: true },
//         });

//         if (existingDispute) {
//           throw new BadRequestException('A dispute already exists for this order');
//         }

//         const createdDispute = await tx.dispute.create({
//           data: {
//             orderId,
//             raisedById: user.id,
//             reason: dto.reason,
//             description: dto.description,
//             evidence: dto.evidence ?? Prisma.JsonNull,
//             status: DisputeStatus.OPEN,
//           },
//         });

//         await tx.order.update({
//           where: { id: orderId },
//           data: {
//             status: OrderStatus.DISPUTED,
//             escrowStatus: EscrowStatus.DISPUTED,
//             disputedAt: new Date(),
//           },
//         });

//         await tx.disputeEvent.create({
//           data: {
//             disputeId: createdDispute.id,
//             actorId: user.id,
//             action: 'RAISED',
//             metadata: { reason: dto.reason },
//           },
//         });

//         return createdDispute;
//       });

//       this.logger.log(`Dispute raised for order ${order.trackingCode} by user ${user.id}`);

//       if (!order.buyerId) {
//         this.logger.warn(
//           `Dispute ${dispute.id} raised on order ${orderId} with no buyerId set — DISPUTE_OPENED event skipped`,
//         );
//       } else {
//         this.eventEmitter.emit(NotificationEvents.DISPUTE_OPENED, {
//           orderId: order.id,
//           trackingCode: order.trackingCode,
//           sellerId: order.sellerId,
//           buyerId: order.buyerId,
//           reason: dto.reason,
//         } as DisputeEventPayload);
//       }

//       try {
//         await this.escrowService.cancelAutoRelease(orderId);
//       } catch (err) {
//         const message = err instanceof Error ? err.message : String(err);
//         this.logger.warn(
//           `Could not cancel auto-release job for disputed order ${orderId}: ${message}`,
//         );
//       }

//       return this.format(dispute, order.trackingCode);
//     } catch (error) {
//       if (error instanceof BadRequestException) {
//         throw error;
//       }

//       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
//         throw new BadRequestException('A dispute already exists for this order');
//       }

//       this.logger.error(
//         `Failed to raise dispute for order ${orderId}`,
//         error instanceof Error ? error.stack : undefined,
//       );

//       throw error;
//     }
//   }

//   async resolve(
//     orderId: string,
//     dto: ResolveDisputeDto,
//     admin: AuthenticatedUser,
//   ): Promise<DisputeResponseDto> {
//     if (admin.role !== UserRole.ADMIN) {
//       throw new ForbiddenException('Only admins can resolve disputes');
//     }

//     const order = await this.prisma.order.findUnique({
//       where: { id: orderId },
//       select: {
//         id: true,
//         status: true,
//         trackingCode: true,
//         buyerId: true,
//         sellerId: true,
//       },
//     });

//     if (!order) {
//       throw new NotFoundException(`Order ${orderId} not found`);
//     }

//     if (order.status !== OrderStatus.DISPUTED) {
//       throw new BadRequestException(`Order is not disputed. Current status: ${order.status}`);
//     }

//     const dispute = await this.prisma.dispute.findUnique({
//       where: { orderId },
//     });

//     if (!dispute) {
//       throw new NotFoundException(`No dispute found for order ${orderId}`);
//     }

//     if (
//       dispute.status === DisputeStatus.RESOLVED_FOR_BUYER ||
//       dispute.status === DisputeStatus.RESOLVED_FOR_SELLER
//     ) {
//       throw new BadRequestException('This dispute has already been resolved');
//     }

//     const buyerWins = dto.resolution === DisputeResolution.RESOLVED_FOR_BUYER;

//     const resolvedDispute = await this.prisma.$transaction(
//       async (tx: Prisma.TransactionClient) => {
//         const updateResult = await tx.dispute.updateMany({
//           where: { orderId, status: DisputeStatus.OPEN },
//           data: {
//             status: dto.resolution,
//             resolvedById: admin.id,
//             resolutionNote: dto.resolutionNote,
//             resolvedAt: new Date(),
//           },
//         });

//         if (updateResult.count === 0) {
//           throw new BadRequestException(
//             'This dispute was already resolved by another admin. Please refresh.',
//           );
//         }

//         const updatedDispute = await tx.dispute.findUniqueOrThrow({
//           where: { orderId },
//         });

//         await tx.disputeEvent.create({
//           data: {
//             disputeId: updatedDispute.id,
//             actorId: admin.id,
//             action: 'RESOLVED',
//             metadata: { resolution: dto.resolution, note: dto.resolutionNote ?? null },
//           },
//         });

//         return updatedDispute;
//       },
//     );

//     try {
//       if (buyerWins) {
//         await this.escrowService.refundFunds({
//           orderId,
//           actorId: admin.id,
//           note:
//             dto.resolutionNote ??
//             'Dispute resolved in favour of buyer — full refund processed',
//         });
//       } else {
//         await this.escrowService.releaseFunds(
//           {
//             orderId,
//             reference: `DISPUTE-RELEASE-${orderId}-${Date.now()}`,
//             note: dto.resolutionNote ?? 'Dispute resolved in favour of seller — funds released',
//           },
//           'dispute',
//           admin.id,
//         );
//       }
//     } catch (err) {
//       const message = err instanceof Error ? err.message : String(err);
//       this.logger.error(
//         `Dispute ${resolvedDispute.id} on order ${orderId} was marked ${dto.resolution}, ` +
//           `but the escrow action failed: ${message}. Funds were NOT moved — manual intervention required.`,
//       );
//       throw err;
//     }

//     this.logger.log(
//       `Dispute for order ${order.trackingCode} resolved as ${dto.resolution} by admin ${admin.id}`,
//     );

//     if (!order.buyerId) {
//       this.logger.warn(
//         `Dispute ${resolvedDispute.id} resolved on order ${orderId} with no buyerId set — DISPUTE_RESOLVED event skipped`,
//       );
//     } else {
//       this.eventEmitter.emit(NotificationEvents.DISPUTE_RESOLVED, {
//         orderId: order.id,
//         trackingCode: order.trackingCode,
//         sellerId: order.sellerId,
//         buyerId: order.buyerId,
//         reason: dispute.reason,
//         resolution: dto.resolution,
//       } as DisputeEventPayload);
//     }

//     return this.format(resolvedDispute, order.trackingCode);
//   }

//   async findOne(orderId: string, user: AuthenticatedUser): Promise<DisputeResponseDto> {
//     const canViewAllDisputes = user.role === UserRole.ADMIN;

//     const order = await this.prisma.order.findFirst({
//       where: {
//         id: orderId,
//         ...(canViewAllDisputes
//           ? {}
//           : {
//               OR: [{ sellerId: user.id }, { buyerId: user.id }],
//             }),
//       },
//       select: {
//         id: true,
//         trackingCode: true,
//       },
//     });

//     if (!order) {
//       throw new NotFoundException('Order not found or access denied');
//     }

//     const dispute = await this.prisma.dispute.findUnique({
//       where: { orderId },
//     });

//     if (!dispute) {
//       throw new NotFoundException(`No dispute found for order ${orderId}`);
//     }

//     return this.format(dispute, order.trackingCode);
//   }

//   async findAllForAdmin(
//     admin: AuthenticatedUser,
//     status?: DisputeStatus,
//     page = 1,
//     pageSize = 20,
//   ): Promise<PaginatedDisputesDto> {
//     if (admin.role !== UserRole.ADMIN) {
//       throw new ForbiddenException('Only admins can list all disputes');
//     }

//     const safePage = Math.max(1, page);
//     const safePageSize = Math.min(Math.max(1, pageSize), 100);

//     const where: Prisma.DisputeWhereInput = status ? { status } : {};

//     const [disputes, total] = await this.prisma.$transaction([
//       this.prisma.dispute.findMany({
//         where,
//         include: { order: { select: { trackingCode: true } } },
//         orderBy: { createdAt: 'desc' },
//         skip: (safePage - 1) * safePageSize,
//         take: safePageSize,
//       }),
//       this.prisma.dispute.count({ where }),
//     ]);

//     return {
//       data: disputes.map((d: Dispute & { order: { trackingCode: string } }) =>
//         this.format(d, d.order.trackingCode),
//       ),
//       total,
//       page: safePage,
//       pageSize: safePageSize,
//       totalPages: Math.ceil(total / safePageSize),
//     };
//   }

//   async findMyDisputes(
//     user: AuthenticatedUser,
//     status?: DisputeStatus,
//     page = 1,
//     pageSize = 20,
//   ): Promise<PaginatedDisputesDto> {
//     const safePage = Math.max(1, page);
//     const safePageSize = Math.min(Math.max(1, pageSize), 100);

//     const where: Prisma.DisputeWhereInput = {
//       ...(status ? { status } : {}),
//       order: {
//         OR: [{ buyerId: user.id }, { sellerId: user.id }],
//       },
//     };

//     const [disputes, total] = await this.prisma.$transaction([
//       this.prisma.dispute.findMany({
//         where,
//         include: { order: { select: { trackingCode: true } } },
//         orderBy: { createdAt: 'desc' },
//         skip: (safePage - 1) * safePageSize,
//         take: safePageSize,
//       }),
//       this.prisma.dispute.count({ where }),
//     ]);

//     return {
//       data: disputes.map((d: Dispute & { order: { trackingCode: string } }) =>
//         this.format(d, d.order.trackingCode),
//       ),
//       total,
//       page: safePage,
//       pageSize: safePageSize,
//       totalPages: Math.ceil(total / safePageSize),
//     };
//   }

//   private assertBuyer(order: OrderSummary, userId: string): void {
//     if (order.buyerId !== userId) {
//       throw new ForbiddenException('Only the buyer of this order can raise a dispute');
//     }
//   }

//   private assertWithinDisputeWindow(order: OrderSummary): void {
//     if (!order.deliveredAt) {
//       throw new BadRequestException('Order has no delivery timestamp on record');
//     }

//     const elapsed = Date.now() - order.deliveredAt.getTime();
//     if (elapsed > DISPUTE_WINDOW_MS) {
//       throw new BadRequestException(
//         `Dispute window has expired. Disputes must be raised within ${
//           DISPUTE_WINDOW_MS / (60 * 60 * 1000)
//         } hours of delivery.`,
//       );
//     }
//   }

//   private format(dispute: Dispute | DisputeWithOrder, trackingCode: string): DisputeResponseDto {
//     return {
//       id: dispute.id,
//       orderId: dispute.orderId,
//       trackingCode,
//       reason: dispute.reason,
//       description: dispute.description,
//       evidence: dispute.evidence,
//       status: dispute.status,
//       raisedById: dispute.raisedById,
//       resolvedById: dispute.resolvedById,
//       resolutionNote: dispute.resolutionNote,
//       resolvedAt: dispute.resolvedAt,
//       createdAt: dispute.createdAt,
//       updatedAt: dispute.updatedAt,
//     };
//   }
// }