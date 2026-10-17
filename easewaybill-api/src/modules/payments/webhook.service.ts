import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, PaymentChannel } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { EscrowService } from '../escrow/escrow.service';
import { PaystackWebhookPayload } from './dto/webhook-payload.dto';
import { TransferService } from './transfer.service';
import { NotificationEvents } from '../notifications/notifications.events';
import type { OrderEventPayload } from '../notifications/notifications.events';

const CHANNEL_MAP: Record<string, PaymentChannel> = {
  card: 'CARD',
  bank: 'BANK_TRANSFER',
  ussd: 'USSD',
  qr: 'QR',
  mobile_money: 'MOBILE_MONEY',
};

const TERMINAL_ESCROW_STATUSES = new Set<string>([
  'RELEASED',
  'PARTIALLY_RELEASED',
  'REFUNDED',
  'DISPUTED',
]);

function extractOrderId(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const data = metadata as Record<string, unknown>;

  if (typeof data.orderId === 'string' && data.orderId.trim()) {
    return data.orderId.trim();
  }

  if (!Array.isArray(data.custom_fields)) {
    return undefined;
  }

  for (const field of data.custom_fields) {
    if (!field || typeof field !== 'object' || Array.isArray(field)) {
      continue;
    }

    const customField = field as Record<string, unknown>;

    if (
      customField.variable_name === 'order_id' &&
      typeof customField.value === 'string' &&
      customField.value.trim()
    ) {
      return customField.value.trim();
    }
  }

  return undefined;
}

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

    if (!payload?.event || !payload.data?.reference) {
      throw new BadRequestException('Webhook payload is missing required fields');
    }

    this.logger.log(`Webhook received: ${payload.event} | ref: ${payload.data.reference}`);

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
    const { reference, metadata } = payload.data;
    const incomingOrderId = extractOrderId(metadata);

    if (!incomingOrderId) {
      this.logger.error(
        `charge.success: missing or invalid orderId in webhook metadata | ref: ${reference}. Manual reconciliation required.`,
      );
      return;
    }

    // Verify the transaction directly with Paystack.
    // Do not trust the webhook payload alone.
    const verified = await this.paystack.verifyTransaction(reference);

    if (verified.status !== 'success') {
      this.logger.warn(
        `Paystack verification was not successful: ${verified.status} | ref: ${reference}`,
      );
      return;
    }

    if (verified.reference !== reference) {
      this.logger.error(
        `PAYMENT REFERENCE MISMATCH — webhook ref: ${reference}, verified ref: ${verified.reference}. Manual reconciliation required.`,
      );
      return;
    }

    // The verified transaction must identify the same order as the webhook.
    const verifiedOrderId = extractOrderId(verified.metadata);

    if (!verifiedOrderId || verifiedOrderId !== incomingOrderId) {
      this.logger.error(
        `PAYMENT ORDER METADATA MISMATCH — ref: ${reference}, webhook order: ${incomingOrderId}, verified order: ${verifiedOrderId ?? 'missing'}. Manual reconciliation required.`,
      );
      return;
    }

    const orderId = verifiedOrderId;
    const amountNgn = verified.amount / 100;
    const mappedChannel = CHANNEL_MAP[verified.channel] ?? 'UNKNOWN';
    const verifiedAt = verified.paid_at ? new Date(verified.paid_at) : new Date();
    const paystackJson = verified as unknown as Prisma.InputJsonValue;

    if (!Number.isFinite(amountNgn) || amountNgn <= 0 || !Number.isFinite(verified.amount)) {
      this.logger.error(
        `Invalid verified payment amount | order: ${orderId} | ref: ${reference}. Manual reconciliation required.`,
      );
      return;
    }

    if (verified.currency !== 'NGN') {
      this.logger.error(
        `PAYMENT CURRENCY MISMATCH — order: ${orderId}, currency: ${verified.currency}, ref: ${reference}. Manual reconciliation required.`,
      );
      return;
    }

    if (Number.isNaN(verifiedAt.getTime()) || !verified.paid_at) {
      this.logger.error(
        `Invalid or missing verified payment timestamp | order: ${orderId} | ref: ${reference}. Manual reconciliation required.`,
      );
      return;
    }

    // Confirm the order exists before attempting to record or fund payment.
    const orderBeforeTransaction = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalAmount: true,
      },
    });

    if (!orderBeforeTransaction) {
      this.logger.error(
        `Verified payment has no matching order: ${orderId} | ref: ${reference}. Reconciliation required.`,
      );
      return;
    }

    const expectedAmountNgn = Number(orderBeforeTransaction.totalAmount);

    if (!Number.isFinite(expectedAmountNgn) || expectedAmountNgn <= 0) {
      this.logger.error(
        `Invalid expected order amount: ${orderId} | ref: ${reference}. Manual reconciliation required.`,
      );
      return;
    }

    // A verified successful charge with the wrong amount must be recorded
    // for reconciliation, but it must never fund escrow automatically.
    if (Math.abs(amountNgn - expectedAmountNgn) > 0.01) {
      const mismatchResult = await this.prisma.$transaction(
        async (tx) => {
          const existingPayment = await tx.paymentRecord.findUnique({
            where: { reference },
            select: { orderId: true },
          });

          if (existingPayment && existingPayment.orderId !== orderId) {
            return {
              kind: 'payment_reference_conflict' as const,
              existingOrderId: existingPayment.orderId,
            };
          }

          await tx.paymentRecord.upsert({
            where: { reference },
            create: {
              orderId,
              reference,
              amount: amountNgn,
              currency: verified.currency,
              channel: mappedChannel,
              status: 'SUCCESS',
              paystackId: String(verified.id),
              verifiedAt,
              paystackData: paystackJson,
            },
            update: {
              status: 'SUCCESS',
              amount: amountNgn,
              currency: verified.currency,
              channel: mappedChannel,
              paystackId: String(verified.id),
              verifiedAt,
              paystackData: paystackJson,
            },
          });

          return { kind: 'recorded' as const };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      if (mismatchResult.kind === 'payment_reference_conflict') {
        this.logger.error(
          `PAYMENT REFERENCE CONFLICT — ref: ${reference}, existing order: ${mismatchResult.existingOrderId}, incoming order: ${orderId}. Manual reconciliation required.`,
        );
        return;
      }

      this.logger.error(
        `PAYMENT AMOUNT MISMATCH — order: ${orderId}, expected: ₦${expectedAmountNgn}, received: ₦${amountNgn}, ref: ${reference}. Payment recorded; escrow was not funded. Manual reconciliation required.`,
      );
      return;
    }

    // Atomically verify reference ownership, record the successful payment,
    // update the order, and create its escrow hold and audit record.
    const result = await this.prisma.$transaction(
      async (tx) => {
        // This check belongs inside the transaction too. The earlier order
        // lookup is not sufficient protection against concurrent requests.
        const existingPayment = await tx.paymentRecord.findUnique({
          where: { reference },
          select: { orderId: true },
        });

        if (existingPayment && existingPayment.orderId !== orderId) {
          return {
            kind: 'payment_reference_conflict' as const,
            existingOrderId: existingPayment.orderId,
          };
        }

        await tx.paymentRecord.upsert({
          where: { reference },
          create: {
            orderId,
            reference,
            amount: amountNgn,
            currency: verified.currency,
            channel: mappedChannel,
            status: 'SUCCESS',
            paystackId: String(verified.id),
            verifiedAt,
            paystackData: paystackJson,
          },
          update: {
            status: 'SUCCESS',
            amount: amountNgn,
            currency: verified.currency,
            channel: mappedChannel,
            paystackId: String(verified.id),
            verifiedAt,
            paystackData: paystackJson,
          },
        });

        const order = await tx.order.findUnique({
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
          return { kind: 'order_missing' as const };
        }

        // Never create another successful hold for this order.
        const existingHold = await tx.escrowTransaction.findFirst({
          where: {
            orderId,
            type: 'ESCROW_HOLD',
            paymentStatus: 'SUCCESS',
          },
          select: {
            id: true,
            reference: true,
            paystackRef: true,
          },
        });

        if (existingHold) {
          return {
            kind: 'existing_hold' as const,
            trackingCode: order.trackingCode,
            holdReference: existingHold.reference,
            existingPaystackRef: existingHold.paystackRef,
          };
        }

        // Do not fund terminal escrow states.
        if (TERMINAL_ESCROW_STATUSES.has(order.escrowStatus)) {
          return {
            kind: 'ineligible' as const,
            status: order.status,
            escrowStatus: order.escrowStatus,
          };
        }

        // PAID is permitted for recovery if the order was marked paid but
        // its escrow hold was not created in an earlier attempt.
        if (order.status !== 'AWAITING_PAYMENT' && order.status !== 'PAID') {
          return {
            kind: 'ineligible' as const,
            status: order.status,
            escrowStatus: order.escrowStatus,
          };
        }

        const now = new Date();

        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            paidAt: order.status === 'PAID' ? undefined : verifiedAt,
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

        const holdReference = `ESCROW-${reference}`;

        await tx.escrowTransaction.create({
          data: {
            orderId,
            type: 'ESCROW_HOLD',
            paymentStatus: 'SUCCESS',
            amount: amountNgn,
            currency: verified.currency,
            reference: holdReference,
            paystackRef: reference,
            paystackResponse: paystackJson,
            actorId: order.buyerId,
            note: `Payment confirmed via Paystack webhook | channel: ${verified.channel}`,
            processedAt: now,
          },
        });

        await tx.escrowAuditLog.create({
          data: {
            orderId,
            actorId: order.buyerId,
            action: 'HOLD',
            fromStatus: 'PENDING',
            toStatus: 'HOLDING',
            amount: amountNgn,
            reference: holdReference,
            note: `Payment confirmed via Paystack webhook | channel: ${verified.channel}`,
            metadata: {
              paystackRef: reference,
              channel: verified.channel,
            },
          },
        });

        return {
          kind: 'funded' as const,
          order: updatedOrder,
          holdReference,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    if (result.kind === 'payment_reference_conflict') {
      this.logger.error(
        `PAYMENT REFERENCE CONFLICT — ref: ${reference}, existing order: ${result.existingOrderId}, incoming order: ${orderId}. Manual reconciliation required.`,
      );
      return;
    }

    if (result.kind === 'order_missing') {
      this.logger.error(
        `Verified payment has no matching order: ${orderId} | ref: ${reference}. Reconciliation required.`,
      );
      return;
    }

    if (result.kind === 'existing_hold') {
      const samePayment =
        result.existingPaystackRef === reference || result.holdReference === `ESCROW-${reference}`;

      if (samePayment) {
        this.logger.log(
          `Duplicate charge.success safely ignored; existing escrow hold found for order ${orderId} | ref: ${reference}`,
        );
      } else {
        this.logger.error(
          `RECONCILIATION REQUIRED — another successful payment was received for already-funded order ${orderId}. New payment ref: ${reference}; existing hold: ${result.holdReference}; existing Paystack ref: ${result.existingPaystackRef ?? 'unknown'}. No second hold was created.`,
        );
      }

      return;
    }

    if (result.kind === 'ineligible') {
      this.logger.error(
        `RECONCILIATION REQUIRED — payment ${reference} succeeded, but order ${orderId} cannot be funded in its current state. Order status: ${result.status}; escrow status: ${result.escrowStatus}.`,
      );
      return;
    }

    this.logger.log(
      `Order ${result.order.trackingCode} → PAID | ref: ${reference} | ₦${amountNgn.toLocaleString()} | hold: ${result.holdReference}`,
    );

    // The database transaction is already committed. Scheduling failure is
    // logged for reconciliation; it must not undo the successful payment.
    try {
      await this.escrow.scheduleAutoRelease(orderId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Auto-release scheduling failed for order ${orderId}: ${message}. Manual reconciliation required.`,
      );
    }

    this.eventEmitter.emit(NotificationEvents.ORDER_PAID, {
      orderId: result.order.id,
      trackingCode: result.order.trackingCode,
      sellerId: result.order.sellerId,
      buyerId: result.order.buyerId,
      riderId: result.order.riderId,
      status: 'PAID',
      totalAmount: amountNgn,
    } satisfies OrderEventPayload);

    this.logger.log(
      `charge.success processed | order: ${orderId} | ref: ${reference} | ₦${amountNgn.toLocaleString()}`,
    );
  }

  // ── charge.failed ─────────────────────────────────────────────────

  private async handleChargeFailed(payload: PaystackWebhookPayload): Promise<void> {
    const { reference, metadata } = payload.data;
    const orderId = extractOrderId(metadata);

    const record = await this.prisma.paymentRecord.findUnique({
      where: { reference },
    });

    // A delayed charge.failed event must not overwrite a verified success.
    if (record && record.status !== 'SUCCESS') {
      await this.prisma.paymentRecord.update({
        where: { reference },
        data: { status: 'FAILED' },
      });
    }

    if (orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          buyerId: true,
          trackingCode: true,
        },
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
