import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackWaybillTimelineEntryDto {
  @ApiProperty() declare status: string;
  @ApiPropertyOptional() note?: string | null;
  @ApiPropertyOptional() location?: string | null;
  @ApiProperty() declare createdAt: Date;
}

export class TrackWaybillResponseDto {
  @ApiProperty() declare waybillNumber: string;
  @ApiProperty() declare waybillStatus: string;
  @ApiProperty() declare orderStatus: string;
  @ApiProperty() declare trackingCode: string;
  @ApiProperty() declare description: string;
  @ApiProperty() declare pickupAddress: string;
  @ApiProperty() declare deliveryAddress: string;

  @ApiPropertyOptional() shippedAt?: Date | null;
  @ApiPropertyOptional() deliveredAt?: Date | null;

  @ApiProperty({ type: [TrackWaybillTimelineEntryDto] })
  declare timeline: TrackWaybillTimelineEntryDto[];
}
