import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { HoldFundsDto } from './dto/hold-funds.dto';
import { ReleaseFundsDto } from './dto/release-funds.dto';
import { RefundFundsDto } from './dto/refund-funds.dto';
import { EscrowResponseDto } from './dto/escrow-response.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { EscrowSummaryDto } from './dto/escrow-summary.dto';
import { ESCROW_QUEUE, EscrowJobs } from './escrow.constants';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvents, EscrowEventPayload } from '../notifications/notifications.events';

const AUTO_RELEASE_DELAY_MS = 48 * 60 * 60 * 1000;

interface AuditEntry {
  orderId: string;
  actorId?: string | null;
  action: string;
  fromStatus: string;
  toStatus: string;
  amount: number;
  reference?: string;
  note?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(ESCROW_QUEUE) private readonly escrowQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── scheduleAutoRelease ──────────────────────────────────────────
  // Queue-only concern, no DB writes. Called by webhook.service.ts after
  // it creates the ESCROW_HOLD row itself, so the webhook doesn't have to
  // go through holdFunds() (which would reject because the order is
  // already PAID by that point). jobId is deterministic per order, so
  // calling this more than once for the same order (e.g. webhook retry)
  // just upserts the same delayed job instead of creating a duplicate.
  async scheduleAutoRelease(orderId: string): Promise<void> {
    await this.escrowQueue.add(
      EscrowJobs.AUTO_RELEASE,
      { orderId },
      {
        delay: AUTO_RELEASE_DELAY_MS,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        jobId: `auto-release-${orderId}`,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    );
    this.logger.log(`Auto-release scheduled for order [${orderId}] in 48h`);
  }

  // ── holdFunds ─────────────────────────────────────────────────────
  // NOTE: no longer called from the Paystack webhook — it now creates the
  // ESCROW_HOLD row directly inside its own transaction and calls
  // scheduleAutoRelease() above instead. This method remains for any other
  // direct/manual/admin callers that still need the full guarded flow
  // (including scheduling auto-release itself, via the shared helper).
  async holdFunds(dto: HoldFundsDto): Promise<EscrowResponseDto> {
    const order = await this.getOrderOrThrow(dto.orderId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Funds can only be held for AWAITING_PAYMENT orders. Current: ${(order as any).status}`,
      );
    }

    const existingHold = await this.prisma.escrowTransaction.findFirst({
      where: { orderId: dto.orderId, type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
    });
    if (existingHold) {
      throw new ConflictException(
        `Active escrow hold already exists for order ${dto.orderId}. Ref: ${existingHold.reference}`,
      );
    }

    const existingRef = await this.prisma.escrowTransaction.findUnique({
      where: { reference: dto.reference },
    });
    if (existingRef) {
      throw new ConflictException(`Payment reference ${dto.reference} has already been processed`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderTotal = parseFloat(String((order as any).totalAmount));
    if (Math.abs(dto.amount - orderTotal) > 0.01) {
      throw new BadRequestException(
        `Amount mismatch: expected ₦${orderTotal.toLocaleString()}, received ₦${dto.amount.toLocaleString()}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.prisma.$transaction(async (tx: any) => {
      const transaction = await tx.escrowTransaction.create({
        data: {
          orderId: dto.orderId,
          type: 'ESCROW_HOLD',
          paymentStatus: 'SUCCESS',
          amount: dto.amount,
          currency: 'NGN',
          reference: dto.reference,
          paystackRef: dto.paystackRef,
          paystackResponse: dto.paystackResponse ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          actorId: (order as any).buyerId,
          note: dto.note ?? 'Buyer payment confirmed — funds held in escrow',
          processedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: { status: 'PAID', escrowStatus: 'HOLDING', paidAt: new Date() },
      });

      await this.writeAuditLog(tx, {
        orderId: dto.orderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actorId: (order as any).buyerId,
        action: 'HOLD',
        fromStatus: 'PENDING',
        toStatus: 'HOLDING',
        amount: dto.amount,
        reference: dto.reference,
        note: dto.note ?? 'Escrow funded via Paystack',
        metadata: { paystackRef: dto.paystackRef },
      });

      this.eventEmitter.emit(NotificationEvents.ORDER_PAID, {
        orderId: dto.orderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        trackingCode: (order as any).trackingCode,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sellerId: (order as any).sellerId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buyerId: (order as any).buyerId,
        amount: dto.amount,
        type: 'HOLD',
      } as EscrowEventPayload);

      return transaction;
    });

    await this.scheduleAutoRelease(dto.orderId);

    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `HOLD ₦${dto.amount.toLocaleString()} | order ${(order as any).trackingCode} | ref: ${dto.reference}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.format(result, (order as any).trackingCode);
  }

  // ── releaseFunds ──────────────────────────────────────────────────
  async releaseFunds(
    dto: ReleaseFundsDto,
    triggeredBy: 'buyer' | 'auto-release' = 'buyer',
  ): Promise<EscrowResponseDto> {
    const order = await this.getOrderOrThrow(dto.orderId);

    const releaseableStatuses = ['DELIVERED', 'COMPLETED'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!releaseableStatuses.includes((order as any).status)) {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Release only allowed on DELIVERED or COMPLETED orders. Current: ${(order as any).status}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).escrowStatus === 'RELEASED') {
      throw new ConflictException(`Escrow for order ${dto.orderId} has already been released`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (['REFUNDED', 'DISPUTED'].includes((order as any).escrowStatus)) {
      throw new ConflictException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Cannot release — escrow status is ${(order as any).escrowStatus}`,
      );
    }

    const activeHold = await this.prisma.escrowTransaction.findFirst({
      where: { orderId: dto.orderId, type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
    });
    if (!activeHold) {
      throw new NotFoundException(`No active escrow hold found for order ${dto.orderId}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerPayout = parseFloat(String((order as any).sellerPayout));
    const heldAmount = parseFloat(String(activeHold.amount));
    const platformFee = parseFloat((heldAmount - sellerPayout).toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackingCode = (order as any).trackingCode;
    const now = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.prisma.$transaction(async (tx: any) => {
      await tx.escrowTransaction.create({
        data: {
          orderId: dto.orderId,
          type: 'PLATFORM_FEE',
          paymentStatus: 'SUCCESS',
          amount: platformFee,
          currency: 'NGN',
          reference: `FEE-${dto.orderId}-${now}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          actorId: (order as any).sellerId,
          note: 'Platform commission (5%)',
          processedAt: new Date(),
        },
      });

      const releaseTransaction = await tx.escrowTransaction.create({
        data: {
          orderId: dto.orderId,
          type: 'FULL_RELEASE',
          paymentStatus: 'SUCCESS',
          amount: sellerPayout,
          currency: 'NGN',
          reference: `REL-${dto.orderId}-${now}`,
          actorId:
            triggeredBy === 'buyer'
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (order as any).buyerId
              : null,
          note:
            dto.note ??
            (triggeredBy === 'auto-release'
              ? 'Auto-released after 48h — no dispute raised'
              : 'Buyer confirmed satisfaction — funds released to seller'),
          processedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: {
          escrowStatus: 'RELEASED',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await this.writeAuditLog(tx, {
        orderId: dto.orderId,
        actorId:
          triggeredBy === 'buyer'
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (order as any).buyerId
            : null,
        action: triggeredBy === 'auto-release' ? 'AUTO_RELEASE' : 'RELEASE',
        fromStatus: 'HOLDING',
        toStatus: 'RELEASED',
        amount: sellerPayout,
        reference: `REL-${dto.orderId}-${now}`,
        note: releaseTransaction.note ?? undefined,
        metadata: { platformFee, triggeredBy },
      });
      this.eventEmitter.emit(NotificationEvents.ESCROW_RELEASED, {
        orderId: dto.orderId,
        trackingCode,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sellerId: (order as any).sellerId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buyerId: (order as any).buyerId,
        amount: sellerPayout,
        type: 'RELEASE',
      } as EscrowEventPayload);

      return releaseTransaction;
    });

    if (triggeredBy === 'buyer') {
      const job = await this.escrowQueue.getJob(`auto-release-${dto.orderId}`);
      if (job) {
        await job.remove();
        this.logger.log(`Auto-release job cancelled for order [${dto.orderId}]`);
      }
    }

    this.logger.log(
      `RELEASE ₦${sellerPayout.toLocaleString()} | order ${trackingCode} | by: ${triggeredBy}`,
    );

    return this.format(result, trackingCode);
  }

  // ── refundFunds ───────────────────────────────────────────────────
  async refundFunds(dto: RefundFundsDto): Promise<EscrowResponseDto> {
    const order = await this.getOrderOrThrow(dto.orderId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).status !== 'DISPUTED') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Refund only allowed on DISPUTED orders. Current: ${(order as any).status}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).escrowStatus === 'REFUNDED') {
      throw new ConflictException(`Escrow for order ${dto.orderId} has already been refunded`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).escrowStatus === 'RELEASED') {
      throw new ConflictException(
        `Cannot refund order ${dto.orderId} — escrow was already released to seller`,
      );
    }

    const activeHold = await this.prisma.escrowTransaction.findFirst({
      where: { orderId: dto.orderId, type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
    });
    if (!activeHold) {
      throw new NotFoundException(`No active escrow hold found for order ${dto.orderId}`);
    }

    const refundAmount = parseFloat(String(activeHold.amount));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackingCode = (order as any).trackingCode;
    const now = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.prisma.$transaction(async (tx: any) => {
      const refundTransaction = await tx.escrowTransaction.create({
        data: {
          orderId: dto.orderId,
          type: 'REFUND',
          paymentStatus: 'SUCCESS',
          amount: refundAmount,
          currency: 'NGN',
          reference: `REFUND-${dto.orderId}-${now}`,
          actorId: dto.actorId ?? null,
          note: dto.note ?? 'Dispute resolved in favour of buyer — full refund processed',
          processedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: {
          escrowStatus: 'REFUNDED',
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });

      await this.writeAuditLog(tx, {
        orderId: dto.orderId,
        actorId: dto.actorId ?? null,
        action: 'REFUND',
        fromStatus: 'DISPUTED',
        toStatus: 'REFUNDED',
        amount: refundAmount,
        reference: `REFUND-${dto.orderId}-${now}`,
        note: refundTransaction.note ?? undefined,
        metadata: { reason: 'dispute_resolved_buyer_wins' },
      });
      this.eventEmitter.emit(NotificationEvents.ESCROW_REFUNDED, {
        orderId: dto.orderId,
        trackingCode,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sellerId: (order as any).sellerId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buyerId: (order as any).buyerId,
        amount: refundAmount,
        type: 'REFUND',
      } as EscrowEventPayload);

      return refundTransaction;
    });

    const job = await this.escrowQueue.getJob(`auto-release-${dto.orderId}`);
    if (job) {
      await job.remove();
      this.logger.log(`Auto-release job cancelled (refund) for order [${dto.orderId}]`);
    }

    this.logger.log(
      `REFUND ₦${refundAmount.toLocaleString()} | order ${trackingCode} | actor: ${dto.actorId ?? 'system'}`,
    );

    return this.format(result, trackingCode);
  }

  // ── getStatus ─────────────────────────────────────────────────────
  async getStatus(orderId: string): Promise<{
    escrowStatus: string;
    orderStatus: string;
    trackingCode: string;
    transactions: EscrowResponseDto[];
    auditLog: AuditLogResponseDto[];
  }> {
    const order = await this.getOrderOrThrow(orderId);
    const [transactions, auditLog] = await Promise.all([
      this.getByOrder(orderId),
      this.getAuditLog(orderId),
    ]);

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      escrowStatus: (order as any).escrowStatus,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderStatus: (order as any).status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackingCode: (order as any).trackingCode,
      transactions,
      auditLog,
    };
  }

  // ── getSummary ────────────────────────────────────────────────────
  async getSummary(): Promise<EscrowSummaryDto> {
    const [held, released, refunded, fees, orderCounts] = await Promise.all([
      this.prisma.escrowTransaction.aggregate({
        where: { type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { type: 'FULL_RELEASE', paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { type: 'REFUND', paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { type: 'PLATFORM_FEE', paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.order.groupBy({
        by: ['escrowStatus'],
        _count: { id: true },
      }),
    ]);

    const statusCounts = orderCounts.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: Record<string, number>, row: any) => {
        acc[row.escrowStatus] = row._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalOrders: held._count.id,
      totalHeld: parseFloat(String(held._sum.amount ?? 0)),
      totalReleased: parseFloat(String(released._sum.amount ?? 0)),
      totalRefunded: parseFloat(String(refunded._sum.amount ?? 0)),
      totalPlatformFees: parseFloat(String(fees._sum.amount ?? 0)),
      ordersHolding: statusCounts['HOLDING'] ?? 0,
      ordersReleased: statusCounts['RELEASED'] ?? 0,
      ordersRefunded: statusCounts['REFUNDED'] ?? 0,
      ordersDisputed: statusCounts['DISPUTED'] ?? 0,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── getByOrder ────────────────────────────────────────────────────
  async getByOrder(orderId: string): Promise<EscrowResponseDto[]> {
    const order = await this.getOrderOrThrow(orderId);
    const transactions = await this.prisma.escrowTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return transactions.map((tx: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.format(tx, (order as any).trackingCode),
    );
  }

  // ── getActiveHold ─────────────────────────────────────────────────
  async getActiveHold(orderId: string): Promise<EscrowResponseDto | null> {
    const transaction = await this.prisma.escrowTransaction.findFirst({
      where: { orderId, type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
    });
    if (!transaction) return null;
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { trackingCode: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.format(transaction, (order as any)?.trackingCode ?? '');
  }

  // ── getAuditLog ───────────────────────────────────────────────────
  async getAuditLog(orderId: string): Promise<AuditLogResponseDto[]> {
    await this.getOrderOrThrow(orderId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await this.prisma.escrowAuditLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return logs.map((log: any) => ({
      id: log.id,
      orderId: log.orderId,
      actorId: log.actorId,
      action: log.action,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      amount: log.amount,
      reference: log.reference,
      note: log.note,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));
  }

  // ── Private helpers ───────────────────────────────────────────────
  private async getOrderOrThrow(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        escrowStatus: true,
        totalAmount: true,
        sellerPayout: true,
        trackingCode: true,
        buyerId: true,
        sellerId: true,
      },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    return order;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async writeAuditLog(tx: any, entry: AuditEntry): Promise<void> {
    await tx.escrowAuditLog.create({
      data: {
        orderId: entry.orderId,
        actorId: entry.actorId ?? null,
        action: entry.action,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        amount: entry.amount,
        reference: entry.reference ?? null,
        note: entry.note ?? null,
        metadata: entry.metadata ?? null,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private format(tx: any, trackingCode: string): EscrowResponseDto {
    return {
      id: tx.id,
      orderId: tx.orderId,
      trackingCode,
      type: tx.type,
      paymentStatus: tx.paymentStatus,
      amount: tx.amount,
      currency: tx.currency,
      reference: tx.reference,
      paystackRef: tx.paystackRef,
      actorId: tx.actorId,
      note: tx.note,
      processedAt: tx.processedAt,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    };
  }
}
