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

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const PLATFORM_FEE_PERCENT = 0.05;
const RIDER_DELIVERY_PERCENT = 0.9;

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
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── POST /orders ─────────────────────────────────────────────────
  async create(dto: CreateOrderDto, seller: AuthenticatedUser): Promise<OrderResponseDto> {
    const sellerUser = await this.prisma.user.findUnique({
      where: { id: seller.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
      },
    });

    if (!sellerUser || !sellerUser.isActive) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await this.prisma.$transaction(async (tx: any) => {
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
          status: 'DRAFT',
          escrowStatus: 'PENDING',
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
      `Order created: ${created.trackingCode} | Waybill: ${waybillNumber} | Seller: ${seller.id}`,
    );

    return created as unknown as OrderResponseDto;
  }

  // ── GET /orders ──────────────────────────────────────────────────
  async findAll(
    user: AuthenticatedUser,
    dto: FilterOrdersDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const limit = dto.limit ?? 20;
    const cursorWhere = buildCursorWhere(dto.cursor);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleWhere: any =
      user.role === 'ADMIN'
        ? {}
        : user.role === 'SELLER'
          ? { sellerId: user.id }
          : user.role === 'BUYER'
            ? { buyerId: user.id }
            : { riderId: user.id };

    const where = {
      ...roleWhere,
      ...cursorWhere,
      ...(dto.status && { status: dto.status }),
      // search: matches tracking code OR buyer email
      ...(dto.search && {
        OR: [
          { trackingCode: { contains: dto.search, mode: 'insensitive' as const } },
          { buyerEmail: { contains: dto.search, mode: 'insensitive' as const } },
        ],
      }),
      // date range filter
      ...((dto.dateFrom ?? dto.dateTo) && {
        createdAt: {
          ...(dto.dateFrom && { gte: new Date(dto.dateFrom) }),
          ...(dto.dateTo && { lte: new Date(dto.dateTo) }),
        },
      }),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleWhere: any =
      user.role === 'ADMIN'
        ? { id }
        : user.role === 'SELLER'
          ? { id, sellerId: user.id }
          : user.role === 'BUYER'
            ? { id, buyerId: user.id }
            : { id, riderId: user.id };

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
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (user.role !== 'ADMIN') {
      const isParty =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (order as any).sellerId === user.id ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (order as any).buyerId === user.id ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (order as any).riderId === user.id;

      if (!isParty) {
        throw new NotFoundException(`Order ${id} not found`);
      }
    }

    validateTransition(order.status as string, dto.status, user.role as string);

    const timestampUpdate = this.getTimestampForStatus(dto.status);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: dto.status as any,
        ...timestampUpdate,
      },
      include: ORDER_INCLUDE,
    });

    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `Order ${(order as any).trackingCode} status: ${order.status} → ${dto.status} by [${user.id}] (${user.role})`,
    );

    return updated as unknown as OrderResponseDto;
  }

  // ── Timestamp helper ─────────────────────────────────────────────
  private getTimestampForStatus(status: string): Record<string, Date> {
    const now = new Date();
    const map: Record<string, Record<string, Date>> = {
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

  // ── POST /orders/:id/confirm ─────────────────────────────────────
  async confirmByBuyer(id: string, buyer: AuthenticatedUser): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        buyerEmail: buyer.email,
      },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).status !== 'PENDING_BUYER') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Order cannot be confirmed — current status is ${(order as any).status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        buyerId: buyer.id,
        buyerConfirmedAt: new Date(),
        status: 'AWAITING_PAYMENT',
      },
      include: ORDER_INCLUDE,
    });

    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `Order ${(order as any).trackingCode} confirmed by buyer [${buyer.id}]`,
    );

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).status !== 'SHIPPED') {
      throw new BadRequestException('Rider can only be assigned when order is SHIPPED');
    }

    const rider = await this.prisma.user.findUnique({
      where: { id: riderId },
      select: { id: true, isActive: true },
    });

    if (!rider || !rider.isActive) {
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
}
