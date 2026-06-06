import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisputeResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare orderId: string;
  @ApiProperty() declare trackingCode: string;
  @ApiProperty() declare reason: string;
  @ApiProperty() declare description: string;
  @ApiPropertyOptional() evidence?: unknown;
  @ApiProperty() declare status: string;
  @ApiProperty() declare raisedById: string;
  @ApiPropertyOptional() resolvedById?: string | null;
  @ApiPropertyOptional() resolutionNote?: string | null;
  @ApiPropertyOptional() resolvedAt?: Date | null;
  @ApiProperty() declare createdAt: Date;
  @ApiProperty() declare updatedAt: Date;
}
