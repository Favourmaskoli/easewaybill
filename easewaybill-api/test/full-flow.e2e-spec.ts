// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import request from 'supertest';
// import { App } from 'supertest/types';
// import { AppModule } from '../src/app.module';
// import { PrismaService } from '../src/prisma/prisma.service';

// /**
//  * Full Order Flow E2E Test
//  *
//  * Tests the complete EaseWaybill lifecycle:
//  * Create → Confirm → Hold → Ship → Deliver → Complete → Transfer
//  *
//  * Run with: npm run test:e2e
//  */

// const SELLER = {
//   email: `flow-seller-${Date.now()}@easewaybill.com`,
//   password: 'Seller@123456',
//   firstName: 'Flow',
//   lastName: 'Seller',
//   role: 'SELLER',
// };

// const BUYER = {
//   email: `flow-buyer-${Date.now()}@easewaybill.com`,
//   password: 'Buyer@123456',
//   firstName: 'Flow',
//   lastName: 'Buyer',
//   role: 'BUYER',
// };

// const RIDER = {
//   email: `flow-rider-${Date.now()}@easewaybill.com`,
//   password: 'Rider@123456',
//   firstName: 'Flow',
//   lastName: 'Rider',
//   role: 'RIDER',
// };

// const ADMIN_CREDS = {
//   email: 'admin@easewaybill.com',
//   password: 'Admin@123456',
// };

// describe('Full Order Flow (e2e)', () => {
//   let app: INestApplication<App>;
//   let prisma: PrismaService;

//   let sellerToken: string;
//   let buyerToken: string;
//   let riderToken: string;
//   let adminToken: string;

//   let sellerId: string;
//   let buyerId: string;
//   let riderId: string;

//   // Shared across all tests
//   let orderId: string;
//   let trackingCode: string;
//   let waybillNumber: string;
//   let paymentReference: string;

//   // ── Setup ────────────────────────────────────────────────────────
//   beforeAll(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();
//     app.useGlobalPipes(
//       new ValidationPipe({
//         whitelist: true,
//         forbidNonWhitelisted: true,
//         transform: true,
//         transformOptions: { enableImplicitConversion: true },
//       }),
//     );
//     app.setGlobalPrefix('api/v1', { exclude: ['health'] });
//     await app.init();
//     prisma = app.get(PrismaService);

//     // Register all test users
//     const [sRes, bRes, rRes] = await Promise.all([
//       request(app.getHttpServer()).post('/api/v1/auth/register').send(SELLER),
//       request(app.getHttpServer()).post('/api/v1/auth/register').send(BUYER),
//       request(app.getHttpServer()).post('/api/v1/auth/register').send(RIDER),
//     ]);

//     sellerToken = sRes.body.data.accessToken;
//     buyerToken = bRes.body.data.accessToken;
//     riderToken = rRes.body.data.accessToken;
//     sellerId = sRes.body.data.user.id;
//     buyerId = bRes.body.data.user.id;
//     riderId = rRes.body.data.user.id;

//     const adminRes = await request(app.getHttpServer())
//       .post('/api/v1/auth/login')
//       .send(ADMIN_CREDS);
//     adminToken = adminRes.body.data.accessToken;

//     // Give seller bank details for transfer step
//     await request(app.getHttpServer())
//       .patch('/api/v1/users/me')
//       .set('Authorization', `Bearer ${sellerToken}`)
//       .send({
//         businessName: 'Flow Test Store',
//         bankAccountName: 'Flow Seller',
//         bankAccountNumber: '0123456789',
//         bankCode: '058',
//       });
//   }, 30000);

//   afterAll(async () => {
//     const orderIds = [orderId].filter(Boolean);

//     if (orderIds.length > 0) {
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       await (prisma as any).transferRecord
//         .deleteMany({ where: { orderId: { in: orderIds } } })
//         .catch(() => null);
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       await (prisma as any).escrowAuditLog
//         .deleteMany({ where: { orderId: { in: orderIds } } })
//         .catch(() => null);
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       await (prisma as any).dispute
//         .deleteMany({ where: { orderId: { in: orderIds } } })
//         .catch(() => null);
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       await (prisma as any).paymentRecord
//         .deleteMany({ where: { orderId: { in: orderIds } } })
//         .catch(() => null);
//       await prisma.escrowTransaction
//         .deleteMany({ where: { orderId: { in: orderIds } } })
//         .catch(() => null);
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       await (prisma as any).waybillEvent.deleteMany().catch(() => null);
//       await prisma.waybill.deleteMany({ where: { orderId: { in: orderIds } } }).catch(() => null);
//       await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }).catch(() => null);
//       await prisma.order.deleteMany({ where: { id: { in: orderIds } } }).catch(() => null);
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     await (prisma as any).transferRecipient
//       .deleteMany({ where: { userId: sellerId } })
//       .catch(() => null);

