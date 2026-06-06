import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferRecipientDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare userId: string;
  @ApiProperty() declare recipientCode: string;
  @ApiProperty() declare accountName: string;
  @ApiProperty() declare accountNumber: string;
  @ApiProperty() declare bankCode: string;
  @ApiProperty() declare bankName: string;
  @ApiProperty() declare createdAt: Date;
}

export class TransferRecordDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare orderId: string;
  @ApiProperty() declare reference: string;
  @ApiPropertyOptional() transferCode?: string | null;
  @ApiProperty() declare amount: unknown;
  @ApiProperty() declare currency: string;
  @ApiProperty() declare status: string;
  @ApiPropertyOptional() reason?: string | null;
  @ApiPropertyOptional() failureReason?: string | null;
  @ApiProperty() declare initiatedAt: Date;
  @ApiPropertyOptional() completedAt?: Date | null;
  @ApiProperty() declare createdAt: Date;
}
