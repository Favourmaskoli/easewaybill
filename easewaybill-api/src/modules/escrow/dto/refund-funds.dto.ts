import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundFundsDto {
  @ApiProperty({
    example: 'cmpemln5i0000569kj79v3pv3',
    description: 'Order ID to refund',
  })
  @IsString()
  @IsNotEmpty()
  declare orderId: string;

  @ApiPropertyOptional({
    example: 'Dispute resolved in favour of buyer — full refund',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    example: 'admin-001',
    description: 'Admin user ID triggering the refund',
  })
  @IsOptional()
  @IsString()
  actorId?: string;
}
