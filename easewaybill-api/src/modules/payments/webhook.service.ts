import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, PaymentChannel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { EscrowService } from '../escrow/escrow.service';
import { PaystackWebhookPayload } from './dto/webhook-payload.dto';
import { TransferService } from './transfer.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvents } from '../notifications/notifications.events';
import type { OrderEventPayload } from '../notifications/notifications.events';

/**
 * REQUIRED CHANGE — escrow/escrow.service.ts
 * ────────────────────────────────────────────────────────────────────
 * Add a standalone method that only schedules the BullMQ auto-release
 * job, with no database writes. webhook.service.ts calls this instead
 * of holdFunds() so there is exactly one place that creates the
 * ESCROW_HOLD row (the webhook's own transaction) while still reusing
 * EscrowService for the queue concern it already owns.
 *
 *   async scheduleAutoRelease(orderId: string): Promise<void> {
 *     await this.escrowQueue.add(
 *       EscrowJobs.AUTO_RELEASE,
 *       { orderId },
 *       {
 *         delay: AUTO_RELEASE_DELAY_MS,
 *         attempts: 3,
 *         backoff: { type: 'exponential', delay: 5000 },
 *         jobId: `auto-release-${orderId}`, // deterministic → safe to call twice
 *         removeOnComplete: { count: 100 },
 *         removeOnFail: { count: 500 },
 *       },
 *     );
 *   }
 *
 * holdFunds() itself can stay as-is for any other direct/manual/admin
 * callers, but the webhook must never call it again.
 */

const CHANNEL_MAP: Record<string, PaymentChannel> = {
  card: PaymentChannel.CARD,
  bank: PaymentChannel.BANK_TRANSFER,
  ussd: PaymentChannel.USSD,
  qr: PaymentChannel.QR,
  mobile_money: PaymentChannel.MOBILE_MONEY,
};

