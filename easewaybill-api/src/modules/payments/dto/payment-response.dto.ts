import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiatePaymentResponseDto {
  @ApiProperty() declare authorizationUrl: string;
  @ApiProperty() declare accessCode: string;
  @ApiProperty() declare reference: string;
  @ApiProperty() declare orderId: string;
  @ApiProperty() declare amount: number;
  @ApiProperty() declare currency: string;
}

export class PaymentRecordDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare orderId: string;
  @ApiProperty() declare reference: string;
  @ApiProperty() declare amount: unknown;
  @ApiProperty() declare currency: string;
  @ApiProperty() declare channel: string;
  @ApiProperty() declare status: string;
  @ApiPropertyOptional() authorizationUrl?: string | null;
  @ApiPropertyOptional() verifiedAt?: Date | null;
  @ApiProperty() declare createdAt: Date;
  @ApiProperty() declare updatedAt: Date;
}
