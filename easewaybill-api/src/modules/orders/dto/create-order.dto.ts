// // import {
// //   IsArray,
// //   IsBoolean,
// //   IsEmail,
// //   IsNotEmpty,
// //   IsNumber,
// //   IsOptional,
// //   IsPositive,
// //   IsString,
// //   MaxLength,
// //   MinLength,
// //   ValidateNested,
// //   ArrayMinSize,
// //   Min,
// // } from 'class-validator';
// // import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// // import { Transform, Type } from 'class-transformer';
// // import { OrderItemDto } from './order-item.dto';

// // export class CreateOrderDto {
// //   @ApiProperty({ example: 'MacBook Pro 14" — handle with care' })
// //   @IsString()
// //   @IsNotEmpty()
// //   @MaxLength(255)
// //   declare description: string;

// //   @ApiPropertyOptional({ example: '30x20x10cm' })
// //   @IsOptional()
// //   @IsString()
// //   @MaxLength(50)
// //   dimensions?: string;

// //   @ApiPropertyOptional({ example: true })
// //   @IsOptional()
// //   @IsBoolean()
// //   fragile?: boolean;

// //   @ApiProperty({ example: '12 Adeola Odeku Street, Victoria Island, Lagos' })
// //   @IsString()
// //   @IsNotEmpty()
// //   @MinLength(10)
// //   @MaxLength(500)
// //   declare pickupAddress: string;

// //   @ApiPropertyOptional({ example: 6.4281 })
// //   @IsOptional()
// //   @IsNumber()
// //   @Type(() => Number)
// //   pickupLat?: number;

// //   @ApiPropertyOptional({ example: 3.4219 })
// //   @IsOptional()
// //   @IsNumber()
// //   @Type(() => Number)
// //   pickupLng?: number;

// //   // Optional: only present when the pickup address was picked from a
// //   // Mapbox suggestion. Missing/undefined means the seller typed the
// //   // address manually — see addressVerificationRequired in the service.
// //   @ApiPropertyOptional({ example: 'mapbox.pickup-place-id' })
// //   @IsOptional()
// //   @IsString()
// //   @MaxLength(255)
// //   pickupMapboxId?: string;

// //   @ApiProperty({ example: '45 Admiralty Way, Lekki Phase 1, Lagos' })
// //   @IsString()
// //   @IsNotEmpty()
// //   @MinLength(10)
// //   @MaxLength(500)
// //   declare deliveryAddress: string;

// //   @ApiPropertyOptional({ example: 6.4474 })
// //   @IsOptional()
// //   @IsNumber()
// //   @Type(() => Number)
// //   deliveryLat?: number;

// //   @ApiPropertyOptional({ example: 3.5105 })
// //   @IsOptional()
// //   @IsNumber()
// //   @Type(() => Number)
// //   deliveryLng?: number;

// //   // Optional: only present when the delivery address was picked from a
// //   // Mapbox suggestion. Missing/undefined means the buyer's address was
// //   // typed manually — see addressVerificationRequired in the service.
// //   @ApiPropertyOptional({ example: 'mapbox.delivery-place-id' })
// //   @IsOptional()
// //   @IsString()
// //   @MaxLength(255)
// //   deliveryMapboxId?: string;

// //   @ApiProperty({ example: 'buyer@example.com' })
// //   @IsEmail()
// //   @IsNotEmpty()
// //   declare buyerEmail: string;

// //   @ApiPropertyOptional({ example: 'Amaka Nwosu' })
// //   @IsOptional()
// //   @IsString()
// //   @MaxLength(100)
// //   buyerName?: string;

// //   @ApiPropertyOptional({ example: '+2348099887766' })
// //   @IsOptional()
// //   @IsString()
// //   @MaxLength(20)
// //   buyerPhone?: string;

// //   @ApiProperty({ example: 350000, description: 'Agreed price of goods in NGN' })
// //   @IsNumber()
// //   @IsPositive()
// //   @Type(() => Number)
// //   declare itemPrice: number;

// //   @ApiPropertyOptional({ example: 4500, description: 'Delivery fee in NGN' })
// //   @IsOptional()
// //   @IsNumber()
// //   @Min(0)
// //   @Type(() => Number)
// //   deliveryFee?: number;

