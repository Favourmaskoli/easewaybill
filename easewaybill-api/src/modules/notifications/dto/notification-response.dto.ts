import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare userId: string;
  @ApiPropertyOptional() orderId?: string | null;
  @ApiProperty() declare type: string;
  @ApiProperty() declare channel: string;
  @ApiProperty() declare title: string;
  @ApiProperty() declare body: string;
  @ApiProperty() declare isRead: boolean;
  @ApiPropertyOptional() readAt?: Date | null;
  @ApiPropertyOptional() metadata?: unknown;
  @ApiProperty() declare createdAt: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  declare notifications: NotificationResponseDto[];

  @ApiProperty() declare total: number;
  @ApiProperty() declare unreadCount: number;
  @ApiProperty() declare hasNextPage: boolean;
  @ApiPropertyOptional() nextCursor?: string | null;
}
