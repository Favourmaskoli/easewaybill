import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { describe, it, beforeAll, afterAll } from '@jest/globals';

import { expect } from '@jest/globals';

const SELLER = {
  email: `escrow-seller-${Date.now()}@easewaybill.com`,
  password: 'Seller@123456',
  firstName: 'Escrow',
  lastName: 'Seller',
  role: 'SELLER',
};

const BUYER = {
  email: `escrow-buyer-${Date.now()}@easewaybill.com`,
  password: 'Buyer@123456',
  firstName: 'Escrow',
  lastName: 'Buyer',
  role: 'BUYER',
};

const RIDER = {
  email: `escrow-rider-${Date.now()}@easewaybill.com`,
  password: 'Rider@123456',
  firstName: 'Escrow',
  lastName: 'Rider',
  role: 'RIDER',
};

const ADMIN_CREDS = {
  email: 'admin@easewaybill.com',
  password: 'Admin@123456',
};

describe('Escrow Lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let sellerToken: string;
  let buyerToken: string;
  let riderToken: string;
  let adminToken: string;

  let sellerId: string;
  let buyerId: string;
  let riderId: string;

  // Shared order IDs across test suites
  let holdReleaseOrderId: string;
  let disputeRefundOrderId: string;

  // ── Setup ──────────────────────────────────────────────────────
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    await app.init();

    prisma = app.get(PrismaService);

    // Register users
    const [sRes, bRes, rRes] = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/auth/register').send(SELLER),
      request(app.getHttpServer()).post('/api/v1/auth/register').send(BUYER),
      request(app.getHttpServer()).post('/api/v1/auth/register').send(RIDER),
    ]);

    sellerToken = sRes.body.data.accessToken;
    buyerToken = bRes.body.data.accessToken;
    riderToken = rRes.body.data.accessToken;
    sellerId = sRes.body.data.user.id;
    buyerId = bRes.body.data.user.id;
    riderId = rRes.body.data.user.id;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_CREDS);
    adminToken = adminRes.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    // Clean up in dependency order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).escrowAuditLog
      .deleteMany({
        where: { orderId: { in: [holdReleaseOrderId, disputeRefundOrderId].filter(Boolean) } },
      })
      .catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).dispute
      .deleteMany({
        where: { orderId: { in: [holdReleaseOrderId, disputeRefundOrderId].filter(Boolean) } },
      })
      .catch(() => null);
    await prisma.escrowTransaction
      .deleteMany({
        where: { orderId: { in: [holdReleaseOrderId, disputeRefundOrderId].filter(Boolean) } },
      })
      .catch(() => null);
    await prisma.waybill.deleteMany({ where: { order: { sellerId } } }).catch(() => null);
    await prisma.orderItem.deleteMany({ where: { order: { sellerId } } }).catch(() => null);
    await prisma.order.deleteMany({ where: { sellerId } }).catch(() => null);
    await prisma.user
      .deleteMany({ where: { email: { in: [SELLER.email, BUYER.email, RIDER.email] } } })
      .catch(() => null);
    await app.close();
  }, 15000);

  // ── Helper: create and progress order to AWAITING_PAYMENT ─────
  async function createOrderAtAwaitingPayment(): Promise<{
    orderId: string;
    waybillNumber: string;
    totalAmount: number;
  }> {
    // 1. Create order
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        description: 'E2E escrow test item',
        pickupAddress: '12 Adeola Odeku Street, Victoria Island, Lagos',
        deliveryAddress: '45 Admiralty Way, Lekki Phase 1, Lagos',
        buyerEmail: BUYER.email,
        buyerName: 'Escrow Buyer',
        buyerPhone: '+2348099887766',
        itemPrice: 100000,
        deliveryFee: 5000,
        items: [{ name: 'Test Item', quantity: 1, unitPrice: 100000, weight: 1 }],
      });

    const orderId = createRes.body.data.id;
    const waybillNumber = createRes.body.data.waybills[0].waybillNumber;
    const totalAmount = 105000;

    // 2. Seller → PENDING_BUYER
    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PENDING_BUYER' });

    // 3. Buyer confirms → AWAITING_PAYMENT
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${buyerToken}`);

    return { orderId, waybillNumber, totalAmount };
  }

  // ── Helper: progress to DELIVERED ────────────────────────────
  async function progressToDelivered(orderId: string): Promise<void> {
    // Admin holds funds → PAID
    await request(app.getHttpServer())
      .post('/api/v1/escrow/hold')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        orderId,
        amount: 105000,
        reference: `PAY-E2E-${orderId}`,
        paystackRef: `ps_test_${orderId.slice(-8)}`,
      });

    // Seller → SHIPPED
    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'SHIPPED' });

    // Admin assigns rider
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/assign-rider`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ riderId });

    // Rider → IN_TRANSIT
    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ status: 'IN_TRANSIT' });

    // Rider → DELIVERED
    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ status: 'DELIVERED' });
  }

  // ── Suite 1: Hold → Release lifecycle ─────────────────────────
  describe('Hold → Release lifecycle', () => {
    beforeAll(async () => {
      const { orderId } = await createOrderAtAwaitingPayment();
      holdReleaseOrderId = orderId;
    }, 15000);

    it('POST /escrow/hold — locks funds and moves order to PAID', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/escrow/hold')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: holdReleaseOrderId,
          amount: 105000,
          reference: `PAY-HOLD-${holdReleaseOrderId}`,
          paystackRef: 'ps_test_holdrelease',
          note: 'E2E test payment',
        })
        .expect(201);

      expect(res.body.data.type).toBe('ESCROW_HOLD');
      expect(res.body.data.paymentStatus).toBe('SUCCESS');
      expect(res.body.data.orderId).toBe(holdReleaseOrderId);
    });

    it('GET /escrow/:orderId — shows HOLDING status after hold', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/escrow/${holdReleaseOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.escrowStatus).toBe('HOLDING');
      expect(res.body.data.orderStatus).toBe('PAID');
      expect(res.body.data.transactions).toHaveLength(1);
      expect(res.body.data.auditLog).toHaveLength(1);
      expect(res.body.data.auditLog[0].action).toBe('HOLD');
    });

    it('POST /escrow/hold again → 409 ConflictException', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/escrow/hold')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: holdReleaseOrderId,
          amount: 105000,
          reference: `PAY-DUP-${holdReleaseOrderId}`,
        })
        .expect(409);
    });

    it('progresses order to DELIVERED', async () => {
      await progressToDelivered(holdReleaseOrderId);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${holdReleaseOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.status).toBe('DELIVERED');
    });

    it('POST /escrow/release — releases funds and moves order to COMPLETED', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/escrow/release')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: holdReleaseOrderId,
          note: 'E2E buyer confirmed satisfaction',
        })
        .expect(201);

      expect(res.body.data.type).toBe('FULL_RELEASE');
      expect(res.body.data.paymentStatus).toBe('SUCCESS');
    });

    it('GET /escrow/:orderId — shows RELEASED status after release', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/escrow/${holdReleaseOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.escrowStatus).toBe('RELEASED');
      expect(res.body.data.orderStatus).toBe('COMPLETED');
      // ESCROW_HOLD + PLATFORM_FEE + FULL_RELEASE = 3
      expect(res.body.data.transactions).toHaveLength(3);
      expect(res.body.data.auditLog).toHaveLength(2);
      expect(res.body.data.auditLog[1].action).toBe('RELEASE');
    });

    it('POST /escrow/release again → 409 double release', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/escrow/release')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderId: holdReleaseOrderId })
        .expect(409);
    });
  });

  // ── Suite 2: Hold → Dispute → Refund lifecycle ────────────────
  describe('Hold → Dispute → Refund lifecycle', () => {
    beforeAll(async () => {
      const { orderId } = await createOrderAtAwaitingPayment();
      disputeRefundOrderId = orderId;
    }, 15000);

    it('holds funds for the dispute order', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/escrow/hold')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: disputeRefundOrderId,
          amount: 105000,
          reference: `PAY-DISP-${disputeRefundOrderId}`,
        })
        .expect(201);
    });

    it('progresses to DELIVERED then buyer raises dispute', async () => {
      await progressToDelivered(disputeRefundOrderId);

      // Buyer raises dispute
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${disputeRefundOrderId}/dispute`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          reason: 'ITEM_DAMAGED',
          description: 'The item arrived damaged with visible scratches and dents.',
        })
        .expect(201);

      expect(res.body.data.status).toBe('OPEN');
    });

    it('order status is DISPUTED after dispute raised', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${disputeRefundOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.status).toBe('DISPUTED');
      expect(res.body.data.escrowStatus).toBe('DISPUTED');
    });

    it('POST /escrow/release on DISPUTED order → 409', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/escrow/release')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderId: disputeRefundOrderId })
        .expect(409);
    });

    it('POST /escrow/refund — refunds buyer after dispute', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/escrow/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: disputeRefundOrderId,
          actorId: 'admin',
          note: 'E2E dispute resolved for buyer — item was damaged',
        })
        .expect(201);

      expect(res.body.data.type).toBe('REFUND');
      expect(res.body.data.paymentStatus).toBe('SUCCESS');
    });

    it('GET /escrow/:orderId — shows REFUNDED status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/escrow/${disputeRefundOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.escrowStatus).toBe('REFUNDED');
      expect(res.body.data.orderStatus).toBe('REFUNDED');
      expect(res.body.data.auditLog.at(-1).action).toBe('REFUND');
    });

    it('POST /escrow/refund again → 409 double refund', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/escrow/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderId: disputeRefundOrderId })
        .expect(409);
    });

    it('POST /escrow/release on REFUNDED order → 409', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/escrow/release')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderId: disputeRefundOrderId })
        .expect(409);
    });
  });

  // ── Suite 3: Summary endpoint ──────────────────────────────────
  describe('GET /escrow/summary', () => {
    it('returns aggregated escrow totals', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/escrow/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        totalOrders: expect.any(Number),
        totalHeld: expect.any(Number),
        totalReleased: expect.any(Number),
        totalRefunded: expect.any(Number),
        totalPlatformFees: expect.any(Number),
        ordersHolding: expect.any(Number),
        ordersReleased: expect.any(Number),
        ordersRefunded: expect.any(Number),
        generatedAt: expect.any(String),
      });

      // After our tests: at least 1 released and 1 refunded
      expect(res.body.data.totalReleased).toBeGreaterThan(0);
      expect(res.body.data.totalRefunded).toBeGreaterThan(0);
      expect(res.body.data.totalPlatformFees).toBeGreaterThan(0);
    });

    it('returns 403 for non-admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/escrow/summary')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/escrow/summary').expect(401);
    });
  });

  // ── Suite 4: Edge cases ────────────────────────────────────────
  describe('Edge cases', () => {
    it('GET /escrow/:orderId returns 404 for unknown order', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/escrow/nonexistent-order-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('POST /escrow/hold with wrong amount → 400', async () => {
      const { orderId } = await createOrderAtAwaitingPayment();

      await request(app.getHttpServer())
        .post('/api/v1/escrow/hold')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId,
          amount: 999,
          reference: `PAY-WRONG-${orderId}`,
        })
        .expect(400);
    });

    it('POST /escrow/hold on DRAFT order → 400', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          description: 'Draft order test',
          pickupAddress: '12 Adeola Odeku Street, Victoria Island, Lagos',
          deliveryAddress: '45 Admiralty Way, Lekki Phase 1, Lagos',
          buyerEmail: BUYER.email,
          itemPrice: 50000,
          deliveryFee: 2000,
          items: [{ name: 'Item', quantity: 1, unitPrice: 50000 }],
        });

      await request(app.getHttpServer())
        .post('/api/v1/escrow/hold')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: createRes.body.data.id,
          amount: 52000,
          reference: `PAY-DRAFT-${createRes.body.data.id}`,
        })
        .expect(400);
    });

    it('POST /escrow/refund on non-disputed order → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/escrow/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderId: holdReleaseOrderId })
        .expect(400);
    });
  });
});
