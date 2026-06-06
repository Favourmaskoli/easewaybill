import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare orderId: string;
  @ApiPropertyOptional() actorId?: string | null;
  @ApiProperty() declare action: string;
  @ApiProperty() declare fromStatus: string;
  @ApiProperty() declare toStatus: string;
  @ApiProperty() declare amount: unknown;
  @ApiPropertyOptional() reference?: string | null;
  @ApiPropertyOptional() note?: string | null;
  @ApiPropertyOptional() metadata?: unknown;
  @ApiProperty() declare createdAt: Date;
}
