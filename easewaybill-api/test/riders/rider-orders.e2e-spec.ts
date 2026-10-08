/**
 * Session 14 — Rider panel scoping test (v2, matched to real controllers)
 *
 * Real routes confirmed from OrdersController / AuthController:
 *  - POST /auth/register  { email, firstName, lastName, password, phone? }
 *  - POST /auth/login     { email, password } -> AuthResponseDto (assumed to
 *    contain an access token — see ASSUMPTION 1 below, confirm field name)
 *  - GET  /orders                -> role-aware list, scoped server-side
 *    (SELLER sees own, BUYER sees purchased, RIDER sees assigned, ADMIN sees all)
 *  - PATCH /orders/:id/status    { status, note? } -> state-machine transition
 *      RIDER allowed: SHIPPED -> IN_TRANSIT (pickup), IN_TRANSIT -> DELIVERED (delivery)
 *
 * ASSUMPTIONS TO VERIFY:
 *  1. AuthResponseDto shape — assumed `{ accessToken, refreshToken, user }`.
 *     If your DTO uses a different field name (e.g. `token`, `access_token`),
 *     fix the `login()` helper below — this is the one thing most likely to
 *     need a one-line change.
 *  2. Rider creation — done via the real `POST /admin/users/create-rider`
 *     endpoint, using one bootstrap admin. There's no self-service way to
 *     become the first ADMIN (AdminController is fully role-gated), so
 *     `bootstrapAdmin()` is the one deliberate Prisma-direct step in this
 *     file — it registers a normal user then flips their role via Prisma,
 *     then re-logs-in to get a token carrying role: ADMIN. Everything
 *     downstream of that (rider creation, login) goes through real endpoints.
 *  3. GET /orders response shape — assumed `{ data: OrderResponseDto[], ... }`
 *     matching the PaginatedResult pattern seen in DisputesService. If your
 *     PaginatedResult uses a different key (e.g. `items`), update `listIds()`.
 *  4. Order creation for fixtures — bypassed via direct `prisma.order.create`
 *     rather than POST /orders + confirm + assign-rider, to keep this test
 *     focused on the rider-scoping question rather than the full order
 *     lifecycle (that's already covered by your E2E Pt.2/Pt.3 sessions).
 *     Adjust required fields below to match your actual Order model if
 *     Prisma complains about missing columns.
 *
 * What this covers:
 *  1. Rider A's GET /orders returns only orders where riderId === Rider A.
 *  2. Rider A can PATCH status SHIPPED -> IN_TRANSIT (pickup) on their own order.
 *  3. Rider A can PATCH status IN_TRANSIT -> DELIVERED (delivery) on their own order.
 *  4. Rider A gets 403 patching status on Rider B's assigned order.
 *  5. A plain USER (not seller/buyer/rider on the order) gets 403 patching
 *     its status at all.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Rider panel — order scoping (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testEmail = (label: string) => `e2e.${label}.${Date.now()}@example.test`;
  const strongPassword = 'TestPass123!'; // satisfies RegisterDto's Matches() rule

  async function registerAndLogin(label: string) {
    const email = testEmail(label);

    await request(app.getHttpServer()).post('/auth/register').send({
      email,
      firstName: 'E2E',
      lastName: label,
      password: strongPassword,
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: strongPassword })
      .expect(200);

    // Your app wraps every response in a global interceptor:
    // { success, data: { accessToken, refreshToken, user }, timestamp }
    const payload = loginRes.body.data ?? loginRes.body;
    const accessToken: string = payload.accessToken ?? payload.access_token;
    const userId: string = payload.user?.id ?? payload.userId;

    if (!accessToken || !userId) {
      throw new Error(
        'Could not extract accessToken/userId from login response — check AuthResponseDto shape: ' +
          JSON.stringify(loginRes.body),
      );
    }

    return { email, accessToken, userId };
  }

  // ASSUMPTION 2 (revised) — there's no self-service way to become the
  // first ADMIN (AdminController is fully @Roles(ADMIN)-gated), so this is
  // the one deliberate Prisma-direct step in this file: bootstrap a single
  // admin account to drive everything else through real endpoints below.
  async function bootstrapAdmin(): Promise<{ accessToken: string; userId: string; email: string }> {
    const admin = await registerAndLogin('bootstrap-admin');
    await prisma.user.update({
      where: { id: admin.userId },
      data: { role: 'ADMIN' as any },
    });
    // Role changed after the token was issued, so log in again to get a
    // fresh token carrying role: ADMIN (your JWT payload includes role,
    // per the decoded token seen earlier: {..., "role":"USER", ...}).
    const relogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: admin.email, password: strongPassword })
      .expect(200);
    const payload = relogin.body.data ?? relogin.body;
    return { accessToken: payload.accessToken, userId: admin.userId, email: admin.email };
  }

  // Creates a rider via the real admin endpoint (POST /admin/users/create-rider),
  // then logs in as that rider to get their own token.
  async function createRiderViaAdmin(adminToken: string, label: string) {
    const email = testEmail(label);

    const createRes = await request(app.getHttpServer())
      .post('/admin/users/create-rider')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email,
        firstName: 'E2E',
        lastName: label,
        password: strongPassword,
      })
      .expect((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error(`create-rider failed (${res.status}): ${JSON.stringify(res.body)}`);
        }
      });

    const created = createRes.body.data ?? createRes.body;
    const userId: string = created.id ?? created.user?.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: strongPassword })
      .expect(200);
    const payload = loginRes.body.data ?? loginRes.body;

    return { email, accessToken: payload.accessToken, userId: userId ?? payload.user?.id };
  }

  function listIds(body: any): string[] {
    // Unwraps the global { success, data, timestamp } response envelope
    // first (if present), then the PaginatedResult's own `data`/`items` key.
    const unwrapped = body.success !== undefined ? body.data : body;
    const list = unwrapped.data ?? unwrapped.items ?? unwrapped;
    return (list as any[]).map((o) => o.id);
  }

  let riderA: { email: string; accessToken: string; userId: string };
  let riderB: { email: string; accessToken: string; userId: string };
  let plainUser: { email: string; accessToken: string; userId: string };
  let seller: { email: string; accessToken: string; userId: string };
  let buyer: { email: string; accessToken: string; userId: string };
  let bootstrapAdminEmail: string;

  let orderAssignedToA_shipped: { id: string };
  let orderAssignedToA_inTransit: { id: string };
  let orderAssignedToB: { id: string };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Match your main.ts bootstrap — remove this if you don't globally
    // apply ValidationPipe there, or the DTOs above won't validate the same way.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    seller = await registerAndLogin('seller');
    buyer = await registerAndLogin('buyer');
    plainUser = await registerAndLogin('plainuser');

    const admin = await bootstrapAdmin();
    bootstrapAdminEmail = admin.email;
    riderA = await createRiderViaAdmin(admin.accessToken, 'riderA');
    riderB = await createRiderViaAdmin(admin.accessToken, 'riderB');

    // ASSUMPTION 4b — added after the first Prisma error surfaced
    // `description` as required. buyerEmail/deliveryFee/riderPayout are
    // guesses based on OrdersController's create() docblock ("matches by
    // buyerEmail", "calculates platform fee and rider payout from delivery
    // fee") — strip any of these if your schema actually defaults them.
    const baseOrderData = {
      sellerId: seller.userId,
      buyerId: buyer.userId,
      buyerEmail: buyer.email,
      totalAmount: 5000,
      sellerPayout: 4750,
      description: 'E2E test fixture order',
      deliveryFee: 500,
      riderPayout: 400,
    };

    orderAssignedToA_shipped = await prisma.order.create({
      data: {
        ...baseOrderData,
        trackingCode: `EW-E2E-A-SHIPPED-${Date.now()}`,
        riderId: riderA.userId,
        status: 'SHIPPED' as any,
      } as any,
    });

    orderAssignedToA_inTransit = await prisma.order.create({
      data: {
        ...baseOrderData,
        trackingCode: `EW-E2E-A-INTRANSIT-${Date.now()}`,
        riderId: riderA.userId,
        status: 'IN_TRANSIT' as any,
      } as any,
    });

    orderAssignedToB = await prisma.order.create({
      data: {
        ...baseOrderData,
        trackingCode: `EW-E2E-B-${Date.now()}`,
        riderId: riderB.userId,
        status: 'SHIPPED' as any,
      } as any,
    });
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: {
        id: {
          in: [orderAssignedToA_shipped.id, orderAssignedToA_inTransit.id, orderAssignedToB.id],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            seller.email,
            buyer.email,
            riderA.email,
            riderB.email,
            plainUser.email,
            bootstrapAdminEmail,
          ],
        },
      },
    });
    await app.close();
  });

  it("GET /orders returns only Rider A's assigned orders when Rider A is authenticated", async () => {
    const res = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${riderA.accessToken}`)
      .expect(200);

    const ids = listIds(res.body);

    expect(ids).toContain(orderAssignedToA_shipped.id);
    expect(ids).toContain(orderAssignedToA_inTransit.id);
    expect(ids).not.toContain(orderAssignedToB.id);
  });

  it('lets Rider A mark pickup (SHIPPED -> IN_TRANSIT) on their own order', async () => {
    await request(app.getHttpServer())
      .patch(`/orders/${orderAssignedToA_shipped.id}/status`)
      .set('Authorization', `Bearer ${riderA.accessToken}`)
      .send({ status: 'IN_TRANSIT', note: 'Picked up from seller' })
      .expect(200);

    const updated = await prisma.order.findUnique({
      where: { id: orderAssignedToA_shipped.id },
    });
    expect((updated as any).status).toBe('IN_TRANSIT');
  });

  it('lets Rider A mark delivery (IN_TRANSIT -> DELIVERED) on their own order', async () => {
    await request(app.getHttpServer())
      .patch(`/orders/${orderAssignedToA_inTransit.id}/status`)
      .set('Authorization', `Bearer ${riderA.accessToken}`)
      .send({ status: 'DELIVERED', note: 'Handed to buyer' })
      .expect(200);

    const updated = await prisma.order.findUnique({
      where: { id: orderAssignedToA_inTransit.id },
    });
    expect((updated as any).status).toBe('DELIVERED');
  });

  it("rejects Rider A trying to update status on Rider B's assigned order", async () => {
    await request(app.getHttpServer())
      .patch(`/orders/${orderAssignedToB.id}/status`)
      .set('Authorization', `Bearer ${riderA.accessToken}`)
      .send({ status: 'IN_TRANSIT' })
      .expect(403);
  });

  it('rejects a plain USER (not seller/buyer/rider on the order) from updating its status', async () => {
    await request(app.getHttpServer())
      .patch(`/orders/${orderAssignedToB.id}/status`)
      .set('Authorization', `Bearer ${plainUser.accessToken}`)
      .send({ status: 'IN_TRANSIT' })
      .expect(403);
  });
});
