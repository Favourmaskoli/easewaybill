// import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaService } from '../../prisma/prisma.service';
// import { PaystackService } from './paystack.service';
// import { InitiatePaymentDto } from './dto/initiate-payment.dto';
// import { InitiatePaymentResponseDto, PaymentRecordDto } from './dto/payment-response.dto';
// import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
// import { randomUUID } from 'crypto';
// import type { PaginatedResult } from '../../common/dto/pagination.dto';
// import { paginate, buildCursorWhere } from '../../common/dto/pagination.dto';
// import { EscrowService } from '../escrow/escrow.service';

// const CHANNEL_LABELS: Record<string, string> = {
//   card: 'Debit/Credit Card',
//   bank: 'Bank Transfer',
//   ussd: 'USSD',
//   qr: 'QR Code',
//   mobile_money: 'Mobile Money',
//   bank_transfer: 'Bank Transfer',
//   CARD: 'Debit/Credit Card',
//   BANK_TRANSFER: 'Bank Transfer',
//   USSD: 'USSD',
//   QR: 'QR Code',
//   MOBILE_MONEY: 'Mobile Money',
//   UNKNOWN: 'Unknown',
// };

// const CHANNEL_MAP: Record<string, string> = {
//   card: 'CARD',
//   bank: 'BANK_TRANSFER',
//   bank_transfer: 'BANK_TRANSFER',
//   ussd: 'USSD',
//   qr: 'QR',
//   mobile_money: 'MOBILE_MONEY',
// };

// @Injectable()
// export class PaymentsService {
//   private readonly logger = new Logger(PaymentsService.name);

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly paystack: PaystackService,
//     private readonly config: ConfigService,
//     private readonly escrow: EscrowService,
//   ) {}

//   // ── POST /payments/initiate ───────────────────────────────────────
//   async initiatePayment(
//     dto: InitiatePaymentDto,
//     buyer: AuthenticatedUser,
//   ): Promise<InitiatePaymentResponseDto> {
//     const order = await this.prisma.order.findUnique({
//       where: { id: dto.orderId },
//       select: {
//         id: true,
//         status: true,
//         totalAmount: true,
//         trackingCode: true,
//         buyerId: true,
//         buyerEmail: true,
//       },
//     });

