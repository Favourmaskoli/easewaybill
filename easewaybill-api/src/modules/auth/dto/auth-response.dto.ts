import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare email: string;
  @ApiProperty() declare firstName: string;
  @ApiProperty() declare lastName: string;
  @ApiProperty({ required: false }) phone?: string | null;
  @ApiProperty({ enum: UserRole }) declare role: UserRole;
  @ApiProperty() declare isEmailVerified: boolean;
  @ApiProperty() declare createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty() declare accessToken: string;
  @ApiProperty() declare refreshToken: string;
  @ApiProperty({ type: UserResponseDto }) declare user: UserResponseDto;
}
