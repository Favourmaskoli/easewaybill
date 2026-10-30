import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { PaymentSettlementService } from './payment-settlement.service';

export interface ReconcileStats {
  checked: number;
  funded: number;
  needsReview: number;
  errors: number;
}

/**
 * Catches payments the webhook never delivered (or delivered but failed):
 *  1. PENDING attempts from the last 48h that may actually have been paid
 *  2. SUCCESS payments whose order is still unpaid or whose escrow was never funded
 */
@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settlement: PaymentSettlementService,
  ) {}

  async run(budgetMs = 8000): Promise<ReconcileStats> {
    const started = Date.now();
    const now = Date.now();
    const stats: ReconcileStats = { checked: 0, funded: 0, needsReview: 0, errors: 0 };

    const halfSettled = await this.prisma.paymentRecord.findMany({
      where: {
        status: 'SUCCESS',
        needsReview: false,
        order: {
          OR: [{ status: 'AWAITING_PAYMENT' }, { escrowStatus: 'PENDING' }],
        },
      },
      take: 25,
      select: { reference: true },
    });

    // Newest first: fresh attempts are the most likely to be real missed webhooks.
    const pending = await this.prisma.paymentRecord.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(now - 5 * 60_000),
          gt: new Date(now - 48 * 3_600_000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: { reference: true },
    });

    for (const { reference } of [...halfSettled, ...pending]) {
      // Stay inside the serverless function timeout; the next run continues.
      if (Date.now() - started > budgetMs) break;

      stats.checked++;

      try {
        const outcome = await this.settlement.settleCharge(reference, 'reconcile');
        if (outcome === 'FUNDED') stats.funded++;
        if (outcome === 'NEEDS_REVIEW') stats.needsReview++;
      } catch (e) {
        stats.errors++;
        this.logger.warn(`reconcile ${reference}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    this.logger.log(`Reconciliation done ${JSON.stringify(stats)}`);
    return stats;
  }
}