//     if (!order) throw new NotFoundException(`Order ${dto.orderId} not found`);

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     if ((order as any).status !== 'AWAITING_PAYMENT') {
//       throw new BadRequestException(
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         `Payment can only be initiated for AWAITING_PAYMENT orders. Current: ${(order as any).status}`,
//       );
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const orderBuyerId = (order as any).buyerId;
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const orderBuyerEmail = (order as any).buyerEmail;

//     if (orderBuyerId && orderBuyerId !== buyer.id) {
//       throw new BadRequestException('Only the buyer of this order can initiate payment');
//     }
//     if (!orderBuyerId && orderBuyerEmail !== buyer.email) {
//       throw new BadRequestException('Your email does not match the buyer email on this order');
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const existingSuccess = await (this.prisma as any).paymentRecord.findFirst({
//       where: { orderId: dto.orderId, status: 'SUCCESS' },
//     });
//     if (existingSuccess) {
//       throw new BadRequestException(`A successful payment already exists for order ${dto.orderId}`);
//     }

//     const reference = `EW-PAY-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const amountNgn = parseFloat(String((order as any).totalAmount));
//     const amountKobo = Math.round(amountNgn * 100);
//     const email = dto.email ?? buyer.email;

//     const paystackData = await this.paystack.initializeTransaction({
//       email,
//       amount: amountKobo,
//       reference,
//       orderId: dto.orderId,
//       callbackUrl: dto.callbackUrl,
//     });

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     await (this.prisma as any).paymentRecord.create({
//       data: {
//         orderId: dto.orderId,
//         reference,
//         amount: amountNgn,
//         currency: 'NGN',
//         channel: 'UNKNOWN',
//         status: 'PENDING',
//         authorizationUrl: paystackData.authorization_url,
//         accessCode: paystackData.access_code,
//         initiatedBy: buyer.id,
//       },
//     });

//     this.logger.log(
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       `Payment initiated | order: ${(order as any).trackingCode} | ref: ${reference} | ₦${amountNgn.toLocaleString()}`,
//     );

//     return {
//       authorizationUrl: paystackData.authorization_url,
//       accessCode: paystackData.access_code,
//       reference,
//       orderId: dto.orderId,
//       amount: amountNgn,
//       currency: 'NGN',
//     };
//   }

//   // ── GET /payments/order/:orderId — payment status for order ───────
//   async getPaymentStatus(orderId: string): Promise<{
//     orderId: string;
//     trackingCode: string;
//     orderStatus: string;
//     escrowStatus: string;
//     payments: (PaymentRecordDto & { channelLabel: string })[];
//     latestStatus: string;
//     isPaid: boolean;
//   }> {
//     const order = await this.prisma.order.findUnique({
//       where: { id: orderId },
//       select: {
//         id: true,
//         trackingCode: true,
//         status: true,
//         escrowStatus: true,
//       },
//     });

//     if (!order) throw new NotFoundException(`Order ${orderId} not found`);

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const records = await (this.prisma as any).paymentRecord.findMany({
//       where: { orderId },
//       orderBy: { createdAt: 'desc' },
//     });

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const payments = records.map((r: any) => ({
//       ...this.format(r),
//       channelLabel: CHANNEL_LABELS[r.channel] ?? r.channel,
//     }));

//     const latestStatus = payments[0]?.status ?? 'NO_PAYMENT';
//     const isPaid = payments.some((p: PaymentRecordDto) => p.status === 'SUCCESS');

//     return {
//       orderId,
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       trackingCode: (order as any).trackingCode,
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       orderStatus: (order as any).status,
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       escrowStatus: (order as any).escrowStatus,
//       payments,
//       latestStatus,
//       isPaid,
//     };
//   }

//   // ── GET /payments/history — paginated for current user ────────────
//   // ✅ FIX: use OR[sellerId, buyerId] instead of branching on account role
//   async getHistory(
//     user: AuthenticatedUser,
//     limit: number = 20,
//     cursor?: string,
//   ): Promise<PaginatedResult<PaymentRecordDto & { channelLabel: string }>> {
//     const cursorWhere = buildCursorWhere(cursor);

//     // Any user can be buyer OR seller on different orders.
//     // Never branch on user.role — always check actual order participation.
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const roleWhere: any =
//       user.role === 'ADMIN'
//         ? {}
//         : {
//             order: {
//               OR: [{ sellerId: user.id }, { buyerId: user.id }],
//             },
//           };

//     const where = { ...roleWhere, ...cursorWhere };

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const [records, total] = await Promise.all([
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       (this.prisma as any).paymentRecord.findMany({
//         where,
//         include: {
//           order: {
//             select: { trackingCode: true, status: true },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//       }),
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       (this.prisma as any).paymentRecord.count({ where: roleWhere }),
//     ]);

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const data = records.map((r: any) => ({
//       ...this.format(r),
//       channelLabel: CHANNEL_LABELS[r.channel] ?? r.channel,
//       trackingCode: r.order?.trackingCode,
//       orderStatus: r.order?.status,
//     }));

//     return paginate(data, total, limit);
//   }

//   // ── GET /payments/verify/:reference — polling fallback ────────────
//   // ✅ FIX: now updates BOTH PaymentRecord AND Order atomically
//   // ✅ FIX: idempotent — if PaymentRecord is SUCCESS but Order missed
//   //         the update, it applies the fix automatically
//   async verifyByReference(reference: string): Promise<{
//     reference: string;
//     status: string;
//     channelLabel: string;
//     amount: number;
//     paidAt: string | null;
//     orderId: string;
//     message: string;
//   }> {
//     // 1. Check our DB first
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const existing = await (this.prisma as any).paymentRecord.findUnique({
//       where: { reference },
//     });

//     if (existing?.status === 'SUCCESS') {
//       // ✅ Idempotent safety net: if order somehow still shows
//       // AWAITING_PAYMENT despite a SUCCESS record, fix it now
//       const order = await this.prisma.order.findUnique({
//         where: { id: existing.orderId },
//         select: { status: true },
//       });

//       if (order && order.status === 'AWAITING_PAYMENT') {
//         await this.prisma.order.update({
//           where: { id: existing.orderId },
//           data: {
//             status: 'PAID',
//             paidAt: existing.verifiedAt ?? new Date(),
//           },
//         });
//         this.logger.log(`Idempotent fix applied: order ${existing.orderId} → PAID during verify`);
//       }

//       return {
//         reference,
//         status: 'SUCCESS',
//         channelLabel: CHANNEL_LABELS[existing.channel] ?? existing.channel,
//         amount: parseFloat(String(existing.amount)),
//         paidAt: existing.verifiedAt?.toISOString() ?? null,
//         orderId: existing.orderId,
//         message: 'Payment already verified and confirmed',
//       };
//     }

//     // 2. Call Paystack to verify
//     const verified = await this.paystack.verifyTransaction(reference);

//     // 3. ✅ If confirmed, update BOTH PaymentRecord AND Order atomically
//     // In verifyByReference, replace the $transaction block:
//     if (existing && verified.status === 'success' && existing.status !== 'SUCCESS') {
//       const mappedChannel = CHANNEL_MAP[verified.channel] ?? 'UNKNOWN';

//       await this.prisma.$transaction(async (tx: any) => {
//         await tx.paymentRecord.update({
//           where: { reference },
//           data: {
//             status: 'SUCCESS',
//             channel: mappedChannel,
//             paystackId: String(verified.id),
//             verifiedAt: new Date(verified.paid_at),
//             paystackData: verified as unknown as Record<string, unknown>,
//           },
//         });

//         await tx.order.update({
//           where: { id: existing.orderId },
//           data: {
//             status: 'PAID',
//             paidAt: new Date(verified.paid_at),
//           },
//         });
//       });

//       this.logger.log(
//         `Payment verified via polling | ref: ${reference} | order: ${existing.orderId} → PAID`,
//       );

//       // ✅ Create escrow hold AFTER transaction commits
//       // This ensures releaseFunds() can find the hold when buyer confirms later
//       try {
//         await this.escrow.holdFunds({
//           orderId: existing.orderId,
//           amount: verified.amount / 100,
//           reference: `ESCROW-${reference}`,
//           paystackRef: reference,
//           note: `Payment verified via polling | ref: ${reference}`,
//         });
//         this.logger.log(`Escrow hold created via verify | order: ${existing.orderId}`);
//       } catch (escrowErr) {
//         const msg = escrowErr instanceof Error ? escrowErr.message : String(escrowErr);
//         if (msg.includes('already exists') || msg.includes('already held')) {
//           this.logger.log(`Escrow already held for order ${existing.orderId} — skipping`);
//         } else {
//           // Don't throw — order is PAID, escrow hold failure is secondary
//           this.logger.error(
//             `Escrow hold failed during verify for order ${existing.orderId}: ${msg}`,
//           );
//         }
//       }
//     }

//     return {
//       reference,
//       status: verified.status === 'success' ? 'SUCCESS' : verified.status.toUpperCase(),
//       channelLabel: CHANNEL_LABELS[verified.channel] ?? verified.channel,
//       amount: verified.amount / 100,
//       paidAt: verified.paid_at ?? null,
//       orderId: existing?.orderId ?? '',
//       message: verified.status === 'success' ? 'Payment confirmed' : `Payment ${verified.status}`,
//     };
//   }

//   // ── GET /payments/orders/:orderId — all records ───────────────────
//   async getByOrder(orderId: string): Promise<PaymentRecordDto[]> {
//     const order = await this.prisma.order.findUnique({
//       where: { id: orderId },
//       select: { id: true },
//     });
//     if (!order) throw new NotFoundException(`Order ${orderId} not found`);

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const records = await (this.prisma as any).paymentRecord.findMany({
//       where: { orderId },
//       orderBy: { createdAt: 'desc' },
//     });
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     return records.map((r: any) => this.format(r));
//   }

//   // ── GET /payments/:reference ──────────────────────────────────────
//   async getByReference(reference: string): Promise<PaymentRecordDto> {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const record = await (this.prisma as any).paymentRecord.findUnique({
//       where: { reference },
//     });
//     if (!record) {
//       throw new NotFoundException(`Payment record not found for reference ${reference}`);
//     }
//     return this.format(record);
//   }

//   // ── Helper ────────────────────────────────────────────────────────
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   private format(r: any): PaymentRecordDto {
//     return {
//       id: r.id,
//       orderId: r.orderId,
//       reference: r.reference,
//       amount: r.amount,
//       currency: r.currency,
//       channel: r.channel,
//       status: r.status,
//       authorizationUrl: r.authorizationUrl,
//       verifiedAt: r.verifiedAt,
//       createdAt: r.createdAt,
//       updatedAt: r.updatedAt,
//     };
//   }
// }

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

    const amountNgn = parseFloat(String(order.totalAmount));
    const amountKobo = Math.round(amountNgn * 100);
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

      if (recent.authorizationUrl && recent.accessCode && Number(recent.amount) === amountNgn) {
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
        amount: amountNgn,
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
      channelLabel: CHANNEL_LABELS[r.channel] ?? r.channel,
    }));

    const latestStatus = payments[0]?.status ?? 'NO_PAYMENT';
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleWhere: any =
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
      channelLabel: CHANNEL_LABELS[r.channel] ?? r.channel,
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

    const settled = outcome === 'FUNDED' || outcome === 'ALREADY_SETTLED';

    return {
      reference,
      status: settled
        ? 'SUCCESS'
        : outcome === 'NEEDS_REVIEW'
          ? 'UNDER_REVIEW'
          : (fresh?.status ?? 'PENDING'),
      channelLabel: CHANNEL_LABELS[fresh?.channel ?? 'UNKNOWN'] ?? 'Unknown',
      amount: Number(fresh?.amount ?? record.amount),
      paidAt: order?.paidAt?.toISOString() ?? null,
      orderId: record.orderId,
      message: settled
        ? 'Payment confirmed'
        : outcome === 'NEEDS_REVIEW'
          ? 'Payment received and under review. Please do not pay again.'
          : 'Payment not completed yet',
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
   * Allowed: the origin of paystack.callbackUrl, plus any origins listed in
   * ALLOWED_CALLBACK_ORIGINS (comma-separated, e.g. a staging frontend).
   */
  private assertAllowedCallbackUrl(callbackUrl?: string): void {
    if (!callbackUrl) return;

    const allowed = new Set<string>();

    const base = this.config.get<string>('paystack.callbackUrl');
    if (base) {
      try {
        allowed.add(new URL(base).origin);
      } catch {
        /* ignore a malformed server config value */
      }
    }

    for (const origin of (this.config.get<string>('ALLOWED_CALLBACK_ORIGINS') ?? '').split(',')) {
      const trimmed = origin.trim();
      if (trimmed) allowed.add(trimmed.replace(/\/$/, ''));
    }

    let origin: string;
    try {
      origin = new URL(callbackUrl).origin;
    } catch {
      throw new BadRequestException('Invalid callback URL');
    }

    if (allowed.size > 0 && !allowed.has(origin)) {
      throw new BadRequestException('Invalid callback URL');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private format(r: any): PaymentRecordDto {
    return {
      id: r.id,
      orderId: r.orderId,
      reference: r.reference,
      amount: r.amount,
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
