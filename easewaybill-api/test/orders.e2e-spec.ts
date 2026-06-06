import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

import { describe, it, beforeAll, afterAll } from '@jest/globals';

import { expect } from '@jest/globals';

const SELLER = {
  email: `order-e2e-seller-${Date.now()}@easewaybill.com`,
  password: 'Seller@123456',
  firstName: 'Test',
  lastName: 'Seller',
  role: 'SELLER',
};

const BUYER = {
  email: `order-e2e-buyer-${Date.now()}@easewaybill.com`,
  password: 'Buyer@123456',
  firstName: 'Test',
  lastName: 'Buyer',
  role: 'BUYER',
};

const RIDER = {
  email: `order-e2e-rider-${Date.now()}@easewaybill.com`,
  password: 'Rider@123456',
  firstName: 'Test',
  lastName: 'Rider',
  role: 'RIDER',
};

const ADMIN_CREDS = {
  email: 'admin@easewaybill.com',
  password: 'Admin@123456',
};

describe('Orders & Waybill Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let sellerToken: string;
  let buyerToken: string;
  let riderToken: string;
  let adminToken: string;

  let sellerId: string;
  let buyerId: string;
  let riderId: string;

  let orderId: string;
  let waybillNumber: string;

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

    // Register test users
    const sellerRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send(SELLER);
    sellerToken = sellerRes.body.data.accessToken;
    sellerId = sellerRes.body.data.user.id;

    const buyerRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send(BUYER);
    buyerToken = buyerRes.body.data.accessToken;
    buyerId = buyerRes.body.data.user.id;

    const riderRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send(RIDER);
    riderToken = riderRes.body.data.accessToken;
    riderId = riderRes.body.data.user.id;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_CREDS);
    adminToken = adminRes.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    // Clean up test users and their orders
    await prisma.notification
      .deleteMany({ where: { user: { email: { in: [SELLER.email, BUYER.email, RIDER.email] } } } })
      .catch(() => null);
    await prisma.escrowTransaction.deleteMany().catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).waybillEvent.deleteMany().catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).dispute.deleteMany().catch(() => null);
    await prisma.waybill.deleteMany().catch(() => null);
    await prisma.orderItem.deleteMany().catch(() => null);
    await prisma.order.deleteMany({ where: { seller: { email: SELLER.email } } }).catch(() => null);
    await prisma.user
      .deleteMany({ where: { email: { in: [SELLER.email, BUYER.email, RIDER.email] } } })
      .catch(() => null);
    await app.close();
  }, 15000);

  // ── 1. Create Order ────────────────────────────────────────────
  describe('POST /api/v1/orders', () => {
    it('should create order with items and waybill', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          description: 'Integration test order',
          pickupAddress: '12 Adeola Odeku Street, Victoria Island, Lagos',
          deliveryAddress: '45 Admiralty Way, Lekki Phase 1, Lagos',
          buyerEmail: BUYER.email,
          buyerName: 'Test Buyer',
          buyerPhone: '+2348099887766',
          itemPrice: 50000,
          deliveryFee: 2000,
          items: [
            {
              name: 'Test Item',
              quantity: 1,
              unitPrice: 50000,
              weight: 0.5,
            },
          ],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.sellerId).toBe(sellerId);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.waybills).toHaveLength(1);
      expect(res.body.data.trackingCode).toMatch(/^EW-/);
      expect(res.body.data.waybills[0].waybillNumber).toMatch(/^WB-/);

      orderId = res.body.data.id;
      waybillNumber = res.body.data.waybills[0].waybillNumber;
    });

    it('should return 400 with missing items', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          description: 'Bad order',
          pickupAddress: '12 Test Street Lagos',
          deliveryAddress: '45 Test Road Lagos',
          buyerEmail: BUYER.email,
          itemPrice: 5000,
          items: [],
        })
        .expect(400);
    });

    it('should return 403 when BUYER tries to create order', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          description: 'Buyer order attempt',
          pickupAddress: '12 Test Street Lagos',
          deliveryAddress: '45 Test Road Lagos',
          buyerEmail: BUYER.email,
          itemPrice: 5000,
          items: [{ name: 'Item', quantity: 1 }],
        })
        .expect(403);
    });
  });

  // ── 2. Get Orders ──────────────────────────────────────────────
  describe('GET /api/v1/orders', () => {
    it('should return seller orders with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.meta).toHaveProperty('total');
      expect(res.body.data.meta).toHaveProperty('hasNextPage');
      expect(res.body.data.meta).toHaveProperty('nextCursor');
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders?status=DRAFT')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(res.body.data.data.every((o: any) => o.status === 'DRAFT')).toBe(true);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/orders').expect(401);
    });
  });

  // ── 3. Get Single Order ────────────────────────────────────────
  describe('GET /api/v1/orders/:id', () => {
    it('should return full order details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(orderId);
      expect(res.body.data.seller).toBeDefined();
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.waybills).toBeInstanceOf(Array);
    });

    it('should return 404 for wrong seller', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(404);
    });
  });

  // ── 4. State Machine ───────────────────────────────────────────
  describe('PATCH /api/v1/orders/:id/status — state machine', () => {
    it('SELLER: DRAFT → PENDING_BUYER', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'PENDING_BUYER' })
        .expect(200);

      expect(res.body.data.status).toBe('PENDING_BUYER');
    });

    it('should return 400 for invalid jump: PENDING_BUYER → COMPLETED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: 'COMPLETED' });

      expect([400, 404]).toContain(res.status);
    });

    it('BUYER: confirms order → AWAITING_PAYMENT', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(201);

      expect(res.body.data.status).toBe('AWAITING_PAYMENT');
      expect(res.body.data.buyerId).toBe(buyerId);
    });

    it('ADMIN: AWAITING_PAYMENT → PAID', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PAID' })
        .expect(200);

      expect(res.body.data.status).toBe('PAID');
      expect(res.body.data.escrowStatus).toBe('PENDING');
    });

    it('SELLER: PAID → SHIPPED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'SHIPPED' })
        .expect(200);

      expect(res.body.data.status).toBe('SHIPPED');
      expect(res.body.data.shippedAt).not.toBeNull();
    });

    it('ADMIN: assign rider', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/assign-rider`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ riderId })
        .expect(201);

      expect(res.body.data.riderId).toBe(riderId);
    });

    it('RIDER: SHIPPED → IN_TRANSIT', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'IN_TRANSIT' })
        .expect(200);

      expect(res.body.data.status).toBe('IN_TRANSIT');
      expect(res.body.data.pickedUpAt).not.toBeNull();
    });

    it('RIDER: IN_TRANSIT → DELIVERED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'DELIVERED' })
        .expect(200);

      expect(res.body.data.status).toBe('DELIVERED');
      expect(res.body.data.deliveredAt).not.toBeNull();
    });
  });

  // ── 5. Waybill Tracking ────────────────────────────────────────
  describe('Waybill tracking', () => {
    it('GET /waybills/:waybillNumber — public, no auth', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/waybills/${waybillNumber}`)
        .expect(200);

      expect(res.body.data.waybillNumber).toBe(waybillNumber);
      expect(res.body.data.orderStatus).toBe('DELIVERED');
      expect(res.body.data.timeline).toBeInstanceOf(Array);
      expect(res.body.data.estimatedDelivery).toBeNull();
    });

    it('POST /waybills/:waybillNumber/scan — rider scans', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/waybills/${waybillNumber}/scan`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          location: 'Lekki Toll Gate, Lagos',
          lat: 6.4698,
          lng: 3.5852,
          note: 'Package delivered successfully',
        })
        .expect(201);

      expect(res.body.data.timeline.length).toBeGreaterThan(0);
      const lastEvent = res.body.data.timeline[res.body.data.timeline.length - 1];
      expect(lastEvent.location).toBe('Lekki Toll Gate, Lagos');
    });

    it('should return 404 for unknown waybill number', async () => {
      await request(app.getHttpServer()).get('/api/v1/waybills/WB-UNKNOWN99').expect(404);
    });
  });

  // ── 6. Dispute Flow ────────────────────────────────────────────
  describe('Dispute flow', () => {
    it('POST /orders/:id/dispute — buyer raises dispute', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/dispute`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          reason: 'ITEM_DAMAGED',
          description: 'The laptop arrived with a cracked screen and visible dents on the chassis.',
          evidence: [],
        })
        .expect(201);

      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.reason).toBe('ITEM_DAMAGED');
      expect(res.body.data.orderId).toBe(orderId);
    });

    it('should return 400 when raising duplicate dispute', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/dispute`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          reason: 'ITEM_DAMAGED',
          description: 'Duplicate dispute attempt on same order.',
        })
        .expect(400);
    });

    it('GET /orders/:id/dispute — view dispute', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}/dispute`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.reason).toBe('ITEM_DAMAGED');
    });

    it('PATCH /orders/:id/dispute — admin resolves for buyer', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/dispute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolution: 'RESOLVED_FOR_BUYER',
          resolutionNote: 'Evidence confirms item was damaged in transit. Full refund approved.',
        })
        .expect(200);

      expect(res.body.data.status).toBe('RESOLVED_FOR_BUYER');
      expect(res.body.data.resolvedAt).not.toBeNull();
      expect(res.body.data.resolutionNote).toContain('refund approved');
    });

    it('order status should be REFUNDED after buyer wins dispute', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('REFUNDED');
      expect(res.body.data.escrowStatus).toBe('REFUNDED');
    });

    it('should return 403 when SELLER tries to resolve', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/dispute`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          resolution: 'RESOLVED_FOR_SELLER',
          resolutionNote: 'Seller trying to self-resolve.',
        })
        .expect(403);
    });

    it('GET /disputes — admin lists all disputes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/disputes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
