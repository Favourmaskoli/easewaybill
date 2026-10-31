import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import type { PaymentChannel } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { EscrowService } from '../escrow/escrow.service';
import { NotificationEvents } from '../notifications/notifications.events';
import type { OrderEventPayload } from '../notifications/notifications.events';
import { CHANNEL_MAP, TERMINAL_ESCROW_STATUSES, extractOrderId } from './payment.utils';

export type SettleOutcome = 'FUNDED' | 'ALREADY_SETTLED' | 'NOT_SUCCESSFUL' | 'NEEDS_REVIEW';
export type SettleSource = 'webhook' | 'verify' | 'reconcile' | 'initiate';

interface SuccessRecordInput {
  orderId: string;
  reference: string;
  amountNgn: number;
  currency: string;
  channel: PaymentChannel;
  paystackId: string;
  verifiedAt: Date;
  paystackJson: Prisma.InputJsonValue;
}

/**
 * Single place where a Paystack charge is turned into PAID + escrow HOLDING.
 * Used by the webhook, the buyer's callback verify, initiate (pending check)
 * and the reconciliation job. Safe to call any number of times per reference.
 */
@Injectable()
export class PaymentSettlementService {
  private readonly logger = new Logger(PaymentSettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly escrow: EscrowService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async settleCharge(reference: string, source: SettleSource = 'webhook'): Promise<SettleOutcome> {
    const record = await this.prisma.paymentRecord.findUnique({
      where: { reference },
      select: { orderId: true, status: true, needsReview: true },
    });

    // ── Fast paths (no Paystack call; the callback page polls this) ──
    if (record?.needsReview) return 'NEEDS_REVIEW';

    if (record?.status === 'SUCCESS') {
      const hold = await this.prisma.escrowTransaction.findFirst({
        where: {
          orderId: record.orderId,
          type: 'ESCROW_HOLD',
          paymentStatus: 'SUCCESS',
          paystackRef: reference,
        },
        select: { id: true },
      });
      if (hold) return 'ALREADY_SETTLED';
      // SUCCESS record without a hold = half-settled: fall through and repair it.
    }

    // ── Never trust the webhook payload alone: verify with Paystack ──
    // Throws on network/API errors so the caller (webhook => 500) can retry.
    const verified = await this.paystack.verifyTransaction(reference);

    if (verified.status !== 'success') return 'NOT_SUCCESSFUL';

    if (verified.reference !== reference) {
      return this.flag(reference, `Reference mismatch: verified ref ${verified.reference}`);
    }

    // Our own PaymentRecord is the source of truth for the order.
    // Paystack metadata (set by us at initialize) must agree with it.
    const metaOrderId = extractOrderId(verified.metadata);
    const orderId = record?.orderId ?? metaOrderId;

    if (!orderId) {
      return this.flag(reference, 'No order id on our record or in Paystack metadata');
    }
    if (metaOrderId && metaOrderId !== orderId) {
      return this.flag(
        reference,
        `Order mismatch: our record ${orderId}, Paystack metadata ${metaOrderId}`,
      );
    }

    // If Paystack passes fees to the customer, `amount` includes the fee.
    // Compare and hold the order amount (requested_amount) instead.
    const orderAmountKobo = verified.requested_amount ?? verified.amount;
    if (verified.amount < orderAmountKobo) {
      return this.flag(
        reference,
        `Paid ${verified.amount} kobo is less than requested ${orderAmountKobo}`,
      );
    }
    const amountNgn = orderAmountKobo / 100;
    if (verified.currency !== 'NGN') {
      return this.flag(reference, `Currency mismatch for order ${orderId}: ${verified.currency}`);
    }

    const verifiedAt = verified.paid_at ? new Date(verified.paid_at) : null;
    if (!verifiedAt || Number.isNaN(verifiedAt.getTime())) {
      return this.flag(reference, `Invalid or missing paid_at for order ${orderId}`);
    }

    const orderBefore = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, totalAmount: true },
    });
    if (!orderBefore) {
      return this.flag(reference, `Verified payment has no matching order ${orderId}`);
    }

    const expectedAmountNgn = Number(orderBefore.totalAmount);
    if (!Number.isFinite(expectedAmountNgn) || expectedAmountNgn <= 0) {
      return this.flag(reference, `Invalid expected amount on order ${orderId}`);
    }

    const payment: SuccessRecordInput = {
      orderId,
      reference,
      amountNgn,
      currency: verified.currency,
      channel: CHANNEL_MAP[verified.channel] ?? 'UNKNOWN',
      paystackId: String(verified.id),
      verifiedAt,
      paystackJson: verified as unknown as Prisma.InputJsonValue,
    };

    // ── Wrong amount: record it for reconciliation, never fund escrow ──
    if (Math.abs(amountNgn - expectedAmountNgn) > 0.01) {
      const conflictOrderId = await this.serializable((tx) => this.recordSuccess(tx, payment));

      if (conflictOrderId) {
        return this.flag(
          reference,
          `Reference conflict: existing order ${conflictOrderId}, incoming order ${orderId}`,
        );
      }

      return this.flag(
        reference,
        `Amount mismatch for order ${orderId}: expected ₦${expectedAmountNgn}, received ₦${amountNgn}. Payment recorded; escrow NOT funded.`,
      );
    }

    // ── Happy path: record payment, mark order PAID, create hold + audit ──
    const result = await this.serializable(async (tx) => {
      const conflictOrderId = await this.recordSuccess(tx, payment);
      if (conflictOrderId) {
        return { kind: 'payment_reference_conflict' as const, existingOrderId: conflictOrderId };
      }

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
        where: { orderId, type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
        select: { id: true, reference: true, paystackRef: true },
      });

      if (existingHold) {
        return {
          kind: 'existing_hold' as const,
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

      // PAID is allowed for recovery (order marked paid, hold never created).
      if (order.status !== 'AWAITING_PAYMENT' && order.status !== 'PAID') {
        return {
          kind: 'ineligible' as const,
          status: order.status,
          escrowStatus: order.escrowStatus,
        };
      }

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
      const note = `Payment confirmed via Paystack (${source}) | channel: ${verified.channel}`;

      await tx.escrowTransaction.create({
        data: {
          orderId,
          type: 'ESCROW_HOLD',
          paymentStatus: 'SUCCESS',
          amount: amountNgn,
          currency: verified.currency,
          reference: holdReference,
          paystackRef: reference,
          paystackResponse: payment.paystackJson,
          actorId: order.buyerId,
          note,
          processedAt: new Date(),
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
          note,
          metadata: {
            paystackRef: reference,
            channel: verified.channel,
            source,
          },
        },
      });

      return { kind: 'funded' as const, order: updatedOrder, holdReference };
    });

    if (result.kind === 'payment_reference_conflict') {
      return this.flag(
        reference,
        `Reference conflict: existing order ${result.existingOrderId}, incoming order ${orderId}`,
      );
    }

    if (result.kind === 'order_missing') {
      return this.flag(reference, `Verified payment has no matching order ${orderId}`);
    }

    if (result.kind === 'existing_hold') {
      const samePayment =
        result.existingPaystackRef === reference || result.holdReference === `ESCROW-${reference}`;

      if (samePayment) {
        this.logger.log(
          `Duplicate settle ignored; hold already exists | order: ${orderId} | ref: ${reference}`,
        );
        return 'ALREADY_SETTLED';
      }

      return this.flag(
        reference,
        `DUPLICATE PAYMENT: order ${orderId} is already funded (hold ${result.holdReference}, ref ${result.existingPaystackRef ?? 'unknown'}). No second hold created. Refund this payment.`,
      );
    }

    if (result.kind === 'ineligible') {
      return this.flag(
        reference,
        `Order ${orderId} cannot be funded in its current state (status: ${result.status}, escrow: ${result.escrowStatus}).`,
      );
    }

    this.logger.log(
      `Order ${result.order.trackingCode} → PAID | src: ${source} | ref: ${reference} | ₦${amountNgn.toLocaleString()} | hold: ${result.holdReference}`,
    );

    // The transaction is committed. These must not undo a successful payment.
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

    return 'FUNDED';
  }

  // ── Helpers ───────────────────────────────────────────────────────

  /** Upserts the SUCCESS record. Returns the other order id if the reference belongs to a different order. */
  private async recordSuccess(
    tx: Prisma.TransactionClient,
    p: SuccessRecordInput,
  ): Promise<string | null> {
    const existing = await tx.paymentRecord.findUnique({
      where: { reference: p.reference },
      select: { orderId: true },
    });

    if (existing && existing.orderId !== p.orderId) {
      return existing.orderId;
    }

    await tx.paymentRecord.upsert({
      where: { reference: p.reference },
      create: {
        orderId: p.orderId,
        reference: p.reference,
        amount: p.amountNgn,
        currency: p.currency,
        channel: p.channel,
        status: 'SUCCESS',
        paystackId: p.paystackId,
        verifiedAt: p.verifiedAt,
        paystackData: p.paystackJson,
      },
      update: {
        status: 'SUCCESS',
        amount: p.amountNgn,
        currency: p.currency,
        channel: p.channel,
        paystackId: p.paystackId,
        verifiedAt: p.verifiedAt,
        paystackData: p.paystackJson,
      },
    });

    return null;
  }

  /** Persists a "needs a human" flag so it is not lost in short-lived serverless logs. */
  private async flag(reference: string, note: string): Promise<'NEEDS_REVIEW'> {
    this.logger.error(`RECONCILIATION REQUIRED | ref: ${reference} | ${note}`);

    try {
      await this.prisma.paymentRecord.updateMany({
        where: { reference },
        data: { needsReview: true, reviewNote: note.slice(0, 500) },
      });
    } catch (e) {
      this.logger.error(
        `Could not persist review flag for ${reference}: ${e instanceof Error ? e.message : e}`,
      );
    }

    return 'NEEDS_REVIEW';
  }

  /**
   * Serializable transactions can fail with P2034 when the webhook and the
   * buyer's callback race each other. Retry a few times before giving up.
   */
  private async serializable<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    attempts = 3,
  ): Promise<T> {
    for (let i = 1; ; i++) {
      try {
        return await this.prisma.$transaction(fn, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2034' &&
          i < attempts
        ) {
          continue;
        }
        throw e;
      }
    }
  }
}