// //   @ApiProperty({ type: [OrderItemDto], minItems: 1 })
// //   @IsArray()
// //   @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
// //   @ArrayMinSize(1, { message: 'At least one item is required' })
// //   @ValidateNested({ each: true })
// //   @Type(() => OrderItemDto)
// //   declare items: OrderItemDto[];
// // }
// import {
//   IsArray,
//   IsBoolean,
//   IsEmail,
//   IsNotEmpty,
//   IsNumber,
//   IsOptional,
//   IsPositive,
//   IsString,
//   Max,
//   MaxLength,
//   Min,
//   MinLength,
//   ValidateNested,
//   ArrayMinSize,
// } from 'class-validator';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { plainToInstance, Transform, Type } from 'class-transformer';
// import { OrderItemDto } from './order-item.dto';

// /**
//  * NOTE: this DTO is populated from multipart/form-data, so every scalar
//  * arrives as a string. Numbers use @Type(() => Number); booleans and the
//  * `items` array need explicit transforms below.
//  */
// export class CreateOrderDto {
//   @ApiProperty({ example: 'MacBook Pro 14" — handle with care' })
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(255)
//   declare description: string;

//   @ApiPropertyOptional({ example: '30x20x10cm' })
//   @IsOptional()
//   @IsString()
//   @MaxLength(50)
//   dimensions?: string;

//   @ApiPropertyOptional({ example: true })
//   @IsOptional()
//   @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
//   @IsBoolean()
//   fragile?: boolean;

//   // ── Pickup ──────────────────────────────────────────────────────
//   @ApiProperty({ example: '12 Adeola Odeku Street, Victoria Island, Lagos' })
//   @IsString()
//   @IsNotEmpty()
//   @MinLength(10)
//   @MaxLength(500)
//   declare pickupAddress: string;

//   @ApiPropertyOptional({ example: 6.4281 })
//   @IsOptional()
//   @Type(() => Number)
//   @IsNumber()
//   @Min(-90)
//   @Max(90)
//   pickupLat?: number;

//   @ApiPropertyOptional({ example: 3.4219 })
//   @IsOptional()
//   @Type(() => Number)
//   @IsNumber()
//   @Min(-180)
//   @Max(180)
//   pickupLng?: number;

//   // Present only when the address was picked from a Mapbox suggestion.
//   // Mapbox ids are opaque and can be long — don't truncate them.
//   @ApiPropertyOptional({ example: 'mapbox.pickup-place-id' })
//   @IsOptional()
//   @IsString()
//   @MaxLength(5000)
//   pickupMapboxId?: string;

//   // ── Delivery ────────────────────────────────────────────────────
//   @ApiProperty({ example: '45 Admiralty Way, Lekki Phase 1, Lagos' })
//   @IsString()
//   @IsNotEmpty()
//   @MinLength(10)
//   @MaxLength(5000)
//   declare deliveryAddress: string;

//   @ApiPropertyOptional({ example: 6.4474 })
//   @IsOptional()
//   @Type(() => Number)
//   @IsNumber()
//   @Min(-90)
//   @Max(90)
//   deliveryLat?: number;

//   @ApiPropertyOptional({ example: 3.5105 })
//   @IsOptional()
//   @Type(() => Number)
//   @IsNumber()
//   @Min(-180)
//   @Max(180)
//   deliveryLng?: number;

//   @ApiPropertyOptional({ example: 'mapbox.delivery-place-id' })
//   @IsOptional()
//   @IsString()
//   @MaxLength(5000)
//   deliveryMapboxId?: string;

//   // ── Buyer ───────────────────────────────────────────────────────
//   @ApiProperty({ example: 'buyer@example.com' })
//   @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
//   @IsEmail()
//   @IsNotEmpty()
//   declare buyerEmail: string;

//   @ApiPropertyOptional({ example: 'Amaka Nwosu' })
//   @IsOptional()
//   @IsString()
//   @MaxLength(100)
//   buyerName?: string;

//   @ApiPropertyOptional({ example: '+2348099887766' })
//   @IsOptional()
//   @IsString()
//   @MaxLength(20)
//   buyerPhone?: string;

