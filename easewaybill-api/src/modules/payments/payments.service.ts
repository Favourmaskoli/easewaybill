import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentRecord, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { PaymentSettlementService } from './payment-settlement.service';
import type { SettleOutcome } from './payment-settlement.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { InitiatePaymentResponseDto, PaymentRecordDto } from './dto/payment-response.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import type { PaginatedResult } from '../../common/dto/pagination.dto';
import { paginate, buildCursorWhere } from '../../common/dto/pagination.dto';

const CHANNEL_LABELS: Record<string, string> = {
  card: 'Debit/Credit Card',
  bank: 'Bank Transfer',
  ussd: 'USSD',
  qr: 'QR Code',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  CARD: 'Debit/Credit Card',
  BANK_TRANSFER: 'Bank Transfer',
  USSD: 'USSD',
  QR: 'QR Code',
  MOBILE_MONEY: 'Mobile Money',
  UNKNOWN: 'Unknown',
};

/** A PENDING attempt younger than this is settled/reused before a new one is created. */
const PENDING_REUSE_WINDOW_MS = 15 * 60_000;

function channelLabel(channel: string | null | undefined): string {
  if (!channel) return CHANNEL_LABELS.UNKNOWN;
  return CHANNEL_LABELS[channel] ?? channel;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly config: ConfigService,
    private readonly settlement: PaymentSettlementService,
  ) {}

  // ── POST /payments/initiate ───────────────────────────────────────
  async initiatePayment(
    dto: InitiatePaymentDto,
    buyer: AuthenticatedUser,
  ): Promise<InitiatePaymentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        trackingCode: true,
        buyerId: true,
        buyerEmail: true,
      },
    });

    if (!order) throw new NotFoundException(`Order ${dto.orderId} not found`);

    if (order.status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException(
        `Payment can only be initiated for AWAITING_PAYMENT orders. Current: ${order.status}`,
      );
    }

    if (order.buyerId && order.buyerId !== buyer.id) {
      throw new BadRequestException('Only the buyer of this order can initiate payment');
    }
    if (!order.buyerId && order.buyerEmail !== buyer.email) {
      throw new BadRequestException('Your email does not match the buyer email on this order');
    }

    this.assertAllowedCallbackUrl(dto.callbackUrl);

    const existingSuccess = await this.prisma.paymentRecord.findFirst({
      where: { orderId: dto.orderId, status: 'SUCCESS' },
      select: { needsReview: true },
    });
    if (existingSuccess) {
      throw new BadRequestException(
        existingSuccess.needsReview
          ? 'A payment for this order is under review. Please contact support instead of paying again.'
          : `A successful payment already exists for order ${dto.orderId}`,
      );
    }

    // Exact decimal maths: never push money through floating point.
    const amountNgn = order.totalAmount.toNumber();
    const amountKobo = order.totalAmount.mul(100).round().toNumber();
    const email = dto.email ?? buyer.email;

    // ── Duplicate-payment guard ──────────────────────────────────────
    // The risky window is between "buyer paid" and "order marked PAID".
    // Settle any recent pending attempt first (covers a missed webhook),
    // then reuse its checkout link instead of opening a second transaction.
    const recent = await this.prisma.paymentRecord.findFirst({
      where: {
        orderId: dto.orderId,
        status: 'PENDING',
        createdAt: { gt: new Date(Date.now() - PENDING_REUSE_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recent) {
      try {
        await this.settlement.settleCharge(recent.reference, 'initiate');
      } catch {
        // Not paid / not known to Paystack yet. Fall through to reuse logic.
      }

      const current = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { status: true },
      });
      if (current?.status !== 'AWAITING_PAYMENT') {
        throw new BadRequestException('This order has already been paid. Please refresh.');
      }

      if (recent.authorizationUrl && recent.accessCode && recent.amount.equals(order.totalAmount)) {
        return {
          authorizationUrl: recent.authorizationUrl,
          accessCode: recent.accessCode,
          reference: recent.reference,
          orderId: dto.orderId,
          amount: amountNgn,
          currency: 'NGN',
        };
      }
    }

    const reference = `EW-PAY-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

    const paystackData = await this.paystack.initializeTransaction({
      email,
      amount: amountKobo,
      reference,
      orderId: dto.orderId,
      callbackUrl: dto.callbackUrl,
    });

    await this.prisma.paymentRecord.create({
      data: {
        orderId: dto.orderId,
        reference,
        amount: order.totalAmount,
        currency: 'NGN',
        channel: 'UNKNOWN',
        status: 'PENDING',
        authorizationUrl: paystackData.authorization_url,
        accessCode: paystackData.access_code,
        initiatedBy: buyer.id,
      },
    });

    this.logger.log(
      `Payment initiated | order: ${order.trackingCode} | ref: ${reference} | ₦${amountNgn.toLocaleString()}`,
    );

    return {
      authorizationUrl: paystackData.authorization_url,
      accessCode: paystackData.access_code,
      reference,
      orderId: dto.orderId,
      amount: amountNgn,
      currency: 'NGN',
    };
  }

  // ── GET /payments/order/:orderId — payment status for order ───────
  async getPaymentStatus(
    orderId: string,
    user: AuthenticatedUser,
  ): Promise<{
    orderId: string;
    trackingCode: string;
    orderStatus: string;
    escrowStatus: string;
    payments: (PaymentRecordDto & { channelLabel: string })[];
    latestStatus: string;
    isPaid: boolean;
  }> {
    await this.assertCanAccessOrder(orderId, user);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        trackingCode: true,
        status: true,
        escrowStatus: true,
      },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const records = await this.prisma.paymentRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    const payments = records.map((r) => ({
      ...this.format(r),
      channelLabel: channelLabel(r.channel),
    }));

    const latestStatus: string = payments[0]?.status ?? 'NO_PAYMENT';
    const isPaid = payments.some((p) => p.status === 'SUCCESS');

    return {
      orderId,
      trackingCode: order.trackingCode,
      orderStatus: order.status,
      escrowStatus: order.escrowStatus,
      payments,
      latestStatus,
      isPaid,
    };
  }

  // ── GET /payments/history — paginated for current user ────────────
  // Any user can be buyer OR seller on different orders, so never branch
  // on user.role: check actual order participation.
  async getHistory(
    user: AuthenticatedUser,
    limit: number = 20,
    cursor?: string,
  ): Promise<PaginatedResult<PaymentRecordDto & { channelLabel: string }>> {
    const cursorWhere = buildCursorWhere(cursor);

    const roleWhere: Prisma.PaymentRecordWhereInput =
      user.role === 'ADMIN'
        ? {}
        : {
            order: {
              OR: [{ sellerId: user.id }, { buyerId: user.id }],
            },
          };

    const where = { ...roleWhere, ...cursorWhere };

    const [records, total] = await Promise.all([
      this.prisma.paymentRecord.findMany({
        where,
        include: {
          order: {
            select: { trackingCode: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.paymentRecord.count({ where: roleWhere }),
    ]);

    const data = records.map((r) => ({
      ...this.format(r),
      channelLabel: channelLabel(r.channel),
      trackingCode: r.order?.trackingCode,
      orderStatus: r.order?.status,
    }));

    return paginate(data, total, limit);
  }

  // ── GET /payments/verify/:reference — callback fallback ───────────
  // Runs the SAME settlement path as the webhook (amount, currency, order
  // checks, escrow hold, auto-release, notification), so the two can never
  // drift apart again.
  async verifyByReference(
    reference: string,
    user: AuthenticatedUser,
  ): Promise<{
    reference: string;
    status: string;
    channelLabel: string;
    amount: number;
    paidAt: string | null;
    orderId: string;
    message: string;
  }> {
    const record = await this.prisma.paymentRecord.findUnique({ where: { reference } });
    if (!record) {
      throw new NotFoundException(`Payment record not found for reference ${reference}`);
    }

    await this.assertCanAccessOrder(record.orderId, user);

    let outcome: SettleOutcome;
    try {
      outcome = await this.settlement.settleCharge(reference, 'verify');
    } catch (e) {
      // Paystack unreachable or does not know this reference yet.
      // The callback page keeps polling, so report "not completed yet".
      this.logger.warn(`verify ${reference}: ${e instanceof Error ? e.message : String(e)}`);
      outcome = 'NOT_SUCCESSFUL';
    }

    const [order, fresh] = await Promise.all([
      this.prisma.order.findUnique({
        where: { id: record.orderId },
        select: { paidAt: true },
      }),
      this.prisma.paymentRecord.findUnique({ where: { reference } }),
    ]);

    const current = fresh ?? record;
    const settled = outcome === 'FUNDED' || outcome === 'ALREADY_SETTLED';

    let status: string;
    let message: string;

    if (settled) {
      status = 'SUCCESS';
      message = 'Payment confirmed';
    } else if (outcome === 'NEEDS_REVIEW') {
      status = 'UNDER_REVIEW';
      message = 'Payment received and under review. Please do not pay again.';
    } else {
      status = current.status;
      message = 'Payment not completed yet';
    }

    return {
      reference,
      status,
      channelLabel: channelLabel(current.channel),
      amount: current.amount.toNumber(),
      paidAt: order?.paidAt?.toISOString() ?? null,
      orderId: record.orderId,
      message,
    };
  }

  // ── GET /payments/orders/:orderId — all records ───────────────────
  async getByOrder(orderId: string, user: AuthenticatedUser): Promise<PaymentRecordDto[]> {
    await this.assertCanAccessOrder(orderId, user);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const records = await this.prisma.paymentRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.format(r));
  }

  // ── GET /payments/:reference ──────────────────────────────────────
  async getByReference(reference: string, user: AuthenticatedUser): Promise<PaymentRecordDto> {
    const record = await this.prisma.paymentRecord.findUnique({
      where: { reference },
    });
    if (!record) {
      throw new NotFoundException(`Payment record not found for reference ${reference}`);
    }

    await this.assertCanAccessOrder(record.orderId, user);

    return this.format(record);
  }

  // ── Helpers ───────────────────────────────────────────────────────

  /** Only the buyer, the seller or an admin may read an order's payments. 404 (not 403) so existence isn't leaked. */
  private async assertCanAccessOrder(orderId: string, user: AuthenticatedUser): Promise<void> {
    if (user.role === 'ADMIN') return;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true, sellerId: true, buyerEmail: true },
    });

    const allowed =
      !!order &&
      (order.sellerId === user.id ||
        order.buyerId === user.id ||
        (!order.buyerId && order.buyerEmail === user.email));

    if (!allowed) throw new NotFoundException(`Order ${orderId} not found`);
  }

  /**
   * Stops a client from sending the buyer to an arbitrary site after paying.
   * Allowed origins: the origin of paystack.callbackUrl, plus any origins listed
   * in ALLOWED_CALLBACK_ORIGINS (comma-separated, e.g. a staging frontend).
   * Fails closed: if no origin is configured, a client-supplied callback is rejected.
   */
  private assertAllowedCallbackUrl(callbackUrl?: string): void {
    if (!callbackUrl) return;

    const allowed = new Set<string>();

    const addOrigin = (value: string | undefined): void => {
      const trimmed = value?.trim();
      if (!trimmed) return;
      try {
        allowed.add(new URL(trimmed).origin);
      } catch {
        this.logger.warn(`Ignoring malformed callback origin in config: ${trimmed}`);
      }
    };

    addOrigin(this.config.get<string>('paystack.callbackUrl'));
    for (const origin of (this.config.get<string>('ALLOWED_CALLBACK_ORIGINS') ?? '').split(',')) {
      addOrigin(origin);
    }

    if (allowed.size === 0) {
      this.logger.error(
        'No callback origins configured (paystack.callbackUrl / ALLOWED_CALLBACK_ORIGINS); rejecting client callbackUrl',
      );
      throw new BadRequestException('Callback URL is not allowed');
    }

    let origin: string;
    try {
      origin = new URL(callbackUrl).origin;
    } catch {
      throw new BadRequestException('Invalid callback URL');
    }

    if (!allowed.has(origin)) {
      throw new BadRequestException('Invalid callback URL');
    }
  }

  private format(r: PaymentRecord): PaymentRecordDto {
    return {
      id: r.id,
      orderId: r.orderId,
      reference: r.reference,
      amount: r.amount.toNumber(),
      currency: r.currency,
      channel: r.channel,
      status: r.status,
      authorizationUrl: r.authorizationUrl,
      verifiedAt: r.verifiedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
