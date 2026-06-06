import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

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
  get waybill() {
    return this.client.waybill;
  }
  get escrowTransaction() {
    return this.client.escrowTransaction;
  }
  get notification() {
    return this.client.notification;
  }
  get dispute() {
    return this.client.dispute;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get waybillEvent() {
    return (this.client as any).waybillEvent;
  }
  get paymentRecord() {
    return this.client.paymentRecord;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get transferRecord() {
    return (this.client as any).transferRecord;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get transferRecipient() {
    return (this.client as any).transferRecipient;
  }

  // ── Callback-style interactive transaction ───────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
  // ── Sequential operations array transaction ──────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async $transaction(operations: any[]): Promise<any[]>;
  // ── Implementation ───────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async $transaction<T>(fnOrOps: ((tx: any) => Promise<T>) | any[]): Promise<T | any[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.$transaction(fnOrOps as any);
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
      this.client.orderItem.deleteMany(),
      this.client.order.deleteMany(),
      this.client.user.deleteMany(),
    ]);
  }
}
