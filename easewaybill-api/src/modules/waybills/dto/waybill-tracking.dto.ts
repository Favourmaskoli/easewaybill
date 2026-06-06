import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WaybillEventDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare status: string;
  @ApiPropertyOptional() note?: string | null;
  @ApiPropertyOptional() location?: string | null;
  @ApiPropertyOptional() lat?: unknown;
  @ApiPropertyOptional() lng?: unknown;
  @ApiProperty() declare createdAt: Date;
}

export class WaybillTrackingDto {
  @ApiProperty() declare waybillNumber: string;
  @ApiProperty() declare status: string;
  @ApiProperty() declare orderStatus: string;
  @ApiProperty() declare trackingCode: string;
  @ApiProperty() declare description: string;

  @ApiProperty() declare sellerName: string;
  @ApiProperty() declare sellerAddress: string;
  @ApiProperty() declare buyerName: string;
  @ApiProperty() declare buyerAddress: string;

  @ApiPropertyOptional() weight?: unknown;
  @ApiPropertyOptional() dimensions?: string | null;
  @ApiProperty() declare fragile: boolean;
  @ApiPropertyOptional() declaredValue?: unknown;
  @ApiPropertyOptional() notes?: string | null;

  @ApiProperty({ type: [WaybillEventDto] })
  declare timeline: WaybillEventDto[];

  @ApiProperty() declare generatedAt: Date;
  @ApiPropertyOptional() estimatedDelivery?: Date | null;
}