//     await prisma.user
//       .deleteMany({
//         where: {
//           email: { in: [SELLER.email, BUYER.email, RIDER.email] },
//         },
//       })
//       .catch(() => null);

//     await app.close();
//   }, 20000);

//   // ── STEP 1: Seller creates order ─────────────────────────────────
//   describe('Step 1 — Seller creates order', () => {
//     it('POST /orders — creates order with items and waybill', async () => {
//       const res = await request(app.getHttpServer())
//         .post('/api/v1/orders')
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .send({
//           description: 'Sony PlayStation 5 — brand new sealed',
//           pickupAddress: '12 Adeola Odeku Street, Victoria Island, Lagos',
//           deliveryAddress: '45 Admiralty Way, Lekki Phase 1, Lagos',
//           buyerEmail: BUYER.email,
//           buyerName: 'Flow Buyer',
//           buyerPhone: '+2348099887766',
//           itemPrice: 420000,
//           deliveryFee: 6000,
//           fragile: false,
//           items: [
//             {
//               name: 'PlayStation 5 Console',
//               quantity: 1,
//               unitPrice: 380000,
//               weight: 3.9,
//               description: 'Disc Edition, White',
//             },
//             {
//               name: 'DualSense Controller',
//               quantity: 2,
//               unitPrice: 20000,
//               weight: 0.3,
//             },
//           ],
//         })
//         .expect(201);

//       expect(res.body.success).toBe(true);
//       expect(res.body.data.status).toBe('DRAFT');
//       expect(res.body.data.escrowStatus).toBe('PENDING');
//       expect(res.body.data.sellerId).toBe(sellerId);
//       expect(res.body.data.items).toHaveLength(2);
//       expect(res.body.data.waybills).toHaveLength(1);
//       expect(res.body.data.trackingCode).toMatch(/^EW-/);
//       expect(res.body.data.waybills[0].waybillNumber).toMatch(/^WB-/);

//       // Verify financial calculations
//       expect(Number(res.body.data.totalAmount)).toBe(426000);
//       expect(Number(res.body.data.platformFee)).toBeCloseTo(21300, 0);
//       expect(Number(res.body.data.sellerPayout)).toBeCloseTo(404700, 0);

//       orderId = res.body.data.id;
//       trackingCode = res.body.data.trackingCode;
//       waybillNumber = res.body.data.waybills[0].waybillNumber;
//     });

//     it('GET /orders/:id — seller can view their order', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/orders/${orderId}`)
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .expect(200);

//       expect(res.body.data.id).toBe(orderId);
//       expect(res.body.data.seller.email).toBe(SELLER.email);
//       expect(res.body.data.buyer).toBeNull(); // not yet confirmed
//     });

//     it('GET /orders — order appears in seller list', async () => {
//       const res = await request(app.getHttpServer())
//         .get('/api/v1/orders?status=DRAFT')
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .expect(200);

//       expect(res.body.data.data.some((o: any) => o.id === orderId)).toBe(true);
//     });

//     it('GET /orders — buyer cannot see order yet (not linked)', async () => {
//       const res = await request(app.getHttpServer())
//         .get('/api/v1/orders')
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .expect(200);

//       expect(res.body.data.data.some((o: any) => o.id === orderId)).toBe(false);
//     });
//   });

//   // ── STEP 2: Seller sends to buyer ────────────────────────────────
//   describe('Step 2 — Seller sends order to buyer', () => {
//     it('PATCH /orders/:id/status — DRAFT → PENDING_BUYER', async () => {
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/orders/${orderId}/status`)
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .send({ status: 'PENDING_BUYER' })
//         .expect(200);

//       expect(res.body.data.status).toBe('PENDING_BUYER');
//       expect(res.body.data.sentToBuyerAt).not.toBeNull();
//     });

//     it('should reject invalid transition: PENDING_BUYER → SHIPPED', async () => {
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/orders/${orderId}/status`)
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .send({ status: 'SHIPPED' });

//       expect(res.status).toBe(400);
//       expect(res.body.message).toContain('PENDING_BUYER');
//     });

//     it('should reject wrong role: BUYER cannot move to SHIPPED', async () => {
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/orders/${orderId}/status`)
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .send({ status: 'SHIPPED' });

//       // Buyer is not linked yet → 404, or wrong role → 403/400
//       expect([400, 403, 404]).toContain(res.status);
//     });
//   });

//   // ── STEP 3: Buyer confirms order ─────────────────────────────────
//   describe('Step 3 — Buyer confirms order details', () => {
//     it('POST /orders/:id/confirm — links buyer and moves to AWAITING_PAYMENT', async () => {
//       const res = await request(app.getHttpServer())
//         .post(`/api/v1/orders/${orderId}/confirm`)
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .expect(201);

//       expect(res.body.data.status).toBe('AWAITING_PAYMENT');
//       expect(res.body.data.buyerId).toBe(buyerId);
//       expect(res.body.data.buyerConfirmedAt).not.toBeNull();
//     });

//     it('GET /orders — buyer can now see the order', async () => {
//       const res = await request(app.getHttpServer())
//         .get('/api/v1/orders')
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .expect(200);

//       expect(res.body.data.data.some((o: any) => o.id === orderId)).toBe(true);
//     });

//     it('POST /orders/:id/confirm again — should fail (not PENDING_BUYER)', async () => {
//       await request(app.getHttpServer())
//         .post(`/api/v1/orders/${orderId}/confirm`)
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .expect(400);
//     });
//   });

//   // ── STEP 4: Buyer initiates payment ─────────────────────────────
//   describe('Step 4 — Buyer initiates Paystack payment', () => {
//     it('POST /payments/initiate — returns authorizationUrl', async () => {
//       const res = await request(app.getHttpServer())
//         .post('/api/v1/payments/initiate')
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .send({
//           orderId,
//           callbackUrl: 'http://localhost:3001/payment/callback',
//         })
//         .expect(201);

//       expect(res.body.data).toMatchObject({
//         authorizationUrl: expect.any(String),
//         accessCode: expect.any(String),
//         reference: expect.stringMatching(/^EW-PAY-/),
//         orderId,
//         amount: 426000,
//         currency: 'NGN',
//       });

//       paymentReference = res.body.data.reference;
//     });

//     it('GET /payments/orders/:orderId — shows PENDING payment record', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/payments/orders/${orderId}`)
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .expect(200);

