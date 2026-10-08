import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackWaybillResponseDto } from './dto/track-waybill-response.dto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async trackByWaybillNumber(waybillNumber: string): Promise<TrackWaybillResponseDto> {
    const waybill = await this.prisma.waybill.findUnique({
      where: { waybillNumber },
      select: {
        waybillNumber: true,
        status: true,
        order: {
          select: {
            status: true,
            trackingCode: true,
            description: true,
            pickupAddress: true,
            deliveryAddress: true,
            shippedAt: true,
            deliveredAt: true,
          },
        },
        events: {
          select: {
            status: true,
            note: true,
            location: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!waybill) {
      throw new NotFoundException(`No shipment found for waybill number "${waybillNumber}"`);
    }

    this.logger.log(`Public tracking lookup: ${waybillNumber} → ${waybill.order.status}`);

    return {
      waybillNumber: waybill.waybillNumber,
      waybillStatus: waybill.status,
      orderStatus: waybill.order.status,
      trackingCode: waybill.order.trackingCode,
      description: waybill.order.description,
      pickupAddress: waybill.order.pickupAddress,
      deliveryAddress: waybill.order.deliveryAddress,
      shippedAt: waybill.order.shippedAt,
      deliveredAt: waybill.order.deliveredAt,
      timeline: waybill.events.map((e) => ({
        status: e.status,
        note: e.note,
        location: e.location,
        createdAt: e.createdAt,
      })),
    };
  }
}
