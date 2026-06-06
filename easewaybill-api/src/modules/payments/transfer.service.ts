import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { InitiateTransferDto } from './dto/initiate-transfer.dto';
import { TransferRecipientDto, TransferRecordDto } from './dto/transfer-response.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
  ) {}

  // ── POST /payments/transfer ───────────────────────────────────────
  async initiateTransfer(dto: InitiateTransferDto): Promise<TransferRecordDto> {
    // 1. Fetch order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: {
        id: true,
        status: true,
        escrowStatus: true,
        sellerPayout: true,
        trackingCode: true,
        sellerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    // 2. Must be COMPLETED with RELEASED escrow
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).status !== 'COMPLETED') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Transfer only allowed for COMPLETED orders. Current: ${(order as any).status}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).escrowStatus !== 'RELEASED') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Escrow must be RELEASED before transfer. Current: ${(order as any).escrowStatus}`,
      );
    }

    // 3. Prevent duplicate transfer for same order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (this.prisma as any).transferRecord.findFirst({
      where: {
        orderId: dto.orderId,
        status: { in: ['PENDING', 'SUCCESS'] },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Transfer already ${existing.status.toLowerCase()} for order ${dto.orderId}`,
      );
    }

    // 4. Get or create Paystack transfer recipient for the seller
    const recipient = await this.getOrCreateRecipient(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (order as any).sellerId,
    );

    // 5. Amount in kobo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amountNgn = parseFloat(String((order as any).sellerPayout));
    const amountKobo = Math.round(amountNgn * 100);

    const reference = `EW-TRF-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

    // 6. Initiate Paystack transfer
    const transferData = await this.paystack.initiateTransfer({
      amount: amountKobo,
      recipient: recipient.recipientCode,
      reference,
      reason:
        dto.reason ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Payout for order ${(order as any).trackingCode}`,
    });

    // 7. Save TransferRecord
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (this.prisma as any).transferRecord.create({
      data: {
        orderId: dto.orderId,
        recipientId: recipient.id,
        reference,
        transferCode: transferData.transfer_code,
        amount: amountNgn,
        currency: 'NGN',
        status: transferData.status === 'success' ? 'SUCCESS' : 'PENDING',
        reason: dto.reason,
        paystackData: transferData as unknown as Record<string, unknown>,
        completedAt: transferData.status === 'success' ? new Date() : null,
      },
    });

    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `Transfer initiated | order: ${(order as any).trackingCode} | ref: ${reference} | ₦${amountNgn.toLocaleString()} | status: ${transferData.status}`,
    );

    return this.formatRecord(record);
  }

  // ── Get or create Paystack recipient ─────────────────────────────
  async getOrCreateRecipient(
    userId: string,
  ): Promise<TransferRecipientDto & { id: string; recipientCode: string }> {
    // Check cache first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = await (this.prisma as any).transferRecipient.findUnique({
      where: { userId },
    });

    if (cached) return cached;

    // Load seller bank details
    const seller = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankCode: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!seller) {
      throw new NotFoundException(`Seller ${userId} not found`);
    }

    if (!seller.bankAccountNumber || !seller.bankCode) {
      throw new BadRequestException(
        'Seller has not added bank account details. ' +
          'Please update profile with bankAccountNumber and bankCode before transfer.',
      );
    }

    const accountName = seller.bankAccountName ?? `${seller.firstName} ${seller.lastName}`;

    // Create recipient on Paystack
    const paystackRecipient = await this.paystack.createTransferRecipient({
      accountName,
      accountNumber: seller.bankAccountNumber,
      bankCode: seller.bankCode,
    });

    // Cache locally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipient = await (this.prisma as any).transferRecipient.create({
      data: {
        userId,
        recipientCode: paystackRecipient.recipient_code,
        accountName,
        accountNumber: seller.bankAccountNumber,
        bankCode: seller.bankCode,
        bankName: paystackRecipient.details?.bank_name ?? seller.bankCode,
        currency: 'NGN',
        paystackData: paystackRecipient as unknown as Record<string, unknown>,
      },
    });

    this.logger.log(
      `Transfer recipient created for seller [${userId}]: ${paystackRecipient.recipient_code}`,
    );

    return recipient;
  }

  // ── Get transfer records for order ───────────────────────────────
  async getByOrder(orderId: string): Promise<TransferRecordDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = await (this.prisma as any).transferRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return records.map((r: any) => this.formatRecord(r));
  }

  // ── Handle transfer.success webhook ──────────────────────────────
  async handleTransferSuccess(reference: string, paystackData: unknown): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (this.prisma as any).transferRecord.findUnique({
      where: { reference },
      include: { order: { select: { sellerId: true, trackingCode: true } } },
    });

    if (!record) {
      this.logger.warn(`transfer.success: no record found for ref ${reference}`);
      return;
    }

    if (record.status === 'SUCCESS') {
      this.logger.log(`transfer.success already processed for ref: ${reference}`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma as any).transferRecord.update({
      where: { reference },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        paystackData: paystackData as Record<string, unknown>,
      },
    });

    // Notify seller
    if (record.order?.sellerId) {
      const amountNgn = parseFloat(String(record.amount));
      await this.prisma.notification.create({
        data: {
          userId: record.order.sellerId,
          orderId: record.orderId,
          type: 'ESCROW_RELEASED',
          channel: 'IN_APP',
          title: 'Payment sent to your account',
          body: `₦${amountNgn.toLocaleString()} has been transferred to your bank account for order ${record.order.trackingCode}.`,
          isRead: false,
        },
      });
    }

    this.logger.log(`Transfer SUCCESS | ref: ${reference}`);
  }

  // ── Handle transfer.failed webhook ───────────────────────────────
  async handleTransferFailed(
    reference: string,
    reason: string,
    paystackData: unknown,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (this.prisma as any).transferRecord.findUnique({
      where: { reference },
      include: { order: { select: { sellerId: true, trackingCode: true } } },
    });

    if (!record) {
      this.logger.warn(`transfer.failed: no record found for ref ${reference}`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma as any).transferRecord.update({
      where: { reference },
      data: {
        status: 'FAILED',
        failureReason: reason,
        paystackData: paystackData as Record<string, unknown>,
      },
    });

    // Notify seller of failure
    if (record.order?.sellerId) {
      await this.prisma.notification.create({
        data: {
          userId: record.order.sellerId,
          orderId: record.orderId,
          type: 'PAYMENT_FAILED',
          channel: 'IN_APP',
          title: 'Transfer failed',
          body: `Transfer for order ${record.order.trackingCode} failed: ${reason}. Admin has been notified.`,
          isRead: false,
        },
      });
    }

    this.logger.error(`Transfer FAILED | ref: ${reference} | reason: ${reason}`);
  }

  // ── Helper ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatRecord(r: any): TransferRecordDto {
    return {
      id: r.id,
      orderId: r.orderId,
      reference: r.reference,
      transferCode: r.transferCode,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      reason: r.reason,
      failureReason: r.failureReason,
      initiatedAt: r.initiatedAt,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
    };
  }
}
