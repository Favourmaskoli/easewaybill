import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare email: string;
  @ApiProperty() declare firstName: string;
  @ApiProperty() declare lastName: string;
  @ApiPropertyOptional() phone?: string | null;
  @ApiProperty({ enum: UserRole }) declare role: UserRole;
  @ApiProperty() declare isEmailVerified: boolean;
  @ApiProperty() declare isActive: boolean;
  @ApiPropertyOptional() avatarUrl?: string | null;

  // Rider fields
  @ApiPropertyOptional() vehicleType?: string | null;
  @ApiPropertyOptional() vehiclePlate?: string | null;
  @ApiPropertyOptional() isAvailable?: boolean;

  @ApiProperty() declare createdAt: Date;
  @ApiProperty() declare updatedAt: Date;
}
