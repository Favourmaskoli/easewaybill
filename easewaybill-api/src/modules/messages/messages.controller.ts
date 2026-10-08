import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { MessageListResponseDto, MessageResponseDto, SendMessageDto } from './dto/messages.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders/:id/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // ── GET /orders/:id/messages ──────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'List messages for an order',
    description:
      'Returns all messages for the given order. ' +
      'Only the seller, buyer, assigned rider, and admins can access messages.',
  })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'cursor', required: false, description: 'Last message ID for pagination' })
  @ApiResponse({ status: 200, type: MessageListResponseDto })
  @ApiResponse({ status: 403, description: 'Not a party to this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async list(
    @Param('id') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<MessageListResponseDto> {
    return this.messagesService.list(orderId, user, Number(limit) || 50, cursor);
  }

  // ── POST /orders/:id/messages ─────────────────────────────────────
  @Post()
  @ApiOperation({
    summary: 'Send a message on an order',
    description:
      'Sends a message in the order thread. ' +
      'Only the seller, buyer, assigned rider, and admins can send messages.',
  })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Not a party to this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async send(
    @Param('id') orderId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    return this.messagesService.send(orderId, dto, user);
  }
}