//       expect(res.body.data).toHaveLength(1);
//       expect(res.body.data[0].status).toBe('PENDING');
//       expect(res.body.data[0].reference).toBe(paymentReference);
//     });

//     it('POST /payments/initiate again — fails (order not AWAITING_PAYMENT after hold)', async () => {
//       // This test simulates a second initiation attempt.
//       // It should fail because either:
//       // a) A successful payment already exists, OR
//       // b) The order status changed after hold
//       // For now, we just verify the endpoint validates correctly.
//       // The actual hold happens via the escrow step below.
//     });

//     it('seller cannot initiate payment', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/payments/initiate')
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .send({ orderId })
//         .expect(403);
//     });
//   });

//   // ── STEP 5: Admin holds funds (simulates Paystack webhook) ───────
//   describe('Step 5 — Escrow hold (Paystack payment confirmed)', () => {
//     it('POST /escrow/hold — locks funds, moves order to PAID', async () => {
//       const res = await request(app.getHttpServer())
//         .post('/api/v1/escrow/hold')
//         .set('Authorization', `Bearer ${adminToken}`)
//         .send({
//           orderId,
//           amount: 426000,
//           reference: `ESCROW-${paymentReference}`,
//           paystackRef: paymentReference,
//           note: 'Payment confirmed via Paystack (test)',
//         })
//         .expect(201);

//       expect(res.body.data.type).toBe('ESCROW_HOLD');
//       expect(res.body.data.paymentStatus).toBe('SUCCESS');
//       expect(res.body.data.amount).toBe('426000');
//     });

//     it('GET /orders/:id — order is now PAID with HOLDING escrow', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/orders/${orderId}`)
//         .set('Authorization', `Bearer ${adminToken}`)
//         .expect(200);

//       expect(res.body.data.status).toBe('PAID');
//       expect(res.body.data.escrowStatus).toBe('HOLDING');
//       expect(res.body.data.paidAt).not.toBeNull();
//     });

