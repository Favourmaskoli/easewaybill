  import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReleaseFundsDto {
  @ApiProperty({
    example: 'cmpemln5i0000569kj79v3pv3',
    description: 'Order ID to release escrow for',
  })
  @IsString()
  @IsNotEmpty()
  declare orderId: string;

  @ApiPropertyOptional({
    example: 'Buyer confirmed satisfaction — releasing funds to seller',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiProperty({
    example: 'RELEASE-cmpemln5i0000569kj79v3pv3-1697040000000',
    description: 'Unique reference for this release transaction',
  })
  @IsString()
  @IsNotEmpty()
  declare reference: string;
}
