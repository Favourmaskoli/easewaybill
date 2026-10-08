import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: PrismaClient;

  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    this.client = new PrismaClient({ adapter });
  }

  // ── Model accessors ──────────────────────────────────────────────
  get user() {
    return this.client.user;
  }
  get order() {
    return this.client.order;
  }
  get orderItem() {
    return this.client.orderItem;
  }
  get orderImage() {
    return this.client.orderImage;
  }
  get orderMessage() {
    return this.client.orderMessage;
  }
  get waybill() {
    return this.client.waybill;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get waybillEvent() {
    return (this.client as any).waybillEvent;
  }
  get escrowTransaction() {
    return this.client.escrowTransaction;
  }
  get escrowAuditLog() {
    return this.client.escrowAuditLog;
  }
  get notification() {
    return this.client.notification;
  }
  get dispute() {
    return this.client.dispute;
  }
  get paymentRecord() {
    return this.client.paymentRecord;
  }
  get transferRecord() {
    return this.client.transferRecord;
  }
  get transferRecipient() {
    return this.client.transferRecipient;
  }

  // ── Callback-style interactive transaction ───────────────────────
  async $transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;

  // ── Array transaction ────────────────────────────────────────────
  // Keeps each query's own type, so `const [rows, total] = await ...`
  // stays typed instead of collapsing to `unknown`.
  async $transaction<P extends Prisma.PrismaPromise<unknown>[]>(
    operations: [...P],
    options?: TransactionOptions,
  ): Promise<{ [K in keyof P]: Awaited<P[K]> }>;

  // ── Implementation ───────────────────────────────────────────────
  async $transaction(
    fnOrOps: ((tx: Prisma.TransactionClient) => Promise<unknown>) | Prisma.PrismaPromise<unknown>[],
    options?: TransactionOptions,
  ): Promise<unknown> {
    // Branch so each call matches one of Prisma's own overloads.
    if (typeof fnOrOps === 'function') {
      return this.client.$transaction(fnOrOps, options);
    }
    return this.client.$transaction(fnOrOps, options);
  }

  // ── Lifecycle ────────────────────────────────────────────────────
  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.client.$connect();
    this.logger.log('Database connected ✓');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  // ── Test utility ─────────────────────────────────────────────────
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase() cannot be called in production');
    }
    await this.client.$transaction([
      this.client.notification.deleteMany(),
      this.client.escrowTransaction.deleteMany(),
      this.client.waybill.deleteMany(),
      this.client.orderImage.deleteMany(),
      this.client.orderItem.deleteMany(),
      this.client.order.deleteMany(),
      this.client.user.deleteMany(),
    ]);
  }
}