//     it('POST /escrow/hold again — 409 duplicate hold', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/escrow/hold')
//         .set('Authorization', `Bearer ${adminToken}`)
//         .send({
//           orderId,
//           amount: 426000,
//           reference: `ESCROW-DUP-${Date.now()}`,
//         })
//         .expect(409);
//     });

//     it('GET /escrow/:orderId — shows HOLDING status with audit log', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/escrow/${orderId}`)
//         .set('Authorization', `Bearer ${adminToken}`)
//         .expect(200);

//       expect(res.body.data.escrowStatus).toBe('HOLDING');
//       expect(res.body.data.transactions).toHaveLength(1);
//       expect(res.body.data.auditLog).toHaveLength(1);
//       expect(res.body.data.auditLog[0].action).toBe('HOLD');
//     });
//   });

//   // ── STEP 6: Seller ships goods ───────────────────────────────────
//   describe('Step 6 — Seller ships goods', () => {
//     it('PATCH /orders/:id/status — PAID → SHIPPED', async () => {
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/orders/${orderId}/status`)
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .send({ status: 'SHIPPED' })
//         .expect(200);

//       expect(res.body.data.status).toBe('SHIPPED');
//       expect(res.body.data.shippedAt).not.toBeNull();
//     });

//     it('rider cannot move SHIPPED → DELIVERED directly (must go via IN_TRANSIT)', async () => {
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/orders/${orderId}/status`)
//         .set('Authorization', `Bearer ${riderToken}`)
//         .send({ status: 'DELIVERED' });

//       expect(res.status).toBe(400);
//     });
//   });

//   // ── STEP 7: Admin assigns rider ──────────────────────────────────
//   describe('Step 7 — Admin assigns rider', () => {
//     it('POST /orders/:id/assign-rider — links rider to order', async () => {
//       const res = await request(app.getHttpServer())
//         .post(`/api/v1/orders/${orderId}/assign-rider`)
//         .set('Authorization', `Bearer ${adminToken}`)
//         .send({ riderId })
//         .expect(201);

//       expect(res.body.data.riderId).toBe(riderId);
//     });

//     it('GET /orders/:id — rider can now see their order', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/orders/${orderId}`)
//         .set('Authorization', `Bearer ${riderToken}`)
//         .expect(200);

//       expect(res.body.data.rider.id).toBe(riderId);
//     });
//   });

//   // ── STEP 8: Rider picks up and delivers ──────────────────────────
//   describe('Step 8 — Rider picks up and delivers', () => {
//     it('PATCH /orders/:id/status — SHIPPED → IN_TRANSIT', async () => {
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/orders/${orderId}/status`)
//         .set('Authorization', `Bearer ${riderToken}`)
//         .send({ status: 'IN_TRANSIT' })
//         .expect(200);

//       expect(res.body.data.status).toBe('IN_TRANSIT');
//       expect(res.body.data.pickedUpAt).not.toBeNull();
//     });

//     it('POST /waybills/:waybillNumber/scan — rider scans at checkpoint', async () => {
//       const res = await request(app.getHttpServer())
//         .post(`/api/v1/waybills/${waybillNumber}/scan`)
//         .set('Authorization', `Bearer ${riderToken}`)
//         .send({
//           location: 'Lekki Toll Gate, Lagos',
//           lat: 6.4698,
//           lng: 3.5852,
//           note: 'Package collected — en route to buyer',
//         })
//         .expect(201);

//       expect(res.body.data.timeline.length).toBeGreaterThan(0);
//       const lastEvent = res.body.data.timeline[res.body.data.timeline.length - 1];
//       expect(lastEvent.location).toBe('Lekki Toll Gate, Lagos');
//     });

//     it('GET /waybills/:waybillNumber — public tracking shows IN_TRANSIT', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/waybills/${waybillNumber}`)
//         .expect(200);

//       expect(res.body.data.orderStatus).toBe('IN_TRANSIT');
//       expect(res.body.data.estimatedDelivery).not.toBeNull();
//       expect(res.body.data.timeline.length).toBeGreaterThan(0);
//     });

