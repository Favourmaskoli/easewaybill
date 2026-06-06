import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'MacBook Pro 14" — handle with care' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare description: string;

  @ApiPropertyOptional({ example: '30x20x10cm' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dimensions?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  fragile?: boolean;

  @ApiProperty({ example: '12 Adeola Odeku Street, Victoria Island, Lagos' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  declare pickupAddress: string;

  @ApiPropertyOptional({ example: 6.4281 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickupLat?: number;

  @ApiPropertyOptional({ example: 3.4219 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickupLng?: number;

  @ApiProperty({ example: '45 Admiralty Way, Lekki Phase 1, Lagos' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  declare deliveryAddress: string;

  @ApiPropertyOptional({ example: 6.4474 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  deliveryLat?: number;

  @ApiPropertyOptional({ example: 3.5105 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  deliveryLng?: number;

  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  @IsNotEmpty()
  declare buyerEmail: string;

  @ApiPropertyOptional({ example: 'Amaka Nwosu' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  buyerName?: string;

  @ApiPropertyOptional({ example: '+2348099887766' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  buyerPhone?: string;

  @ApiProperty({ example: 350000, description: 'Agreed price of goods in NGN' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  declare itemPrice: number;

  @ApiPropertyOptional({ example: 4500, description: 'Delivery fee in NGN' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  deliveryFee?: number;

  @ApiProperty({ type: [OrderItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  declare items: OrderItemDto[];
}
