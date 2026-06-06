import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScanWaybillDto } from './dto/scan-waybill.dto';
import { WaybillTrackingDto } from './dto/waybill-tracking.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Order created by seller',
  PENDING_BUYER: 'Awaiting buyer confirmation',
  AWAITING_PAYMENT: 'Awaiting payment',
  PAID: 'Payment confirmed — escrow funded',
  SHIPPED: 'Goods handed to rider',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered to buyer',
  COMPLETED: 'Delivery confirmed — transaction complete',
  DISPUTED: 'Dispute raised',
  CANCELLED: 'Order cancelled',
  REFUNDED: 'Refund processed',
};

function estimateDelivery(status: string, shippedAt?: Date | null): Date | null {
  if (['COMPLETED', 'CANCELLED', 'REFUNDED', 'DELIVERED'].includes(status)) {
    return null;
  }
  const base = shippedAt ?? new Date();
  const estimate = new Date(base);
  estimate.setDate(estimate.getDate() + 3);
  return estimate;
}

@Injectable()
export class WaybillsService {
  private readonly logger = new Logger(WaybillsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── GET /waybills/:waybillNumber ──────────────────────────────────
  async track(waybillNumber: string): Promise<WaybillTrackingDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const waybill = await (this.prisma as any).waybill.findUnique({
      where: { waybillNumber },
      include: {
        order: {
          select: {
            trackingCode: true,
            status: true,
            shippedAt: true,
            deliveredAt: true,
          },
        },
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!waybill) {
      throw new NotFoundException(`Waybill ${waybillNumber} not found`);
    }

    const order = waybill.order;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timeline = waybill.events.map((event: any) => ({
      id: event.id,
      status: event.status,
      note: event.note ?? STATUS_LABELS[event.status] ?? event.status,
      location: event.location,
      lat: event.lat,
      lng: event.lng,
      createdAt: event.createdAt,
    }));

    // Seed timeline from order status if no events yet
    if (timeline.length === 0) {
      timeline.push({
        id: 'system-init',
        status: order.status,
        note: STATUS_LABELS[order.status] ?? order.status,
        location: null,
        lat: null,
        lng: null,
        createdAt: waybill.generatedAt,
      });
    }

    return {
      waybillNumber: waybill.waybillNumber,
      status: waybill.status,
      orderStatus: order.status,
      trackingCode: order.trackingCode,
      description: waybill.description,
      sellerName: waybill.sellerName,
      sellerAddress: waybill.sellerAddress,
      buyerName: waybill.buyerName,
      buyerAddress: waybill.buyerAddress,
      weight: waybill.weight,
      dimensions: waybill.dimensions,
      fragile: waybill.fragile,
      declaredValue: waybill.declaredValue,
      notes: waybill.notes,
      timeline,
      generatedAt: waybill.generatedAt,
      estimatedDelivery: estimateDelivery(order.status, order.shippedAt),
    };
  }

  // ── POST /waybills/:waybillNumber/scan ────────────────────────────
  async scan(
    waybillNumber: string,
    dto: ScanWaybillDto,
    rider: AuthenticatedUser,
  ): Promise<WaybillTrackingDto> {
    if (rider.role !== 'RIDER' && rider.role !== 'ADMIN') {
      throw new ForbiddenException('Only riders can scan waybills');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const waybill = await (this.prisma as any).waybill.findUnique({
      where: { waybillNumber },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            trackingCode: true,
            riderId: true,
            shippedAt: true,
          },
        },
      },
    });

    if (!waybill) {
      throw new NotFoundException(`Waybill ${waybillNumber} not found`);
    }

    const order = waybill.order;

    // Only the assigned rider can scan
    if (rider.role === 'RIDER' && order.riderId !== rider.id) {
      throw new ForbiddenException('You are not the assigned rider for this order');
    }

    const scanAllowedStatuses = ['SHIPPED', 'IN_TRANSIT', 'DELIVERED'];
    if (!scanAllowedStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot scan — order status is ${order.status}. ` +
          `Scanning allowed when: ${scanAllowedStatuses.join(', ')}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma as any).waybillEvent.create({
      data: {
        waybillId: waybill.id,
        status: order.status,
        note: dto.note ?? STATUS_LABELS[order.status],
        location: dto.location,
        lat: dto.lat,
        lng: dto.lng,
        scannedById: rider.id,
      },
    });

    this.logger.log(
      `Waybill ${waybillNumber} scanned by [${rider.id}] at ${dto.location ?? 'unknown'}`,
    );

    return this.track(waybillNumber);
  }
}
