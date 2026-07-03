import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  NotificationListResponseDto,
  NotificationResponseDto,
} from './dto/notification-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ── GET /notifications ────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'List notifications for current user',
    description:
      'Returns paginated notifications for the authenticated user. ' +
      'Use unreadOnly=true to fetch only unread notifications.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'unreadOnly', required: false, example: false })
  @ApiResponse({ status: 200, type: NotificationListResponseDto })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<NotificationListResponseDto> {
    return this.notificationsService.findAll(
      user.id,
      Number(limit) || 20,
      cursor,
      unreadOnly === 'true',
    );
  }

  // ── PATCH /notifications/read-all ─────────────────────────────────
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: '{ updated: number }',
  })
  async markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<{ updated: number }> {
    return this.notificationsService.markAllRead(user.id);
  }

  // ── PATCH /notifications/:id/read ─────────────────────────────────
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification CUID' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markRead(id, user.id);
  }
}
