import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  // ── Seller fields ──────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Chidi Electronics' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessName?: string;

  @ApiPropertyOptional({ example: 'Chidi Okonkwo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountName?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: '058', description: 'Paystack bank code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bankCode?: string;

  // ── Rider fields ───────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Motorcycle' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'LAG-234-AB' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  declare role: UserRole;
}
