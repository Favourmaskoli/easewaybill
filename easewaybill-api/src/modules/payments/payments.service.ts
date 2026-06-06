import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { InitiatePaymentResponseDto, PaymentRecordDto } from './dto/payment-response.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { randomUUID } from 'crypto';
import type { PaginatedResult } from '../../common/dto/pagination.dto';
import { paginate, buildCursorWhere } from '../../common/dto/pagination.dto';

// Map Paystack channel codes to readable labels
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

// Map Paystack channel string → our enum
const CHANNEL_MAP: Record<string, string> = {
  card: 'CARD',
  bank: 'BANK_TRANSFER',
  bank_transfer: 'BANK_TRANSFER',
  ussd: 'USSD',
  qr: 'QR',
  mobile_money: 'MOBILE_MONEY',
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly config: ConfigService,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Payment can only be initiated for AWAITING_PAYMENT orders. Current: ${(order as any).status}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBuyerId = (order as any).buyerId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBuyerEmail = (order as any).buyerEmail;

    if (orderBuyerId && orderBuyerId !== buyer.id) {
      throw new BadRequestException('Only the buyer of this order can initiate payment');
    }
    if (!orderBuyerId && orderBuyerEmail !== buyer.email) {
      throw new BadRequestException('Your email does not match the buyer email on this order');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingSuccess = await (this.prisma as any).paymentRecord.findFirst({
      where: { orderId: dto.orderId, status: 'SUCCESS' },
    });
    if (existingSuccess) {
      throw new BadRequestException(`A successful payment already exists for order ${dto.orderId}`);
    }

    const reference = `EW-PAY-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amountNgn = parseFloat(String((order as any).totalAmount));
    const amountKobo = Math.round(amountNgn * 100);
    const email = dto.email ?? buyer.email;

    const paystackData = await this.paystack.initializeTransaction({
      email,
      amount: amountKobo,
      reference,
      orderId: dto.orderId,
      callbackUrl: dto.callbackUrl,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma as any).paymentRecord.create({
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `Payment initiated | order: ${(order as any).trackingCode} | ref: ${reference} | ₦${amountNgn.toLocaleString()}`,
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
  async getPaymentStatus(orderId: string): Promise<{
    orderId: string;
    trackingCode: string;
    orderStatus: string;
    escrowStatus: string;
    payments: (PaymentRecordDto & { channelLabel: string })[];
    latestStatus: string;
    isPaid: boolean;
  }> {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = await (this.prisma as any).paymentRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payments = records.map((r: any) => ({
      ...this.format(r),
      channelLabel: CHANNEL_LABELS[r.channel] ?? r.channel,
    }));

    const latestStatus = payments[0]?.status ?? 'NO_PAYMENT';
    const isPaid = payments.some((p: PaymentRecordDto) => p.status === 'SUCCESS');

    return {
      orderId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackingCode: (order as any).trackingCode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderStatus: (order as any).status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      escrowStatus: (order as any).escrowStatus,
      payments,
      latestStatus,
      isPaid,
    };
  }

  // ── GET /payments/history — paginated for current user ────────────
  async getHistory(
    user: AuthenticatedUser,
    limit: number = 20,
    cursor?: string,
  ): Promise<PaginatedResult<PaymentRecordDto & { channelLabel: string }>> {
    const cursorWhere = buildCursorWhere(cursor);

    // Find all orders belonging to this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleWhere: any =
      user.role === 'ADMIN'
        ? {}
        : user.role === 'BUYER'
          ? { order: { buyerId: user.id } }
          : { order: { sellerId: user.id } };

    const where = { ...roleWhere, ...cursorWhere };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [records, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.prisma as any).paymentRecord.findMany({
        where,
        include: {
          order: {
            select: { trackingCode: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.prisma as any).paymentRecord.count({ where: roleWhere }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = records.map((r: any) => ({
      ...this.format(r),
      channelLabel: CHANNEL_LABELS[r.channel] ?? r.channel,
      trackingCode: r.order?.trackingCode,
      orderStatus: r.order?.status,
    }));

    return paginate(data, total, limit);
  }

  // ── GET /payments/verify/:reference — polling fallback ────────────
  async verifyByReference(reference: string): Promise<{
    reference: string;
    status: string;
    channelLabel: string;
    amount: number;
    paidAt: string | null;
    orderId: string;
    message: string;
  }> {
    // 1. Check our DB first (idempotency)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (this.prisma as any).paymentRecord.findUnique({
      where: { reference },
    });

    if (existing?.status === 'SUCCESS') {
      return {
        reference,
        status: 'SUCCESS',
        channelLabel: CHANNEL_LABELS[existing.channel] ?? existing.channel,
        amount: parseFloat(String(existing.amount)),
        paidAt: existing.verifiedAt?.toISOString() ?? null,
        orderId: existing.orderId,
        message: 'Payment already verified and confirmed',
      };
    }

    // 2. Call Paystack to verify
    const verified = await this.paystack.verifyTransaction(reference);

    // 3. Update our record if status changed
    if (existing && verified.status === 'success' && existing.status !== 'SUCCESS') {
      const mappedChannel = CHANNEL_MAP[verified.channel] ?? 'UNKNOWN';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.prisma as any).paymentRecord.update({
        where: { reference },
        data: {
          status: 'SUCCESS',
          channel: mappedChannel,
          paystackId: String(verified.id),
          verifiedAt: new Date(verified.paid_at),
          paystackData: verified as unknown as Record<string, unknown>,
        },
      });

      this.logger.log(`Payment verified via polling | ref: ${reference}`);
    }

    return {
      reference,
      status: verified.status === 'success' ? 'SUCCESS' : verified.status.toUpperCase(),
      channelLabel: CHANNEL_LABELS[verified.channel] ?? verified.channel,
      amount: verified.amount / 100,
      paidAt: verified.paid_at ?? null,
      orderId: existing?.orderId ?? '',
      message: verified.status === 'success' ? 'Payment confirmed' : `Payment ${verified.status}`,
    };
  }

  // ── GET /payments/orders/:orderId — all records ───────────────────
  async getByOrder(orderId: string): Promise<PaymentRecordDto[]> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = await (this.prisma as any).paymentRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return records.map((r: any) => this.format(r));
  }

  // ── GET /payments/:reference ──────────────────────────────────────
  async getByReference(reference: string): Promise<PaymentRecordDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (this.prisma as any).paymentRecord.findUnique({
      where: { reference },
    });
    if (!record) {
      throw new NotFoundException(`Payment record not found for reference ${reference}`);
    }
    return this.format(record);
  }

  // ── Helper ────────────────────────────────────────────────────────
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
