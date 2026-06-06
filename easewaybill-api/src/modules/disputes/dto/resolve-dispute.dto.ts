import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DisputeResolution {
  RESOLVED_FOR_BUYER = 'RESOLVED_FOR_BUYER',
  RESOLVED_FOR_SELLER = 'RESOLVED_FOR_SELLER',
}

export class ResolveDisputeDto {
  @ApiProperty({
    enum: DisputeResolution,
    example: DisputeResolution.RESOLVED_FOR_BUYER,
    description:
      'RESOLVED_FOR_BUYER → refund buyer. RESOLVED_FOR_SELLER → release escrow to seller.',
  })
  @IsEnum(DisputeResolution)
  declare resolution: DisputeResolution;

  @ApiProperty({
    example: 'Evidence shows item was damaged during transit. Buyer will be refunded.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  declare resolutionNote: string;
}
