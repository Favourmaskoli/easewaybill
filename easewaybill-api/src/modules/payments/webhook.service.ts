import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { EscrowService } from '../escrow/escrow.service';
import { PaystackWebhookPayload } from './dto/webhook-payload.dto';
import { TransferService } from './transfer.service';

// Paystack channel → our PaymentChannel enum
const CHANNEL_MAP: Record<string, string> = {
  card: 'CARD',
  bank: 'BANK_TRANSFER',
  ussd: 'USSD',
  qr: 'QR',
  mobile_money: 'MOBILE_MONEY',
};

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly escrow: EscrowService,
    private readonly transfer: TransferService,
  ) {}

  // ── Handle incoming webhook ───────────────────────────────────────
  async handleWebhook(rawBody: string, signature: string): Promise<{ received: boolean }> {
    // 1. Verify HMAC-SHA512 signature
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

    // 2. Route to correct handler
    switch (payload.event) {
      case 'charge.success':
        await this.handleChargeSuccess(payload);
        break;
      case 'transfer.success':
        await this.transfer.handleTransferSuccess(payload.data.reference, payload.data);
        break;
      case 'transfer.failed':
        await this.transfer.handleTransferFailed(
          payload.data.reference,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload.data as any).reason ?? 'Unknown reason',
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
        // Acknowledge but ignore unhandled events
        this.logger.log(`Unhandled webhook event: ${payload.event}`);
    }

    return { received: true };
  }

  // ── charge.success ────────────────────────────────────────────────
  private async handleChargeSuccess(payload: PaystackWebhookPayload): Promise<void> {
    const { reference, amount, channel, metadata } = payload.data;

    // Extract orderId from metadata
    const orderId =
      metadata?.orderId ??
      metadata?.custom_fields?.find((f) => f.variable_name === 'order_id')?.value;

    if (!orderId) {
      this.logger.error(`charge.success: no orderId in metadata for ref ${reference}`);
      return;
    }

    // Verify with Paystack (don't trust webhook data alone)
    const verified = await this.paystack.verifyTransaction(reference);
    if (verified.status !== 'success') {
      this.logger.warn(
        `charge.success webhook but verify returned: ${verified.status} | ref: ${reference}`,
      );
      return;
    }

    const amountNgn = amount / 100;
    const mappedChannel = CHANNEL_MAP[channel] ?? 'UNKNOWN';

    // Idempotency: skip if already processed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingRecord = await (this.prisma as any).paymentRecord.findUnique({
      where: { reference },
    });

    if (existingRecord?.status === 'SUCCESS') {
      this.logger.log(`charge.success already processed for ref: ${reference}`);
      return;
    }

    // Atomic: update PaymentRecord + trigger escrow hold + update order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.prisma.$transaction(async (tx: any) => {
      // Update or create PaymentRecord
      if (existingRecord) {
        await tx.paymentRecord.update({
          where: { reference },
          data: {
            status: 'SUCCESS',
            channel: mappedChannel,
            paystackId: String(verified.id),
            verifiedAt: new Date(verified.paid_at),
            paystackData: verified as unknown as Record<string, unknown>,
          },
        });
      } else {
        // Webhook arrived before initiate was called (unlikely but safe)
        await tx.paymentRecord.create({
          data: {
            orderId,
            reference,
            amount: amountNgn,
            currency: verified.currency,
            channel: mappedChannel,
            status: 'SUCCESS',
            paystackId: String(verified.id),
            verifiedAt: new Date(verified.paid_at),
            paystackData: verified as unknown as Record<string, unknown>,
          },
        });
      }

      // Send notification to buyer
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { buyerId: true, trackingCode: true },
      });

      if (order?.buyerId) {
        await tx.notification.create({
          data: {
            userId: order.buyerId,
            orderId,
            type: 'PAYMENT_SUCCESS',
            channel: 'IN_APP',
            title: 'Payment successful',
            body: `Your payment of ₦${amountNgn.toLocaleString()} for order ${order.trackingCode} has been confirmed.`,
            isRead: false,
          },
        });
      }
    });

    // Trigger escrow hold AFTER transaction commits
    try {
      await this.escrow.holdFunds({
        orderId,
        amount: amountNgn,
        reference: `ESCROW-${reference}`,
        paystackRef: reference,
        note: `Payment confirmed via Paystack webhook | channel: ${channel}`,
      });

      this.logger.log(
        `charge.success processed | order: ${orderId} | ref: ${reference} | ₦${amountNgn.toLocaleString()}`,
      );
    } catch (escrowErr) {
      // Escrow hold may fail if already held (idempotent replay)
      const msg = escrowErr instanceof Error ? escrowErr.message : String(escrowErr);
      if (msg.includes('already exists')) {
        this.logger.log(`Escrow already held for order ${orderId} — skipping`);
      } else {
        this.logger.error(`Escrow hold failed for order ${orderId}: ${msg}`);
        throw escrowErr;
      }
    }
  }

  // ── charge.failed ─────────────────────────────────────────────────
  private async handleChargeFailed(payload: PaystackWebhookPayload): Promise<void> {
    const { reference, metadata } = payload.data;

    const orderId =
      metadata?.orderId ??
      metadata?.custom_fields?.find((f) => f.variable_name === 'order_id')?.value;

    // Update PaymentRecord to FAILED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (this.prisma as any).paymentRecord.findUnique({
      where: { reference },
    });

    if (record) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.prisma as any).paymentRecord.update({
        where: { reference },
        data: {
          status: 'FAILED',
          paystackData: payload.data as unknown as Record<string, unknown>,
        },
      });
    }

    // Notify buyer of failure
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
