// import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { FilterOrdersDto } from './dto/filter-orders.dto';
// import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
// import { OrderResponseDto } from './dto/order-response.dto';
// import { PaginatedResult, paginate, buildCursorWhere } from '../../common/dto/pagination.dto';
// import { validateTransition } from './order-state-machine';
// import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
// import { customAlphabet } from 'nanoid';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { NotificationEvents, OrderEventPayload } from '../notifications/notifications.events';
// import { EscrowService } from '@modules/escrow/escrow.service';

// const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// const PLATFORM_FEE_PERCENT = 0.05;
// const RIDER_DELIVERY_PERCENT = 0.9;

// const ORDER_INCLUDE = {
//   items: true,
//   waybills: {
//     select: {
//       id: true,
//       waybillNumber: true,
//       status: true,
//       pdfUrl: true,
//       generatedAt: true,
//     },
//   },
//   seller: {
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       email: true,
//       phone: true,
//     },
//   },
//   buyer: {
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       email: true,
//       phone: true,
//     },
//   },
//   rider: {
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       phone: true,
//       vehicleType: true,
//       vehiclePlate: true,
//     },
//   },
// };

// @Injectable()
// export class OrdersService {
//   private readonly logger = new Logger(OrdersService.name);

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly eventEmitter: EventEmitter2,
//     private readonly escrow: EscrowService,
//   ) {}

//   // ── POST /orders ─────────────────────────────────────────────────
//   async create(dto: CreateOrderDto, seller: AuthenticatedUser): Promise<OrderResponseDto> {
//     const sellerUser = await this.prisma.user.findUnique({
//       where: { id: seller.id },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         phone: true,
//         accountStatus: true,
//       },
//     });

//     if (!sellerUser || !sellerUser.accountStatus) {
//       throw new NotFoundException('Seller account not found or deactivated');
//     }

//     const itemPrice = dto.itemPrice;
//     const deliveryFee = dto.deliveryFee ?? 0;
//     const totalAmount = parseFloat((itemPrice + deliveryFee).toFixed(2));
//     const platformFee = parseFloat((totalAmount * PLATFORM_FEE_PERCENT).toFixed(2));
//     const sellerPayout = parseFloat((totalAmount - platformFee).toFixed(2));
//     const riderPayout = parseFloat((deliveryFee * RIDER_DELIVERY_PERCENT).toFixed(2));