//     it('PATCH /orders/:id/status — IN_TRANSIT → DELIVERED', async () => {
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/orders/${orderId}/status`)
//         .set('Authorization', `Bearer ${riderToken}`)
//         .send({ status: 'DELIVERED' })
//         .expect(200);

//       expect(res.body.data.status).toBe('DELIVERED');
//       expect(res.body.data.deliveredAt).not.toBeNull();
//     });
//   });

//   // ── STEP 9: Buyer confirms satisfaction ─────────────────────────
//   describe('Step 9 — Buyer confirms satisfaction', () => {
//     it('PATCH /orders/:id/status — DELIVERED → COMPLETED', async () => {
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/orders/${orderId}/status`)
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .send({ status: 'COMPLETED' })
//         .expect(200);

//       expect(res.body.data.status).toBe('COMPLETED');
//       expect(res.body.data.completedAt).not.toBeNull();
//     });

//     it('GET /orders/:id — order is COMPLETED', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/orders/${orderId}`)
//         .set('Authorization', `Bearer ${adminToken}`)
//         .expect(200);

//       expect(res.body.data.status).toBe('COMPLETED');
//     });
//   });

//   // ── STEP 10: Admin releases escrow ───────────────────────────────
//   describe('Step 10 — Admin releases escrow to seller', () => {
//     it('POST /escrow/release — releases funds to seller', async () => {
//       const res = await request(app.getHttpServer())
//         .post('/api/v1/escrow/release')
//         .set('Authorization', `Bearer ${adminToken}`)
//         .send({
//           orderId,
//           note: 'Buyer confirmed satisfaction — releasing to seller',
//         })
//         .expect(201);

//       expect(res.body.data.type).toBe('FULL_RELEASE');
//       expect(res.body.data.paymentStatus).toBe('SUCCESS');
//     });
// //
//     it('GET /escrow/:orderId — escrow is RELEASED with full audit trail', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/escrow/${orderId}`)
//         .set('Authorization', `Bearer ${adminToken}`)
//         .expect(200);

//       expect(res.body.data.escrowStatus).toBe('RELEASED');
//       // ESCROW_HOLD + PLATFORM_FEE + FULL_RELEASE = 3
//       expect(res.body.data.transactions).toHaveLength(3);
//       expect(res.body.data.auditLog).toHaveLength(2);

//       const actions = res.body.data.auditLog.map((l: any) => l.action);
//       expect(actions).toContain('HOLD');
//       expect(actions).toContain('RELEASE');
//     });

//     it('POST /escrow/release again — 409 double release', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/escrow/release')
//         .set('Authorization', `Bearer ${adminToken}`)
//         .send({ orderId })
//         .expect(409);
//     });

//     it('GET /escrow/summary — totals include this release', async () => {
//       const res = await request(app.getHttpServer())
//         .get('/api/v1/escrow/summary')
//         .set('Authorization', `Bearer ${adminToken}`)
//         .expect(200);

//       expect(res.body.data.totalReleased).toBeGreaterThan(0);
//       expect(res.body.data.totalPlatformFees).toBeGreaterThan(0);
//     });
//   });

//   // ── STEP 11: Admin initiates bank transfer to seller ─────────────
//   describe('Step 11 — Admin initiates Paystack transfer to seller', () => {
//     it('POST /payments/transfer — initiates payout to seller bank', async () => {
//       const res = await request(app.getHttpServer())
//         .post('/api/v1/payments/transfer')
//         .set('Authorization', `Bearer ${adminToken}`)
//         .send({
//           orderId,
//           reason: `Payout for order ${trackingCode}`,
//         });

//       // May succeed or fail depending on Paystack test mode config
//       // Accept 201 (success) or 400 (Paystack API error in test mode)
//       expect([201, 400]).toContain(res.status);

//       if (res.status === 201) {
//         expect(res.body.data.reference).toMatch(/^EW-TRF-/);
//         expect(['PENDING', 'SUCCESS']).toContain(res.body.data.status);
//       }
//     });

//     it('POST /payments/transfer again — 409 duplicate', async () => {
//       // Only relevant if first transfer succeeded
//       const firstRes = await request(app.getHttpServer())
//         .get(`/api/v1/payments/orders/${orderId}/transfers`)
//         .set('Authorization', `Bearer ${adminToken}`);

//       if (
//         firstRes.body.data?.length > 0 &&
//         ['PENDING', 'SUCCESS'].includes(firstRes.body.data[0].status)
//       ) {
//         await request(app.getHttpServer())
//           .post('/api/v1/payments/transfer')
//           .set('Authorization', `Bearer ${adminToken}`)
//           .send({ orderId })
//           .expect(409);
//       }
//     });
//   });

