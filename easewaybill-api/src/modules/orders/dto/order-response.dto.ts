import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() declare quantity: number;
  @ApiPropertyOptional() unitPrice?: unknown;
  @ApiPropertyOptional() weight?: unknown;
  @ApiProperty() declare fragile: boolean;
}

export class WaybillSummaryDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare waybillNumber: string;
  @ApiProperty() declare status: string;
  @ApiPropertyOptional() pdfUrl?: string | null;
  @ApiProperty() declare generatedAt: Date;
}

export class OrderPartyDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare firstName: string;
  @ApiProperty() declare lastName: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string | null;
}

export class OrderResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare trackingCode: string;
  @ApiProperty() declare status: string;
  @ApiProperty() declare escrowStatus: string;
  @ApiProperty() declare description: string;
  @ApiPropertyOptional() dimensions?: string | null;
  @ApiProperty() declare fragile: boolean;

  @ApiProperty() declare pickupAddress: string;
  @ApiProperty() declare deliveryAddress: string;

  @ApiProperty() declare buyerEmail: string;
  @ApiPropertyOptional() buyerName?: string | null;
  @ApiPropertyOptional() buyerPhone?: string | null;

  @ApiProperty() declare itemPrice: unknown;
  @ApiProperty() declare deliveryFee: unknown;
  @ApiProperty() declare totalAmount: unknown;
  @ApiProperty() declare platformFee: unknown;
  @ApiProperty() declare sellerPayout: unknown;
  @ApiProperty() declare riderPayout: unknown;

  @ApiPropertyOptional({ type: OrderPartyDto }) seller?: OrderPartyDto;
  @ApiPropertyOptional({ type: OrderPartyDto }) buyer?: OrderPartyDto | null;
  @ApiPropertyOptional({ type: OrderPartyDto }) rider?: OrderPartyDto | null;

  @ApiProperty({ type: [OrderItemResponseDto] }) declare items: OrderItemResponseDto[];
  @ApiProperty({ type: [WaybillSummaryDto] }) declare waybills: WaybillSummaryDto[];

  @ApiPropertyOptional() paidAt?: Date | null;
  @ApiPropertyOptional() shippedAt?: Date | null;
  @ApiPropertyOptional() deliveredAt?: Date | null;
  @ApiPropertyOptional() completedAt?: Date | null;
  @ApiPropertyOptional() disputedAt?: Date | null;

  @ApiProperty() declare createdAt: Date;
  @ApiProperty() declare updatedAt: Date;
}
