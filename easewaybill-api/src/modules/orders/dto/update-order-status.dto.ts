import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: [
      'DRAFT',
      'PENDING_BUYER',
      'AWAITING_PAYMENT',
      'PAID',
      'SHIPPED',
      'IN_TRANSIT',
      'DELIVERED',
      'COMPLETED',
      'DISPUTED',
      'CANCELLED',
      'REFUNDED',
    ],
    example: 'SHIPPED',
  })
  @IsString()
  @IsEnum([
    'DRAFT',
    'PENDING_BUYER',
    'AWAITING_PAYMENT',
    'PAID',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'COMPLETED',
    'DISPUTED',
    'CANCELLED',
    'REFUNDED',
  ])
  declare status: string;

  @ApiPropertyOptional({ example: 'Handed to rider at 3pm' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