//     const trackingCode = `EW-${nanoid()}`;
//     const waybillNumber = `WB-${nanoid()}`;

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const created = await this.prisma.$transaction(async (tx: any) => {
//       const createdOrder = await tx.order.create({
//         data: {
//           trackingCode,
//           description: dto.description,
//           dimensions: dto.dimensions,
//           fragile: dto.fragile ?? false,
//           pickupAddress: dto.pickupAddress,
//           pickupLat: dto.pickupLat,
//           pickupLng: dto.pickupLng,
//           deliveryAddress: dto.deliveryAddress,
//           deliveryLat: dto.deliveryLat,
//           deliveryLng: dto.deliveryLng,
//           buyerEmail: dto.buyerEmail,
//           buyerName: dto.buyerName,
//           buyerPhone: dto.buyerPhone,
//           itemPrice,
//           deliveryFee,
//           totalAmount,
//           platformFee,
//           sellerPayout,
//           riderPayout,
//           sellerId: sellerUser.id,
//           // ✅ FIX: skip DRAFT entirely — go directly to PENDING_BUYER
//           // so the buyer sees the order immediately without a separate
//           // sendToBuyer call from the frontend
//           status: 'PENDING_BUYER',
//           sentToBuyerAt: new Date(),
//           escrowStatus: 'PENDING',
//         },
//       });

//       await tx.orderItem.createMany({
//         data: dto.items.map((item) => ({
//           orderId: createdOrder.id,
//           name: item.name,
//           description: item.description,
//           quantity: item.quantity ?? 1,
//           unitPrice: item.unitPrice,
//           weight: item.weight,
//           fragile: item.fragile ?? false,
//         })),
//       });

//       const totalWeight = dto.items.reduce(
//         (sum, item) => sum + (item.weight ?? 0) * (item.quantity ?? 1),
//         0,
//       );

//       await tx.waybill.create({
//         data: {
//           waybillNumber,
//           orderId: createdOrder.id,
//           status: 'GENERATED',
//           sellerName: `${sellerUser.firstName} ${sellerUser.lastName}`,
//           sellerPhone: sellerUser.phone ?? '',
//           sellerAddress: dto.pickupAddress,
//           buyerName: dto.buyerName ?? 'Pending confirmation',
//           buyerPhone: dto.buyerPhone ?? '',
//           buyerAddress: dto.deliveryAddress,
//           description: dto.description,
//           weight: totalWeight > 0 ? totalWeight : null,
//           dimensions: dto.dimensions,
//           declaredValue: itemPrice,
//           fragile: dto.fragile ?? false,
//           notes: dto.items.map((i) => `${i.quantity ?? 1}x ${i.name}`).join(', '),
//         },
//       });

//       return tx.order.findUniqueOrThrow({
//         where: { id: createdOrder.id },
//         include: ORDER_INCLUDE,
//       });
//     });

//     this.logger.log(
//       `Order created: ${created.trackingCode} | Waybill: ${waybillNumber} | Seller: ${seller.id} | Status: PENDING_BUYER`,
//     );

//     // ✅ FIX: emit ORDER_SENT_TO_BUYER (not ORDER_CREATED) so the buyer
//     // gets an in-app notification immediately and can confirm the order
//     this.eventEmitter.emit(NotificationEvents.ORDER_SENT_TO_BUYER, {
//       orderId: created.id,
//       trackingCode: created.trackingCode,
//       sellerId: created.sellerId,
//       buyerId: created.buyerId,
//       buyerEmail: dto.buyerEmail,
//       status: created.status,
//     } as OrderEventPayload);

//     return created as unknown as OrderResponseDto;
//   }

//   // ── GET /orders ──────────────────────────────────────────────────
//   async findAll(
//     user: AuthenticatedUser,
//     dto: FilterOrdersDto,
//   ): Promise<PaginatedResult<OrderResponseDto>> {
//     const limit = dto.limit ?? 20;
//     const cursorWhere = buildCursorWhere(dto.cursor);

//     // Match by ACTUAL ORDER PARTICIPATION, not account.role.
//     // A user's account role field is cosmetic — what matters is whether
//     // they are the seller, buyer, or rider ON THIS SPECIFIC ORDER.
//     // Also surfaces PENDING_BUYER orders where the user is the intended
//     // buyer (matched by email) before buyerId is linked.
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const roleWhere: any =
//       user.role === 'ADMIN'
//         ? {}
//         : {
//             OR: [
//               { sellerId: user.id },
//               { buyerId: user.id },
//               { riderId: user.id },
//               { buyerEmail: user.email, status: 'PENDING_BUYER' },
//             ],
//           };

//     const where = {
//       ...roleWhere,
//       ...cursorWhere,
//       ...(dto.status && { status: dto.status }),
//       ...(dto.search && {
//         OR: [
//           {
//             trackingCode: {
//               contains: dto.search,
//               mode: 'insensitive' as const,
//             },
//           },
//           {
//             buyerEmail: {
//               contains: dto.search,
//               mode: 'insensitive' as const,
//             },
//           },
//         ],
//       }),
//       ...((dto.dateFrom ?? dto.dateTo) && {
//         createdAt: {
//           ...(dto.dateFrom && { gte: new Date(dto.dateFrom) }),
//           ...(dto.dateTo && { lte: new Date(dto.dateTo) }),
//         },
//       }),
//     };

//     const [orders, total] = await Promise.all([
//       this.prisma.order.findMany({
//         where,
//         include: ORDER_INCLUDE,
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//       }),
//       this.prisma.order.count({ where: roleWhere }),
//     ]);

//     return paginate(orders as unknown as (OrderResponseDto & { id: string })[], total, limit);
//   }

//   // ── GET /orders/:id ──────────────────────────────────────────────
//   async findOne(id: string, user: AuthenticatedUser): Promise<OrderResponseDto> {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const roleWhere: any =
//       user.role === 'ADMIN'
//         ? { id }
//         : {
//             id,
//             OR: [
//               { sellerId: user.id },
//               { buyerId: user.id },
//               { riderId: user.id },
//               { buyerEmail: user.email, status: 'PENDING_BUYER' },
//             ],
//           };

//     const order = await this.prisma.order.findFirst({
//       where: roleWhere,
//       include: ORDER_INCLUDE,
//     });

//     if (!order) {
//       throw new NotFoundException(`Order ${id} not found`);
//     }

//     return order as unknown as OrderResponseDto;
//   }

//   // ── PATCH /orders/:id/status ─────────────────────────────────────
//   async updateStatus(
//     id: string,
//     dto: UpdateOrderStatusDto,
//     user: AuthenticatedUser,
//   ): Promise<OrderResponseDto> {
//     const order = await this.prisma.order.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         status: true,
//         sellerId: true,
//         buyerId: true,
//         riderId: true,
//         trackingCode: true,
//       },
//     });

//     if (!order) {
//       throw new NotFoundException(`Order ${id} not found`);
//     }

//     if (user.role !== 'ADMIN') {
//       const isParty =
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (order as any).sellerId === user.id ||
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (order as any).buyerId === user.id ||
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (order as any).riderId === user.id;

//       if (!isParty) {
//         throw new NotFoundException(`Order ${id} not found`);
//       }
//     }

//     // ✅ Use contextual role (relationship to this order) not account role
//     const contextualRole = this.getContextualRole(order, user);
//     validateTransition(order.status, dto.status, contextualRole);

//     const timestampUpdate = this.getTimestampForStatus(dto.status);

//     const updated = await this.prisma.order.update({
//       where: { id },
//       data: {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         status: dto.status as any,
//         ...timestampUpdate,
//       },
//       include: ORDER_INCLUDE,
//     });

//     // ✅ Release escrow automatically when buyer confirms receipt
//     // if (dto.status === 'COMPLETED') {
//     //   try {
//     //     await this.escrow.releaseFunds({
//     //       orderId: id,
//     //       reference: `RELEASE-${id}-${Date.now()}`,
//     //       note: `Buyer confirmed receipt — escrow released for order ${order.trackingCode}`,
//     //     });
//     //     this.logger.log(`Escrow released for order ${order.trackingCode} [${id}]`);
//     //   } catch (escrowErr) {
//     //     const msg = escrowErr instanceof Error ? escrowErr.message : String(escrowErr);
//     //     if (msg.includes('already released') || msg.includes('already exists')) {
//     //       this.logger.log(`Escrow already released for order ${id} — skipping`);
//     //     } else {
//     //       // Log but don't fail the status update — order IS completed
//     //       this.logger.error(`Escrow release failed for order ${id}: ${msg}`);
//     //     }
//     //   }
//     // }
//     // In updateStatus(), replace the escrow release block with:
//     if (dto.status === 'COMPLETED') {
//       try {
//         await this.escrow.releaseFunds({
//           orderId: id,
//           reference: `RELEASE-${id}-${Date.now()}`,
//           note: `Buyer confirmed receipt — escrow released for order ${order.trackingCode}`,
//         });
//         this.logger.log(`Escrow released for order ${order.trackingCode} [${id}]`);
//       } catch (escrowErr) {
//         const msg = escrowErr instanceof Error ? escrowErr.message : String(escrowErr);

//         // ✅ These are all safe to ignore — order is completed regardless
//         const isSafeError =
//           msg.includes('already released') ||
//           msg.includes('already exists') ||
//           msg.includes('No active escrow hold') ||
//           msg.includes('not found');

//         if (isSafeError) {
//           this.logger.warn(
//             `Escrow release skipped for order ${id} — ${msg}. Order status is COMPLETED.`,
//           );
//         } else {
//           // Genuinely unexpected error — log but still don't fail the completion
//           this.logger.error(
//             `Escrow release failed for order ${id}: ${msg} — order remains COMPLETED`,
//           );
//         }
//       }
//     }

//     this.logger.log(
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       `Order ${(order as any).trackingCode} status: ${order.status} → ${dto.status} by [${user.id}] (contextual role: ${contextualRole})`,
//     );

//     const eventMap: Partial<Record<string, string>> = {
//       PENDING_BUYER: NotificationEvents.ORDER_SENT_TO_BUYER,
//       AWAITING_PAYMENT: NotificationEvents.ORDER_CONFIRMED,
//       PAID: NotificationEvents.ORDER_PAID,
//       SHIPPED: NotificationEvents.ORDER_SHIPPED,
//       IN_TRANSIT: NotificationEvents.ORDER_PICKED_UP,
//       DELIVERED: NotificationEvents.ORDER_DELIVERED,
//       COMPLETED: NotificationEvents.ORDER_COMPLETED,
//       CANCELLED: NotificationEvents.ORDER_CANCELLED,
//       DISPUTED: NotificationEvents.ORDER_DISPUTED,
//     };

//     const eventName = eventMap[dto.status];
//     if (eventName) {
//       this.eventEmitter.emit(eventName, {
//         orderId: updated.id,
//         trackingCode: updated.trackingCode,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         sellerId: (updated as any).sellerId,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         buyerId: (updated as any).buyerId,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         riderId: (updated as any).riderId,
//         status: updated.status,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         totalAmount: parseFloat(String((updated as any).totalAmount)),
//       } as OrderEventPayload);
//     }

//     return updated as unknown as OrderResponseDto;
//   }

//   // ── Timestamp helper ─────────────────────────────────────────────
//   private getTimestampForStatus(status: string): Record<string, Date> {
//     const now = new Date();
//     const map: Record<string, Record<string, Date>> = {
//       PAID: { paidAt: now },
//       SHIPPED: { shippedAt: now },
//       IN_TRANSIT: { pickedUpAt: now },
//       DELIVERED: { deliveredAt: now },
//       COMPLETED: { completedAt: now },
//       CANCELLED: { cancelledAt: now },
//       DISPUTED: { disputedAt: now },
//       REFUNDED: { refundedAt: now },
//       PENDING_BUYER: { sentToBuyerAt: now },
//       AWAITING_PAYMENT: { buyerConfirmedAt: now },
//     };
//     return map[status] ?? {};
//   }

//   // ── POST /orders/:id/confirm ─────────────────────────────────────
//   async confirmByBuyer(id: string, buyer: AuthenticatedUser): Promise<OrderResponseDto> {
//     this.logger.log({
//       buyerId: buyer.id,
//       buyerEmail: buyer.email,
//     });
//     const order = await this.prisma.order.findFirst({
//       where: {
//         id,
//         buyerEmail: buyer.email,
//       },
//       select: {
//         id: true,
//         status: true,
//         buyerId: true,
//         trackingCode: true,
//       },
//     });
//     this.logger.log(order);

//     if (!order) {
//       throw new NotFoundException(
//         'Order not found or your email does not match the buyer email on this order',
//       );
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     if ((order as any).status !== 'PENDING_BUYER') {
//       throw new BadRequestException(
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         `Order cannot be confirmed — current status is ${(order as any).status}`,
//       );
//     }

//     const updated = await this.prisma.order.update({
//       where: { id },
//       data: {
//         buyerId: buyer.id,
//         buyerConfirmedAt: new Date(),
//         status: 'AWAITING_PAYMENT',
//       },
//       include: ORDER_INCLUDE,
//     });

//     this.logger.log(
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       `Order ${(order as any).trackingCode} confirmed by buyer [${buyer.id}]`,
//     );

//     this.eventEmitter.emit(NotificationEvents.ORDER_CONFIRMED, {
//       orderId: updated.id,
//       trackingCode: updated.trackingCode,
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       sellerId: (updated as any).sellerId,
//       buyerId: buyer.id,
//       status: updated.status,
//     } as OrderEventPayload);

//     return updated as unknown as OrderResponseDto;
//   }

//   // ── POST /orders/:id/assign-rider ────────────────────────────────
//   async assignRider(
//     id: string,
//     riderId: string,
//     _admin: AuthenticatedUser,
//   ): Promise<OrderResponseDto> {
//     const order = await this.prisma.order.findUnique({
//       where: { id },
//       select: { id: true, status: true },
//     });

//     if (!order) {
//       throw new NotFoundException(`Order ${id} not found`);
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     if ((order as any).status !== 'SHIPPED') {
//       throw new BadRequestException('Rider can only be assigned when order is SHIPPED');
//     }

//     const rider = await this.prisma.user.findUnique({
//       where: { id: riderId },
//       select: { id: true, accountStatus: true },
//     });

//     if (!rider || !rider.accountStatus) {
//       throw new NotFoundException(`Rider ${riderId} not found or inactive`);
//     }

//     const updated = await this.prisma.order.update({
//       where: { id },
//       data: { riderId },
//       include: ORDER_INCLUDE,
//     });

//     this.logger.log(`Rider [${riderId}] assigned to order [${id}]`);

//     return updated as unknown as OrderResponseDto;
//   }

//   // ── Contextual role resolver ──────────────────────────────────────
//   // Permissions are based on the user's relationship to THIS order,
//   // not their account's global role field.
//   // Same user can be SELLER on Order A and BUYER on Order B.
//   private getContextualRole(
//     order: {
//       sellerId: string;
//       buyerId?: string | null;
//       riderId?: string | null;
//     },
//     user: AuthenticatedUser,
//   ): 'ADMIN' | 'SELLER' | 'BUYER' | 'RIDER' | 'NONE' {
//     if (user.role === 'ADMIN') {
//       return 'ADMIN';
//     }

//     if (order.sellerId === user.id) {
//       return 'SELLER';
//     }

//     if (order.buyerId === user.id) {
//       return 'BUYER';
//     }

//     if (order.riderId === user.id) {
//       return 'RIDER';
//     }

//     return 'NONE';
//   }
// }

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaginatedResult, paginate, buildCursorWhere } from '../../common/dto/pagination.dto';
import { validateTransition } from './order-state-machine';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { customAlphabet } from 'nanoid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvents, OrderEventPayload } from '../notifications/notifications.events';
import { EscrowService } from '../escrow/escrow.service';
import { Prisma, OrderStatus, EscrowStatus } from '@prisma/client';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const PLATFORM_FEE_PERCENT = 0.05;
const RIDER_DELIVERY_PERCENT = 0.9;

// ── Prisma include shape — used in all order queries ─────────────
const ORDER_INCLUDE = {
  items: true,
  waybills: {
    select: {
      id: true,
      waybillNumber: true,
      status: true,
      pdfUrl: true,
      generatedAt: true,
    },
  },
  seller: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  buyer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  rider: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      vehicleType: true,
      vehiclePlate: true,
    },
  },
} satisfies Prisma.OrderInclude;

// ── Contextual role type — independent of UserRole account enum ──
type ContextualRole = 'ADMIN' | 'SELLER' | 'BUYER' | 'RIDER' | 'NONE';

// ── Subset of Order fields needed for role resolution ────────────
interface OrderParties {
  sellerId: string;
  buyerId: string | null;
  riderId: string | null;
}

// ── Subset of Order fields needed for updateStatus ───────────────
interface OrderForUpdate extends OrderParties {
  id: string;
  status: OrderStatus;
  trackingCode: string;
  escrowStatus: EscrowStatus;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly escrow: EscrowService,
  ) {}

  // ── POST /orders ─────────────────────────────────────────────────
  async create(dto: CreateOrderDto, seller: AuthenticatedUser): Promise<OrderResponseDto> {
    const sellerUser = await this.prisma.user.findUnique({
      where: { id: seller.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        accountStatus: true,
      },
    });

    if (!sellerUser || sellerUser.accountStatus !== 'ACTIVE') {
      throw new NotFoundException('Seller account not found or deactivated');
    }

    const itemPrice = dto.itemPrice;
    const deliveryFee = dto.deliveryFee ?? 0;
    const totalAmount = parseFloat((itemPrice + deliveryFee).toFixed(2));
    const platformFee = parseFloat((totalAmount * PLATFORM_FEE_PERCENT).toFixed(2));
    const sellerPayout = parseFloat((totalAmount - platformFee).toFixed(2));
    const riderPayout = parseFloat((deliveryFee * RIDER_DELIVERY_PERCENT).toFixed(2));

    const trackingCode = `EW-${nanoid()}`;
    const waybillNumber = `WB-${nanoid()}`;

    const created = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          trackingCode,
          description: dto.description,
          dimensions: dto.dimensions,
          fragile: dto.fragile ?? false,
          pickupAddress: dto.pickupAddress,
          pickupLat: dto.pickupLat,
          pickupLng: dto.pickupLng,
          deliveryAddress: dto.deliveryAddress,
          deliveryLat: dto.deliveryLat,
          deliveryLng: dto.deliveryLng,
          buyerEmail: dto.buyerEmail,
          buyerName: dto.buyerName,
          buyerPhone: dto.buyerPhone,
          itemPrice,
          deliveryFee,
          totalAmount,
          platformFee,
          sellerPayout,
          riderPayout,
          sellerId: sellerUser.id,
          status: OrderStatus.PENDING_BUYER,
          sentToBuyerAt: new Date(),
          escrowStatus: EscrowStatus.PENDING,
        },
      });

      await tx.orderItem.createMany({
        data: dto.items.map((item) => ({
          orderId: createdOrder.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice,
          weight: item.weight,
          fragile: item.fragile ?? false,
        })),
      });

      const totalWeight = dto.items.reduce(
        (sum, item) => sum + (item.weight ?? 0) * (item.quantity ?? 1),
        0,
      );

      await tx.waybill.create({
        data: {
          waybillNumber,
          orderId: createdOrder.id,
          status: 'GENERATED',
          sellerName: `${sellerUser.firstName} ${sellerUser.lastName}`,
          sellerPhone: sellerUser.phone ?? '',
          sellerAddress: dto.pickupAddress,
          buyerName: dto.buyerName ?? 'Pending confirmation',
          buyerPhone: dto.buyerPhone ?? '',
          buyerAddress: dto.deliveryAddress,
          description: dto.description,
          weight: totalWeight > 0 ? totalWeight : null,
          dimensions: dto.dimensions,
          declaredValue: itemPrice,
          fragile: dto.fragile ?? false,
          notes: dto.items.map((i) => `${i.quantity ?? 1}x ${i.name}`).join(', '),
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: createdOrder.id },
        include: ORDER_INCLUDE,
      });
    });

    this.logger.log(
      `Order created: ${created.trackingCode} | Waybill: ${waybillNumber} | Seller: ${seller.id} | Status: PENDING_BUYER`,
    );

    this.eventEmitter.emit(NotificationEvents.ORDER_SENT_TO_BUYER, {
      orderId: created.id,
      trackingCode: created.trackingCode,
      sellerId: created.sellerId,
      buyerId: created.buyerId,
      buyerEmail: dto.buyerEmail,
      status: created.status,
    } satisfies OrderEventPayload);

    return created as unknown as OrderResponseDto;
  }

  // ── GET /orders ──────────────────────────────────────────────────
  async findAll(
    user: AuthenticatedUser,
    dto: FilterOrdersDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const limit = dto.limit ?? 20;
    const cursorWhere = buildCursorWhere(dto.cursor);

    const roleWhere: Prisma.OrderWhereInput =
      user.role === 'ADMIN'
        ? {}
        : {
            OR: [
              { sellerId: user.id },
              { buyerId: user.id },
              { riderId: user.id },
              { buyerEmail: user.email, status: OrderStatus.PENDING_BUYER },
            ],
          };

    const searchWhere: Prisma.OrderWhereInput = dto.search
      ? {
          OR: [
            { trackingCode: { contains: dto.search, mode: 'insensitive' } },
            { buyerEmail: { contains: dto.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const dateWhere: Prisma.OrderWhereInput =
      (dto.dateFrom ?? dto.dateTo)
        ? {
            createdAt: {
              ...(dto.dateFrom && { gte: new Date(dto.dateFrom) }),
              ...(dto.dateTo && { lte: new Date(dto.dateTo) }),
            },
          }
        : {};

    const where: Prisma.OrderWhereInput = {
      ...roleWhere,
      ...cursorWhere,
      ...(dto.status && { status: dto.status as OrderStatus }),
      ...searchWhere,
      ...dateWhere,
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.order.count({ where: roleWhere }),
    ]);

    return paginate(orders as unknown as (OrderResponseDto & { id: string })[], total, limit);
  }

  // ── GET /orders/:id ──────────────────────────────────────────────
  async findOne(id: string, user: AuthenticatedUser): Promise<OrderResponseDto> {
    const roleWhere: Prisma.OrderWhereInput =
      user.role === 'ADMIN'
        ? { id }
        : {
            id,
            OR: [
              { sellerId: user.id },
              { buyerId: user.id },
              { riderId: user.id },
              { buyerEmail: user.email, status: OrderStatus.PENDING_BUYER },
            ],
          };

    const order = await this.prisma.order.findFirst({
      where: roleWhere,
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order as unknown as OrderResponseDto;
  }

  // ── PATCH /orders/:id/status ─────────────────────────────────────
  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        sellerId: true,
        buyerId: true,
        riderId: true,
        trackingCode: true,
        escrowStatus: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (user.role !== 'ADMIN') {
      const isParty =
        order.sellerId === user.id || order.buyerId === user.id || order.riderId === user.id;

      if (!isParty) {
        throw new NotFoundException(`Order ${id} not found`);
      }
    }

    const contextualRole = this.getContextualRole(order, user);
    validateTransition(order.status, dto.status, contextualRole);

    // ── COMPLETED: escrow handles the status update ───────────────
    // releaseFunds() atomically:
    //   1. Finds the ESCROW_HOLD transaction
    //   2. Creates a FULL_RELEASE transaction
    //   3. Sets order.status = COMPLETED
    //   4. Sets order.escrowStatus = RELEASED
    //   5. Sets order.completedAt = now()
    // We must NOT call order.update({ status: COMPLETED }) ourselves.
    if (dto.status === 'COMPLETED') {
      if (order.escrowStatus === EscrowStatus.HOLDING) {
        this.logger.log(`Order ${order.trackingCode}: buyer confirmed receipt — releasing escrow`);

        await this.escrow.releaseFunds(
          {
            orderId: id,
            reference: `BUYER-RELEASE-${id}-${Date.now()}`,
            note: `Buyer confirmed receipt for order ${order.trackingCode}`,
          },
          'buyer', // ← typed literal, not user.id
        );

        this.logger.log(`Escrow released for order ${order.trackingCode} [${id}]`);
      } else {
        // No active escrow hold — update status directly
        // (handles test orders, admin overrides, edge cases)
        this.logger.warn(
          `Order ${order.trackingCode} escrowStatus is '${order.escrowStatus}' — ` +
            `marking COMPLETED without escrow release`,
        );

        const timestamps = this.getTimestampForStatus('COMPLETED');
        await this.prisma.order.update({
          where: { id },
          data: { status: OrderStatus.COMPLETED, ...timestamps },
        });
      }

      // Fetch final state after escrow OR direct update
      const completed = await this.prisma.order.findUniqueOrThrow({
        where: { id },
        include: ORDER_INCLUDE,
      });

      this.logger.log(
        `Order ${order.trackingCode} → COMPLETED by [${user.id}] (${contextualRole})`,
      );

      this.eventEmitter.emit(NotificationEvents.ORDER_COMPLETED, {
        orderId: completed.id,
        trackingCode: completed.trackingCode,
        sellerId: completed.sellerId,
        buyerId: completed.buyerId,
        riderId: completed.riderId,
        status: completed.status,
        totalAmount: parseFloat(String(completed.totalAmount)),
      } satisfies OrderEventPayload);

      return completed as unknown as OrderResponseDto;
    }

    // ── All other transitions — normal path ───────────────────────
    const timestamps = this.getTimestampForStatus(dto.status);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus, ...timestamps },
      include: ORDER_INCLUDE,
    });

    this.logger.log(
      `Order ${order.trackingCode} status: ${order.status} → ${dto.status} ` +
        `by [${user.id}] (${contextualRole})`,
    );

    const EVENT_MAP: Partial<Record<string, string>> = {
      PENDING_BUYER: NotificationEvents.ORDER_SENT_TO_BUYER,
      AWAITING_PAYMENT: NotificationEvents.ORDER_CONFIRMED,
      PAID: NotificationEvents.ORDER_PAID,
      SHIPPED: NotificationEvents.ORDER_SHIPPED,
      IN_TRANSIT: NotificationEvents.ORDER_PICKED_UP,
      DELIVERED: NotificationEvents.ORDER_DELIVERED,
      CANCELLED: NotificationEvents.ORDER_CANCELLED,
      DISPUTED: NotificationEvents.ORDER_DISPUTED,
    };

    const eventName = EVENT_MAP[dto.status];
    if (eventName) {
      this.eventEmitter.emit(eventName, {
        orderId: updated.id,
        trackingCode: updated.trackingCode,
        sellerId: updated.sellerId,
        buyerId: updated.buyerId,
        riderId: updated.riderId,
        status: updated.status,
        totalAmount: parseFloat(String(updated.totalAmount)),
      } satisfies OrderEventPayload);
    }

    return updated as unknown as OrderResponseDto;
  }

  // ── POST /orders/:id/confirm ─────────────────────────────────────
  // Renamed from confirmOrder → confirmByBuyer to match controller
  async confirmByBuyer(id: string, buyer: AuthenticatedUser): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerEmail: buyer.email },
      select: {
        id: true,
        status: true,
        buyerId: true,
        trackingCode: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found or your email does not match the buyer email on this order',
      );
    }

    if (order.status !== OrderStatus.PENDING_BUYER) {
      throw new BadRequestException(
        `Order cannot be confirmed — current status is ${order.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        buyerId: buyer.id,
        buyerConfirmedAt: new Date(),
        status: OrderStatus.AWAITING_PAYMENT,
      },
      include: ORDER_INCLUDE,
    });

    this.logger.log(`Order ${order.trackingCode} confirmed by buyer [${buyer.id}]`);

    this.eventEmitter.emit(NotificationEvents.ORDER_CONFIRMED, {
      orderId: updated.id,
      trackingCode: updated.trackingCode,
      sellerId: updated.sellerId,
      buyerId: buyer.id,
      status: updated.status,
    } satisfies OrderEventPayload);

    return updated as unknown as OrderResponseDto;
  }

  // ── POST /orders/:id/assign-rider ────────────────────────────────
  async assignRider(
    id: string,
    riderId: string,
    _admin: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Rider can only be assigned when order is SHIPPED');
    }

    const rider = await this.prisma.user.findUnique({
      where: { id: riderId },
      select: { id: true, accountStatus: true },
    });

    if (!rider || rider.accountStatus !== 'ACTIVE') {
      throw new NotFoundException(`Rider ${riderId} not found or inactive`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { riderId },
      include: ORDER_INCLUDE,
    });

    this.logger.log(`Rider [${riderId}] assigned to order [${id}]`);

    return updated as unknown as OrderResponseDto;
  }

  // ── Private: timestamp map ────────────────────────────────────────
  private getTimestampForStatus(status: string): Partial<Record<string, Date>> {
    const now = new Date();
    const map: Record<string, Partial<Record<string, Date>>> = {
      PAID: { paidAt: now },
      SHIPPED: { shippedAt: now },
      IN_TRANSIT: { pickedUpAt: now },
      DELIVERED: { deliveredAt: now },
      COMPLETED: { completedAt: now },
      CANCELLED: { cancelledAt: now },
      DISPUTED: { disputedAt: now },
      REFUNDED: { refundedAt: now },
      PENDING_BUYER: { sentToBuyerAt: now },
      AWAITING_PAYMENT: { buyerConfirmedAt: now },
    };
    return map[status] ?? {};
  }

  // ── Private: contextual role resolver ────────────────────────────
  // Permissions derive from the user's relationship to THIS specific
  // order, NOT from their account-level UserRole enum (USER/RIDER/ADMIN).
  // The same account can be SELLER on Order A and BUYER on Order B.
  private getContextualRole(order: OrderParties, user: AuthenticatedUser): ContextualRole {
    if (user.role === 'ADMIN') return 'ADMIN';
    if (order.sellerId === user.id) return 'SELLER';
    if (order.buyerId === user.id) return 'BUYER';
    if (order.riderId === user.id) return 'RIDER';
    return 'NONE';
  }
}
