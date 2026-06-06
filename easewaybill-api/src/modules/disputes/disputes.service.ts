import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { ResolveDisputeDto, DisputeResolution } from './dto/resolve-dispute.dto';
import { DisputeResponseDto } from './dto/dispute-response.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── POST /orders/:id/dispute ──────────────────────────────────────
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
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Only BUYER can raise a dispute
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).buyerId !== user.id) {
      throw new ForbiddenException('Only the buyer of this order can raise a dispute');
    }

    // Can only dispute a DELIVERED order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).status !== 'DELIVERED') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Disputes can only be raised on delivered orders. Current status: ${(order as any).status}`,
      );
    }

    // Check no existing dispute
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (this.prisma as any).dispute.findUnique({
      where: { orderId },
    });

    if (existing) {
      throw new BadRequestException('A dispute already exists for this order');
    }

    // Create dispute and update order status atomically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispute = await this.prisma.$transaction(async (tx: any) => {
      const created = await tx.dispute.create({
        data: {
          orderId,
          raisedById: user.id,
          reason: dto.reason,
          description: dto.description,
          evidence: dto.evidence ?? [],
          status: 'OPEN',
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'DISPUTED',
          escrowStatus: 'DISPUTED',
          disputedAt: new Date(),
        },
      });

      return created;
    });

    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `Dispute raised on order ${(order as any).trackingCode} by buyer [${user.id}]`,
    );

    return this.format(dispute, (order as any).trackingCode);
  }

  // ── PATCH /orders/:id/dispute ─────────────────────────────────────
  async resolve(
    orderId: string,
    dto: ResolveDisputeDto,
    admin: AuthenticatedUser,
  ): Promise<DisputeResponseDto> {
    if (admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can resolve disputes');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, trackingCode: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).status !== 'DISPUTED') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Order is not in DISPUTED status. Current: ${(order as any).status}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispute = await (this.prisma as any).dispute.findUnique({
      where: { orderId },
    });

    if (!dispute) {
      throw new NotFoundException(`No dispute found for order ${orderId}`);
    }

    if (dispute.status === 'RESOLVED_FOR_BUYER' || dispute.status === 'RESOLVED_FOR_SELLER') {
      throw new BadRequestException('This dispute has already been resolved');
    }

    // Determine final order status based on resolution
    const isBuyerWins = dto.resolution === DisputeResolution.RESOLVED_FOR_BUYER;

    const finalOrderStatus = isBuyerWins ? 'REFUNDED' : 'COMPLETED';
    const finalEscrowStatus = isBuyerWins ? 'REFUNDED' : 'RELEASED';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolved = await this.prisma.$transaction(async (tx: any) => {
      const updatedDispute = await tx.dispute.update({
        where: { orderId },
        data: {
          status: dto.resolution,
          resolvedById: admin.id,
          resolutionNote: dto.resolutionNote,
          resolvedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: finalOrderStatus,
          escrowStatus: finalEscrowStatus,
          ...(isBuyerWins ? { refundedAt: new Date() } : { completedAt: new Date() }),
        },
      });

      return updatedDispute;
    });

    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `Dispute on order ${(order as any).trackingCode} resolved: ${dto.resolution} by admin [${admin.id}]`,
    );

    return this.format(resolved, (order as any).trackingCode);
  }

  // ── GET /orders/:id/dispute ───────────────────────────────────────
  async findOne(orderId: string, user: AuthenticatedUser): Promise<DisputeResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(user.role !== 'ADMIN' && {
          OR: [{ sellerId: user.id }, { buyerId: user.id }],
        }),
      },
      select: { id: true, trackingCode: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispute = await (this.prisma as any).dispute.findUnique({
      where: { orderId },
    });

    if (!dispute) {
      throw new NotFoundException(`No dispute found for order ${orderId}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.format(dispute, (order as any).trackingCode);
  }

  // ── GET /disputes (ADMIN) ─────────────────────────────────────────
  async findAll(status?: string): Promise<DisputeResponseDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const disputes = await (this.prisma as any).dispute.findMany({
      where: status ? { status } : {},
      include: {
        order: { select: { trackingCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return disputes.map((d: any) => this.format(d, d.order?.trackingCode ?? ''));
  }

  // ── Helper ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private format(dispute: any, trackingCode: string): DisputeResponseDto {
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
