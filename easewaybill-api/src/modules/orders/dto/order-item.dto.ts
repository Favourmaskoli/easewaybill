import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ example: 'MacBook Pro 14"' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare name: string;

  @ApiPropertyOptional({ example: 'Space Grey, 16GB RAM' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ example: 350000, description: 'Price per unit in NGN' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 1.5, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  fragile?: boolean;
}