import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EscrowResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare orderId: string;
  @ApiProperty() declare trackingCode: string;
  @ApiProperty() declare type: string;
  @ApiProperty() declare paymentStatus: string;
  @ApiProperty() declare amount: unknown;
  @ApiProperty() declare currency: string;
  @ApiProperty() declare reference: string;
  @ApiPropertyOptional() paystackRef?: string | null;
  @ApiPropertyOptional() actorId?: string | null;
  @ApiPropertyOptional() note?: string | null;
  @ApiPropertyOptional() processedAt?: Date | null;
  @ApiProperty() declare createdAt: Date;
  @ApiProperty() declare updatedAt: Date;
}
