import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/messages.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import type { MessageResponseDto, MessageListResponseDto } from './dto/messages.dto';

const MESSAGE_SENDER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Verify the user is a party on this order ──────────────────────
  private async assertParty(orderId: string, user: AuthenticatedUser): Promise<void> {
    if (user.role === 'ADMIN') return;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { sellerId: true, buyerId: true, riderId: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const isParty =
      order.sellerId === user.id || order.buyerId === user.id || order.riderId === user.id;

    if (!isParty) {
      throw new ForbiddenException(
        'You are not a party to this order and cannot access its messages',
      );
    }
  }

  // ── POST /orders/:id/messages ─────────────────────────────────────
  async send(
    orderId: string,
    dto: SendMessageDto,
    user: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    await this.assertParty(orderId, user);

    const message = await this.prisma.orderMessage.create({
      data: {
        orderId,
        senderId: user.id,
        body: dto.body.trim(),
      },
      select: {
        id: true,
        orderId: true,
        body: true,
        createdAt: true,
        sender: { select: MESSAGE_SENDER_SELECT },
      },
    });

    this.logger.log(`Message sent on order [${orderId}] by [${user.id}] (${user.role})`);

    return message;
  }

  // ── GET /orders/:id/messages ──────────────────────────────────────
  async list(
    orderId: string,
    user: AuthenticatedUser,
    limit = 50,
    cursor?: string,
  ): Promise<MessageListResponseDto> {
    await this.assertParty(orderId, user);

    const where = {
      orderId,
      ...(cursor && { id: { lt: cursor } }),
    };

    const [messages, total] = await Promise.all([
      this.prisma.orderMessage.findMany({
        where,
        select: {
          id: true,
          orderId: true,
          body: true,
          createdAt: true,
          sender: { select: MESSAGE_SENDER_SELECT },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      }),
      this.prisma.orderMessage.count({ where: { orderId } }),
    ]);

    const hasNextPage = messages.length === limit;
    const nextCursor = hasNextPage ? messages[messages.length - 1].id : null;

    return { messages, total, hasNextPage, nextCursor };
  }
}