//   // ── STEP 12: Final state verification ────────────────────────────
//   describe('Step 12 — Final state verification', () => {
//     it('public waybill tracking shows COMPLETED', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/waybills/${waybillNumber}`)
//         .expect(200);

//       expect(res.body.data.orderStatus).toBe('COMPLETED');
//       expect(res.body.data.estimatedDelivery).toBeNull();
//     });

//     it('GET /orders/:id — final order state is correct', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`/api/v1/orders/${orderId}`)
//         .set('Authorization', `Bearer ${adminToken}`)
//         .expect(200);

//       const order = res.body.data;
//       expect(order.status).toBe('COMPLETED');
//       expect(order.escrowStatus).toBe('RELEASED');
//       expect(order.paidAt).not.toBeNull();
//       expect(order.shippedAt).not.toBeNull();
//       expect(order.deliveredAt).not.toBeNull();
//       expect(order.completedAt).not.toBeNull();
//       expect(order.seller.id).toBe(sellerId);
//       expect(order.buyer.id).toBe(buyerId);
//       expect(order.rider.id).toBe(riderId);
//     });

//     it('GET /orders — seller sees COMPLETED order', async () => {
//       const res = await request(app.getHttpServer())
//         .get('/api/v1/orders?status=COMPLETED')
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .expect(200);

//       expect(res.body.data.data.some((o: any) => o.id === orderId)).toBe(true);
//     });

//     it('GET /admin/dashboard — admin dashboard is accessible', async () => {
//       const res = await request(app.getHttpServer())
//         .get('/api/v1/admin/dashboard')
//         .set('Authorization', `Bearer ${adminToken}`)
//         .expect(200);

//       expect(res.body.data.role).toBe('ADMIN');
//       expect(res.body.data.uptime).toBeGreaterThan(0);
//     });

//     it('non-party cannot access order', async () => {
//       // Register a stranger
//       const strangerRes = await request(app.getHttpServer())
//         .post('/api/v1/auth/register')
//         .send({
//           email: `stranger-${Date.now()}@easewaybill.com`,
//           password: 'Stranger@123456',
//           firstName: 'Strange',
//           lastName: 'User',
//           role: 'BUYER',
//         });

//       await request(app.getHttpServer())
//         .get(`/api/v1/orders/${orderId}`)
//         .set('Authorization', `Bearer ${strangerRes.body.data.accessToken}`)
//         .expect(404);

//       // Cleanup stranger
//       await prisma.user
//         .delete({
//           where: { id: strangerRes.body.data.user.id },
//         })
//         .catch(() => null);
//     });
//   });

//   // ── RBAC summary ─────────────────────────────────────────────────
//   describe('RBAC — role enforcement throughout flow', () => {
//     it('SELLER cannot access admin dashboard', async () => {
//       await request(app.getHttpServer())
//         .get('/api/v1/admin/dashboard')
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .expect(403);
//     });

//     it('BUYER cannot create orders', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/orders')
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .send({
//           description: 'Buyer trying to create',
//           pickupAddress: '12 Test Street Lagos',
//           deliveryAddress: '45 Test Road Lagos',
//           buyerEmail: BUYER.email,
//           itemPrice: 5000,
//           items: [{ name: 'Item', quantity: 1 }],
//         })
//         .expect(403);
//     });

//     it('RIDER cannot create orders', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/orders')
//         .set('Authorization', `Bearer ${riderToken}`)
//         .send({
//           description: 'Rider trying to create',
//           pickupAddress: '12 Test Street Lagos',
//           deliveryAddress: '45 Test Road Lagos',
//           buyerEmail: BUYER.email,
//           itemPrice: 5000,
//           items: [{ name: 'Item', quantity: 1 }],
//         })
//         .expect(403);
//     });

//     it('SELLER cannot hold escrow', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/escrow/hold')
//         .set('Authorization', `Bearer ${sellerToken}`)
//         .send({ orderId, amount: 426000, reference: 'test-ref' })
//         .expect(403);
//     });

//     it('BUYER cannot release escrow', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/escrow/release')
//         .set('Authorization', `Bearer ${buyerToken}`)
//         .send({ orderId })
//         .expect(403);
//     });

//     it('unauthenticated request is rejected', async () => {
//       await request(app.getHttpServer()).get(`/api/v1/orders/${orderId}`).expect(401);
//     });
//   });
// });
