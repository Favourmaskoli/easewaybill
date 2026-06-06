import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class HoldFundsDto {
  @ApiProperty({ example: 'cmpemln5i0000569kj79v3pv3', description: 'Order ID to hold funds for' })
  @IsString()
  @IsNotEmpty()
  declare orderId: string;

  @ApiProperty({
    example: 354500,
    description: 'Amount to hold in NGN (must match order totalAmount)',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  declare amount: number;

  @ApiProperty({ example: 'PAY-REF-XXXXXXXX', description: 'Unique payment reference' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare reference: string;

  @ApiPropertyOptional({ example: 'ps_test_abc123', description: 'Paystack transaction reference' })
  @IsOptional()
  @IsString()
  paystackRef?: string;

  @ApiPropertyOptional({ example: { channel: 'card', bank: 'GTB' } })
  @IsOptional()
  paystackResponse?: unknown;

  @ApiPropertyOptional({ example: 'Buyer paid via Paystack' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
