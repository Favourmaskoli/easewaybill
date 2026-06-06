import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DisputeReason {
  ITEM_NOT_RECEIVED = 'ITEM_NOT_RECEIVED',
  ITEM_DAMAGED = 'ITEM_DAMAGED',
  ITEM_NOT_AS_DESCRIBED = 'ITEM_NOT_AS_DESCRIBED',
  WRONG_ITEM_SENT = 'WRONG_ITEM_SENT',
  SELLER_NOT_SHIPPING = 'SELLER_NOT_SHIPPING',
  OTHER = 'OTHER',
}

export class RaiseDisputeDto {
  @ApiProperty({ enum: DisputeReason, example: DisputeReason.ITEM_DAMAGED })
  @IsEnum(DisputeReason)
  declare reason: DisputeReason;

  @ApiProperty({
    example: 'The laptop arrived with a cracked screen and dented chassis.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Description must be at least 20 characters' })
  @MaxLength(2000)
  declare description: string;

  @ApiPropertyOptional({
    example: ['https://cloudinary.com/img1.jpg'],
    description: 'Array of image/document URLs as evidence',
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Each evidence item must be a valid URL' })
  evidence?: string[];
}