// Escrow states that mean "this order's money has already moved on" —
// a late/duplicate charge.success webhook must never try to (re)hold funds here.
const TERMINAL_ESCROW_STATUSES = new Set(['RELEASED', 'REFUNDED', 'DISPUTED']);

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly escrow: EscrowService,
    private readonly transfer: TransferService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── POST /payments/webhook ────────────────────────────────────────
  async handleWebhook(rawBody: string, signature: string): Promise<{ received: boolean }> {
    const isValid = this.paystack.validateWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('Webhook received with invalid signature — rejected');
      throw new BadRequestException('Invalid webhook signature');
    }

    let payload: PaystackWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as PaystackWebhookPayload;
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    this.logger.log(`Webhook received: ${payload.event} | ref: ${payload.data?.reference}`);

    switch (payload.event) {
      case 'charge.success':
        await this.handleChargeSuccess(payload);
        break;

      case 'charge.failed':
        await this.handleChargeFailed(payload);
        break;

      case 'transfer.success':
        await this.transfer.handleTransferSuccess(payload.data.reference, payload.data);
        break;

      case 'transfer.failed':
        await this.transfer.handleTransferFailed(
          payload.data.reference,
          (payload.data as { reason?: string }).reason ?? 'Unknown reason',
          payload.data,
        );
        break;

      case 'transfer.reversed':
        await this.transfer.handleTransferFailed(
          payload.data.reference,
          'Transfer reversed by Paystack',
          payload.data,
        );
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${payload.event}`);
    }

    return { received: true };
  }

  // ── charge.success ────────────────────────────────────────────────
  private async handleChargeSuccess(payload: PaystackWebhookPayload): Promise<void> {
    const { reference, amount, channel, metadata } = payload.data;

    // Extract orderId from Paystack metadata
    const orderId =
      metadata?.orderId ??
      metadata?.custom_fields?.find((f) => f.variable_name === 'order_id')?.value;

    if (!orderId) {
      this.logger.error(`charge.success: no orderId in metadata for ref ${reference}`);
      return;
    }

    // Verify with Paystack — never trust webhook payload alone
    const verified = await this.paystack.verifyTransaction(reference);
    if (verified.status !== 'success') {
      this.logger.warn(
        `charge.success webhook but verify returned: ${verified.status} | ref: ${reference}`,
      );
      return;
    }

    const chargedAmountNgn = amount / 100; // what Paystack actually charged (may include fees)
    const mappedChannel = CHANNEL_MAP[channel] ?? PaymentChannel.UNKNOWN;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        trackingCode: true,
        sellerId: true,
        buyerId: true,
        riderId: true,
        totalAmount: true,
        status: true,
        escrowStatus: true,
      },
    });

    if (!order) {
      this.logger.error(`charge.success: order ${orderId} not found | ref: ${reference}`);
      return;
    }

    // Escrow amount is always the agreed order total, never the raw Paystack
    // charge amount — the charge can include card/transfer fees on top.
    const escrowAmount = new Prisma.Decimal(order.totalAmount).toNumber();
    if (Math.abs(chargedAmountNgn - escrowAmount) > 0.01) {
      this.logger.warn(
        `charge.success amount differs from order total (likely fees) | order: ${orderId} | ` +
          `charged: ₦${chargedAmountNgn.toLocaleString()} | order total: ₦${escrowAmount.toLocaleString()}`,
      );
    }

    // ── Idempotency — the escrow hold row is the single source of truth ──
    // A PaymentRecord can exist without a hold (e.g. a crash between the two
    // writes under the old code), so we key off the hold itself, not the
    // payment record status.
    const existingHold = await this.prisma.escrowTransaction.findFirst({
      where: { orderId, type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
    });

    if (existingHold) {
      this.logger.log(
        `charge.success: active escrow hold already exists for order ${orderId} (ref: ${existingHold.reference}) — skipping`,
      );
      return;
    }

    if (TERMINAL_ESCROW_STATUSES.has(order.escrowStatus)) {
      this.logger.error(
        `charge.success received for order ${orderId} but escrowStatus is already ${order.escrowStatus} — refusing to create a hold | ref: ${reference}`,
      );
      return;
    }

    const paystackJson = verified as unknown as Prisma.InputJsonValue;
    const verifiedAt = new Date(verified.paid_at);
    const escrowReference = `ESCROW-${reference}`;

    // ── Single atomic transaction — this is the ONLY place a hold is created ──
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Upsert PaymentRecord → SUCCESS
      await tx.paymentRecord.upsert({
        where: { reference },
        update: {
          status: 'SUCCESS',
          channel: mappedChannel,
          paystackId: String(verified.id),
          verifiedAt,
          paystackData: paystackJson,
        },
        create: {
          orderId,
          reference,
          amount: chargedAmountNgn,
          currency: verified.currency,
          channel: mappedChannel,
          status: 'SUCCESS',
          paystackId: String(verified.id),
          verifiedAt,
          paystackData: paystackJson,
        },
      });

      // 2. Update order → PAID + lock escrow, ONLY alongside a real hold record
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: verifiedAt,
          escrowStatus: 'HOLDING',
        },
        select: {
          id: true,
          trackingCode: true,
          sellerId: true,
          buyerId: true,
          riderId: true,
          totalAmount: true,
        },
      });

      // 3. Create the actual ESCROW_HOLD transaction row
      await tx.escrowTransaction.create({
        data: {
          orderId,
          type: 'ESCROW_HOLD',
          paymentStatus: 'SUCCESS',
          amount: escrowAmount,
          currency: 'NGN',
          reference: escrowReference,
          paystackRef: reference,
          paystackResponse: paystackJson,
          actorId: order.buyerId,
          note: 'Payment verified and funds locked',
          processedAt: verifiedAt,
        },
      });

      // 4. Audit log entry for the hold
      await tx.escrowAuditLog.create({
        data: {
          orderId,
          actorId: order.buyerId,
          action: 'HOLD',
          fromStatus: 'PENDING',
          toStatus: 'HOLDING',
          amount: escrowAmount,
          reference: escrowReference,
          note: `Escrow funded via Paystack webhook | channel: ${channel}`,
          metadata: { paystackRef: reference } as Prisma.InputJsonValue,
        },
      });

      // 5. Notify buyer
      if (updated.buyerId) {
        await tx.notification.create({
          data: {
            userId: updated.buyerId,
            orderId,
            type: 'PAYMENT_SUCCESS',
            channel: 'IN_APP',
            title: 'Payment successful',
            body: `Your payment of ₦${chargedAmountNgn.toLocaleString()} for order ${updated.trackingCode} has been confirmed. The seller will now ship your item.`,
            isRead: false,
          },
        });
      }

      // 6. Notify seller
      await tx.notification.create({
        data: {
          userId: updated.sellerId,
          orderId,
          type: 'ESCROW_FUNDED',
          channel: 'IN_APP',
          title: 'Payment received — ship now',
          body: `₦${escrowAmount.toLocaleString()} for order ${updated.trackingCode} is secured in escrow. Please ship the item now.`,
          isRead: false,
        },
      });

      return updated;
    });

    this.logger.log(
      `Order ${updatedOrder.trackingCode} → PAID | escrow HOLDING ₦${escrowAmount.toLocaleString()} | ref: ${reference}`,
    );

    // ── Schedule the 48h auto-release job — after the transaction commits ──
    // This only touches BullMQ, not the database, so it's safe to run
    // outside the transaction and safe to retry on redelivery (jobId is
    // deterministic per order, so it's a no-op if it already exists).
    try {
      await this.escrow.scheduleAutoRelease(orderId);
    } catch (queueErr) {
      const msg = queueErr instanceof Error ? queueErr.message : String(queueErr);
      this.logger.error(
        `Failed to schedule auto-release for order ${orderId}: ${msg} — escrow hold was still created successfully`,
      );
    }

    // ── Emit ORDER_PAID event ─────────────────────────────────────────
    this.eventEmitter.emit(NotificationEvents.ORDER_PAID, {
      orderId: updatedOrder.id,
      trackingCode: updatedOrder.trackingCode,
      sellerId: updatedOrder.sellerId,
      buyerId: updatedOrder.buyerId,
      riderId: updatedOrder.riderId,
      status: 'PAID',
      totalAmount: escrowAmount,
    } satisfies OrderEventPayload);

    this.logger.log(
      `charge.success fully processed | order: ${orderId} | ref: ${reference} | escrow ref: ${escrowReference}`,
    );
  }

  // ── charge.failed ─────────────────────────────────────────────────
  private async handleChargeFailed(payload: PaystackWebhookPayload): Promise<void> {
    const { reference, metadata } = payload.data;

    const orderId =
      metadata?.orderId ??
      metadata?.custom_fields?.find((f) => f.variable_name === 'order_id')?.value;

    const record = await this.prisma.paymentRecord.findUnique({
      where: { reference },
    });

    if (record) {
      await this.prisma.paymentRecord.update({
        where: { reference },
        data: {
          status: 'FAILED',
          paystackData: payload.data as unknown as Prisma.InputJsonValue,
        },
      });
    }

    if (orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { buyerId: true, trackingCode: true },
      });

      if (order?.buyerId) {
        await this.prisma.notification.create({
          data: {
            userId: order.buyerId,
            orderId,
            type: 'PAYMENT_FAILED',
            channel: 'IN_APP',
            title: 'Payment failed',
            body: `Your payment for order ${order.trackingCode} could not be processed. Please try again.`,
            isRead: false,
          },
        });
      }
    }

    this.logger.warn(`charge.failed | ref: ${reference} | order: ${orderId ?? 'unknown'}`);
  }
}