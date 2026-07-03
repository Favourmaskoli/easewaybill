import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Role enum for promotion/demotion ─────────────────────────────
export enum PromoteToRole {
  USER = 'USER',
  RIDER = 'RIDER',
  ADMIN = 'ADMIN',
}

// ── Create Rider ──────────────────────────────────────────────────
export class CreateRiderDto {
  @ApiProperty({ example: 'rider@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  declare email: string;

  @ApiProperty({ example: 'Chukwu' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  declare firstName: string;

  @ApiProperty({ example: 'Emeka' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  declare lastName: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message: 'Password must contain uppercase, lowercase, a number, and a special character',
  })
  declare password: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  declare phoneNumber: string | undefined;

  @ApiPropertyOptional({ example: 'Motorcycle' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  declare vehicleType: string | undefined;

  @ApiPropertyOptional({ example: 'LND-123AB' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  declare vehiclePlate: string | undefined;
}

// ── Create Admin ──────────────────────────────────────────────────
export class CreateAdminDto {
  @ApiProperty({ example: 'admin@easewaybill.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  declare email: string;

  @ApiProperty({ example: 'Favour' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  declare firstName: string;

  @ApiProperty({ example: 'Maskoli' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  declare lastName: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message: 'Password must contain uppercase, lowercase, a number, and a special character',
  })
  declare password: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  declare phoneNumber: string | undefined;
}

// ── Promote / Demote User ─────────────────────────────────────────
export class PromoteUserDto {
  @ApiProperty({
    enum: PromoteToRole,
    example: PromoteToRole.RIDER,
    description: 'Target role. USER = demote, RIDER/ADMIN = promote.',
  })
  @IsEnum(PromoteToRole, {
    message: 'Role must be one of: USER, RIDER, ADMIN',
  })
  declare role: PromoteToRole;
}