//   // ── Money ───────────────────────────────────────────────────────
//   @ApiProperty({ example: 350000, description: 'Agreed price of goods in NGN' })
//   @Type(() => Number)
//   @IsNumber({ maxDecimalPlaces: 2 })
//   @IsPositive()
//   @Max(9_999_999_999) // Decimal(12, 2) ceiling
//   declare itemPrice: number;

//   @ApiPropertyOptional({ example: 4500, description: 'Delivery fee in NGN' })
//   @IsOptional()
//   @Type(() => Number)
//   @IsNumber({ maxDecimalPlaces: 2 })
//   @Min(0)
//   @Max(9_999_999_999)
//   deliveryFee?: number;

//   // ── Items ───────────────────────────────────────────────────────
//   // Sent as a JSON string inside multipart. We must build real
//   // OrderItemDto instances here: class-transformer runs @Type BEFORE
//   // @Transform, so `value` is the raw string and JSON.parse(value) would
//   // yield plain objects that @ValidateNested can't match to OrderItemDto
//   // (every property then fails whitelisting). `obj.items` is the original.
//   @ApiProperty({ type: [OrderItemDto], minItems: 1 })
//   @Transform(({ obj }) => {
//     const raw = obj.items;
//     if (typeof raw !== 'string') return raw;
//     try {
//       return plainToInstance(OrderItemDto, JSON.parse(raw));
//     } catch {
//       return raw; // @IsArray reports a clear error
//     }
//   })
//   @IsArray()
//   @ArrayMinSize(1, { message: 'At least one item is required' })
//   @ValidateNested({ each: true })
//   declare items: OrderItemDto[];
// }

import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

/**
 * NOTE: this DTO is populated from multipart/form-data, so every scalar
 * arrives as a string. Numbers use @Type(() => Number); booleans and the
 * `items` array need explicit transforms below.
 */
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
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  fragile?: boolean;

  // ── Pickup ──────────────────────────────────────────────────────
  @ApiProperty({ example: '12 Adeola Odeku Street, Victoria Island, Lagos' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  declare pickupAddress: string;

  @ApiPropertyOptional({ example: 6.4281 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat?: number;

  @ApiPropertyOptional({ example: 3.4219 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng?: number;

  // Present only when the address was picked from a Mapbox suggestion.
  // Mapbox ids are opaque tokens and can be long (~2,900 chars in practice).
  // Don't truncate them.
  @ApiPropertyOptional({ example: 'mapbox.pickup-place-id' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  pickupMapboxId?: string;

  // ── Delivery ────────────────────────────────────────────────────
  @ApiProperty({ example: '45 Admiralty Way, Lekki Phase 1, Lagos' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  declare deliveryAddress: string;

  @ApiPropertyOptional({ example: 6.4474 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLat?: number;

  @ApiPropertyOptional({ example: 3.5105 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLng?: number;

  @ApiPropertyOptional({ example: 'mapbox.delivery-place-id' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  deliveryMapboxId?: string;

  // ── Buyer ───────────────────────────────────────────────────────
  @ApiProperty({ example: 'buyer@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
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

  // ── Money ───────────────────────────────────────────────────────
  @ApiProperty({ example: 350000, description: 'Agreed price of goods in NGN' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9_999_999_999) // Decimal(12, 2) ceiling
  declare itemPrice: number;

  @ApiPropertyOptional({ example: 4500, description: 'Delivery fee in NGN' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9_999_999_999)
  deliveryFee?: number;

  // ── Items ───────────────────────────────────────────────────────
  // Sent as a JSON string inside multipart. We must build real
  // OrderItemDto instances here: class-transformer runs @Type BEFORE
  // @Transform, so `value` is the raw string and JSON.parse(value) would
  // yield plain objects that @ValidateNested can't match to OrderItemDto
  // (every property then fails whitelisting). `obj.items` is the original.
  @ApiProperty({ type: [OrderItemDto], minItems: 1 })
  @Transform(({ obj }) => {
    const raw = obj.items;
    if (typeof raw !== 'string') return raw;
    try {
      return plainToInstance(OrderItemDto, JSON.parse(raw));
    } catch {
      return raw; // @IsArray reports a clear error
    }
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  declare items: OrderItemDto[];
}
