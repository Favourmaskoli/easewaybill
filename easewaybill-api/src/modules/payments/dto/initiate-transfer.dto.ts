import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateTransferDto {
  @ApiProperty({
    example: 'cmpemln5i0000569kj79v3pv3',
    description: 'Order ID to transfer seller payout for',
  })
  @IsString()
  @IsNotEmpty()
  declare orderId: string;

  @ApiPropertyOptional({
    example: 'Payout for completed order EW-MOAN7ZP9',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
