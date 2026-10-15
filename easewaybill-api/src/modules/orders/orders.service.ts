import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaginatedResult, paginate, buildCursorWhere } from '../../common/dto/pagination.dto';
import { validateTransition } from './order-state-machine';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { detectImageMime } from '../../common/utils/image';
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
  images: {
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      size: true,
      createdAt: true,
      // `data` (raw Bytes) is intentionally excluded here — images are served
      // through GET /orders/:id/images/:imageId instead of being inlined in
      // every order response.
    },
  },
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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly escrow: EscrowService,
  ) {}

  // ── POST /orders ─────────────────────────────────────────────────
  async create(
    dto: CreateOrderDto,
    seller: AuthenticatedUser,
    images: Express.Multer.File[],
  ): Promise<OrderResponseDto> {
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

    if (!images || images.length === 0) {
      throw new BadRequestException('At least one item image is required');
    }

    // Verify the real file type from its bytes — the client-supplied
    // mimetype is just a header and can be faked.
    const checkedImages = images.map((file) => {
      const mime = detectImageMime(file.buffer);
      if (!mime) {
        throw new BadRequestException(`"${file.originalname}" must be a PNG, JPEG or WEBP image`);
      }
      return { file, mime };
    });

    // Addresses picked from a Mapbox suggestion carry a mapboxId;
    // manually typed addresses don't, and need delivery-agent confirmation
    // before dispatch.
    const addressVerificationRequired = !dto.pickupMapboxId || !dto.deliveryMapboxId;

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
          pickupMapboxId: dto.pickupMapboxId,
          deliveryAddress: dto.deliveryAddress,
          deliveryLat: dto.deliveryLat,
          deliveryLng: dto.deliveryLng,
          deliveryMapboxId: dto.deliveryMapboxId,
          addressVerificationRequired,
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

      await tx.orderImage.createMany({
        data: checkedImages.map(({ file, mime }) => ({
          orderId: createdOrder.id,
          fileName: file.originalname.slice(0, 255),
          mimeType: mime, // detected from bytes, not client-supplied
          size: file.size,
          // If TS complains on Prisma 6: new Uint8Array(file.buffer)
          data: new Uint8Array(file.buffer), // Prisma 6 requires Uint8Array, not Buffer
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
      `Order created: ${created.trackingCode} | Waybill: ${waybillNumber} | Seller: ${seller.id} | ` +
        `Status: PENDING_BUYER | Images: ${images.length} | ` +
        `AddressVerificationRequired: ${created.addressVerificationRequired}`,
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
    const cursorWhere = buildCursorWhere(dto.cursor) as Prisma.OrderWhereInput;

    const roleWhere = this.partyWhere(user);

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

    // Combine with AND. Spreading these objects together made the search
    // `OR` overwrite the role `OR`, so a search could return orders the
    // user has no access to.
    const where: Prisma.OrderWhereInput = {
      AND: [
        roleWhere,
        cursorWhere,
        dto.status ? { status: dto.status as OrderStatus } : {},
        searchWhere,
        dateWhere,
      ],
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
    const order = await this.prisma.order.findFirst({
      where: this.accessWhere(id, user),
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order as unknown as OrderResponseDto;
  }

  // ── GET /orders/:id/images/:imageId ──────────────────────────────
  async getImage(orderId: string, imageId: string, user: AuthenticatedUser) {
    const image = await this.prisma.orderImage.findFirst({
      where: { id: imageId, order: this.accessWhere(orderId, user) },
      select: { mimeType: true, size: true, data: true },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    return image;
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
  async confirmByBuyer(id: string, buyer: AuthenticatedUser): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerEmail: { equals: buyer.email, mode: 'insensitive' } },
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

  // ── Private: which orders can this user see? ─────────────────────
  // Single source of truth for order visibility, used by list, detail
  // and image access. Admins see everything; everyone else sees orders
  // they are a party to, plus pending orders addressed to their email.
  private partyWhere(user: AuthenticatedUser): Prisma.OrderWhereInput {
    if (user.role === 'ADMIN') return {};
    return {
      OR: [
        { sellerId: user.id },
        { buyerId: user.id },
        { riderId: user.id },
        {
          buyerEmail: { equals: user.email, mode: 'insensitive' },
          status: OrderStatus.PENDING_BUYER,
        },
      ],
    };
  }

  private accessWhere(id: string, user: AuthenticatedUser): Prisma.OrderWhereInput {
    return { id, ...this.partyWhere(user) };
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
