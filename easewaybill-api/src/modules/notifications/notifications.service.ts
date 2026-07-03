import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email/email.service';
import { NotificationEvents } from './notifications.events';
import type {
  OrderEventPayload,
  EscrowEventPayload,
  DisputeEventPayload,
} from './notifications.events';
import type {
  NotificationListResponseDto,
  NotificationResponseDto,
} from './dto/notification-response.dto';
import {
  orderConfirmedTemplate,
  paymentReceivedTemplate,
  paymentSuccessTemplate,
  deliveryConfirmedTemplate,
  disputeRaisedTemplate,
  escrowReleasedTemplate,
} from './email/email.templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ── GET /notifications ────────────────────────────────────────────
  async findAll(
    userId: string,
    limit = 20,
    cursor?: string,
    unreadOnly = false,
  ): Promise<NotificationListResponseDto> {
    const where = {
      userId,
      ...(unreadOnly && { isRead: false }),
      ...(cursor && { id: { lt: cursor } }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const hasNextPage = notifications.length === limit;
    const nextCursor = hasNextPage ? (notifications[notifications.length - 1]?.id ?? null) : null;

    return {
      notifications: notifications.map((n) => this.format(n)),
      total,
      unreadCount,
      hasNextPage,
      nextCursor,
    };
  }

  // ── PATCH /notifications/:id/read ─────────────────────────────────
  async markRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return this.format(updated);
  }

  // ── PATCH /notifications/read-all ─────────────────────────────────
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    this.logger.log(`Marked ${result.count} notifications as read for user [${userId}]`);

    return { updated: result.count };
  }

  // ── Create in-app notification ────────────────────────────────────
  async create(data: {
    userId: string;
    orderId?: string;
    type: string;
    title: string;
    body: string;
    channel?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        orderId: data.orderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: data.type as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        channel: (data.channel ?? 'IN_APP') as any,
        title: data.title,
        body: data.body,
        isRead: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (data.metadata ?? null) as any,
      },
    });
  }

  // ── Helper: get user email ────────────────────────────────────────
  private async getUserEmail(userId: string): Promise<{ email: string; firstName: string } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });
  }

  // ── Helper: get order details ─────────────────────────────────────
  private async getOrderDetails(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        description: true,
        totalAmount: true,
        sellerPayout: true,
        deliveryAddress: true,
        pickupAddress: true,
        seller: { select: { firstName: true, lastName: true, email: true } },
        buyer: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  // ── Event Listeners ───────────────────────────────────────────────

  @OnEvent(NotificationEvents.ORDER_CREATED)
  async onOrderCreated(payload: OrderEventPayload): Promise<void> {
    await this.create({
      userId: payload.sellerId,
      orderId: payload.orderId,
      type: 'ORDER_CREATED',
      title: 'Order created',
      body: `Your order ${payload.trackingCode} has been created.`,
    });
  }

  @OnEvent(NotificationEvents.ORDER_SENT_TO_BUYER)
  async onOrderSentToBuyer(payload: OrderEventPayload): Promise<void> {
    if (!payload.buyerId) return;

    await this.create({
      userId: payload.buyerId,
      orderId: payload.orderId,
      type: 'ORDER_SENT_TO_BUYER',
      title: 'Order awaiting your confirmation',
      body: `Order ${payload.trackingCode} is waiting for your confirmation.`,
    });
  }

  @OnEvent(NotificationEvents.ORDER_CONFIRMED)
  async onOrderConfirmed(payload: OrderEventPayload): Promise<void> {
    await this.create({
      userId: payload.sellerId,
      orderId: payload.orderId,
      type: 'ORDER_CONFIRMED_BUYER',
      title: 'Buyer confirmed order',
      body: `Buyer has confirmed order ${payload.trackingCode}. Awaiting payment.`,
    });

    // Send email to buyer
    if (payload.buyerId) {
      const [buyer, order] = await Promise.all([
        this.getUserEmail(payload.buyerId),
        this.getOrderDetails(payload.orderId),
      ]);

      if (buyer && order) {
        const template = orderConfirmedTemplate({
          buyerName: buyer.firstName,
          trackingCode: payload.trackingCode,
          sellerName: `${order.seller.firstName} ${order.seller.lastName}`,
          itemDescription: order.description,
          totalAmount: parseFloat(String(order.totalAmount)).toLocaleString(),
          pickupAddress: order.pickupAddress,
          deliveryAddress: order.deliveryAddress,
        });

        await this.emailService.queueEmail({
          to: buyer.email,
          ...template,
        });
      }
    }
  }

  @OnEvent(NotificationEvents.ORDER_PAID)
  async onOrderPaid(payload: OrderEventPayload): Promise<void> {
    // In-app for seller
    await this.create({
      userId: payload.sellerId,
      orderId: payload.orderId,
      type: 'ESCROW_FUNDED',
      title: 'Payment confirmed — ship now',
      body: `₦${payload.totalAmount?.toLocaleString()} for order ${payload.trackingCode} is secured in escrow.`,
    });

    // In-app for buyer
    if (payload.buyerId) {
      await this.create({
        userId: payload.buyerId,
        orderId: payload.orderId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment successful',
        body: `Your payment for order ${payload.trackingCode} is secured in escrow.`,
      });
    }

    const order = await this.getOrderDetails(payload.orderId);
    if (!order) return;

    const totalAmount = parseFloat(String(order.totalAmount)).toLocaleString();
    const sellerPayout = parseFloat(String(order.sellerPayout)).toLocaleString();

    // Email seller — ship now
    const sellerTemplate = paymentReceivedTemplate({
      sellerName: order.seller.firstName,
      trackingCode: payload.trackingCode,
      buyerName: order.buyer ? `${order.buyer.firstName} ${order.buyer.lastName}` : 'Buyer',
      itemDescription: order.description,
      amount: totalAmount,
      sellerPayout,
    });
    await this.emailService.queueEmail({
      to: order.seller.email,
      ...sellerTemplate,
    });

    // Email buyer — payment confirmed
    if (order.buyer) {
      const buyerTemplate = paymentSuccessTemplate({
        buyerName: order.buyer.firstName,
        trackingCode: payload.trackingCode,
        amount: totalAmount,
        itemDescription: order.description,
        deliveryAddress: order.deliveryAddress,
      });
      await this.emailService.queueEmail({
        to: order.buyer.email,
        ...buyerTemplate,
      });
    }
  }

  @OnEvent(NotificationEvents.ORDER_SHIPPED)
  async onOrderShipped(payload: OrderEventPayload): Promise<void> {
    if (!payload.buyerId) return;
    await this.create({
      userId: payload.buyerId,
      orderId: payload.orderId,
      type: 'ORDER_SHIPPED',
      title: 'Your order has been shipped',
      body: `Order ${payload.trackingCode} is on its way.`,
    });
  }

  @OnEvent(NotificationEvents.ORDER_PICKED_UP)
  async onOrderPickedUp(payload: OrderEventPayload): Promise<void> {
    if (!payload.buyerId) return;
    await this.create({
      userId: payload.buyerId,
      orderId: payload.orderId,
      type: 'ORDER_PICKED_UP',
      title: 'Rider picked up your order',
      body: `Order ${payload.trackingCode} has been picked up and is in transit.`,
    });
  }

  @OnEvent(NotificationEvents.ORDER_DELIVERED)
  async onOrderDelivered(payload: OrderEventPayload): Promise<void> {
    if (!payload.buyerId) return;

    await this.create({
      userId: payload.buyerId,
      orderId: payload.orderId,
      type: 'ORDER_DELIVERED',
      title: 'Order delivered!',
      body: `Order ${payload.trackingCode} has been delivered. Please confirm satisfaction.`,
    });

    // Email buyer — confirm delivery
    const [buyer, order] = await Promise.all([
      this.getUserEmail(payload.buyerId),
      this.getOrderDetails(payload.orderId),
    ]);

    if (buyer && order) {
      const template = deliveryConfirmedTemplate({
        buyerName: buyer.firstName,
        trackingCode: payload.trackingCode,
        itemDescription: order.description,
        amount: parseFloat(String(order.totalAmount)).toLocaleString(),
      });
      await this.emailService.queueEmail({
        to: buyer.email,
        ...template,
      });
    }
  }

  @OnEvent(NotificationEvents.ORDER_COMPLETED)
  async onOrderCompleted(payload: OrderEventPayload): Promise<void> {
    await this.create({
      userId: payload.sellerId,
      orderId: payload.orderId,
      type: 'ORDER_COMPLETED',
      title: 'Order completed — funds released',
      body: `Order ${payload.trackingCode} is complete.`,
    });
  }

  @OnEvent(NotificationEvents.ORDER_CANCELLED)
  async onOrderCancelled(payload: OrderEventPayload): Promise<void> {
    const recipients = [payload.sellerId, payload.buyerId].filter(Boolean) as string[];
    for (const userId of recipients) {
      await this.create({
        userId,
        orderId: payload.orderId,
        type: 'ORDER_CANCELLED',
        title: 'Order cancelled',
        body: `Order ${payload.trackingCode} has been cancelled.`,
      });
    }
  }

  @OnEvent(NotificationEvents.ORDER_DISPUTED)
  async onOrderDisputed(payload: OrderEventPayload): Promise<void> {
    await this.create({
      userId: payload.sellerId,
      orderId: payload.orderId,
      type: 'ORDER_DISPUTED',
      title: 'Dispute raised on your order',
      body: `A dispute has been raised on order ${payload.trackingCode}.`,
    });
  }

  @OnEvent(NotificationEvents.ESCROW_RELEASED)
  async onEscrowReleased(payload: EscrowEventPayload): Promise<void> {
    await this.create({
      userId: payload.sellerId,
      orderId: payload.orderId,
      type: 'ESCROW_RELEASED',
      title: 'Payment released to your account',
      body: `₦${payload.amount.toLocaleString()} released for order ${payload.trackingCode}.`,
    });

    // Email seller — funds released
    const [seller, order] = await Promise.all([
      this.getUserEmail(payload.sellerId),
      this.getOrderDetails(payload.orderId),
    ]);

    if (seller && order) {
      const template = escrowReleasedTemplate({
        sellerName: seller.firstName,
        trackingCode: payload.trackingCode,
        amount: payload.amount.toLocaleString(),
        buyerName: order.buyer ? `${order.buyer.firstName} ${order.buyer.lastName}` : 'Buyer',
      });
      await this.emailService.queueEmail({
        to: seller.email,
        ...template,
      });
    }
  }

  @OnEvent(NotificationEvents.ESCROW_REFUNDED)
  async onEscrowRefunded(payload: EscrowEventPayload): Promise<void> {
    if (!payload.buyerId) return;
    await this.create({
      userId: payload.buyerId,
      orderId: payload.orderId,
      type: 'ESCROW_REFUNDED',
      title: 'Refund processed',
      body: `₦${payload.amount.toLocaleString()} refunded for order ${payload.trackingCode}.`,
    });
  }

  @OnEvent(NotificationEvents.DISPUTE_OPENED)
  async onDisputeOpened(payload: DisputeEventPayload): Promise<void> {
    // Email both parties
    const [seller, buyer] = await Promise.all([
      this.getUserEmail(payload.sellerId),
      this.getUserEmail(payload.buyerId),
    ]);

    if (seller) {
      const template = disputeRaisedTemplate({
        recipientName: seller.firstName,
        trackingCode: payload.trackingCode,
        reason: payload.reason,
        description: payload.reason,
        isSeller: true,
      });
      await this.emailService.queueEmail({ to: seller.email, ...template });
    }

    if (buyer) {
      const template = disputeRaisedTemplate({
        recipientName: buyer.firstName,
        trackingCode: payload.trackingCode,
        reason: payload.reason,
        description: payload.reason,
        isSeller: false,
      });
      await this.emailService.queueEmail({ to: buyer.email, ...template });
    }
  }

  @OnEvent(NotificationEvents.DISPUTE_RESOLVED)
  async onDisputeResolved(payload: DisputeEventPayload): Promise<void> {
    const recipients = [payload.sellerId, payload.buyerId];
    for (const userId of recipients) {
      await this.create({
        userId,
        orderId: payload.orderId,
        type: 'DISPUTE_RESOLVED',
        title: 'Dispute resolved',
        body: `Dispute on order ${payload.trackingCode} resolved: ${payload.resolution}.`,
      });
    }
  }

  // ── Helper ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private format(n: any): NotificationResponseDto {
    return {
      id: n.id,
      userId: n.userId,
      orderId: n.orderId,
      type: n.type,
      channel: n.channel,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      readAt: n.readAt,
      metadata: n.metadata,
      createdAt: n.createdAt,
    };
  }
}
