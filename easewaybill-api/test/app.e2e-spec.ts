import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_USER = {
  email: `e2e-test-${Date.now()}@easewaybill.com`,
  password: 'E2eTest@123456',
  firstName: 'E2E',
  lastName: 'Tester',
};

const SELLER = {
  email: `seller-${Date.now()}@easewaybill.com`,
  password: 'Seller@123456',
  firstName: 'Seller',
  lastName: 'User',
};

const BUYER = {
  email: `buyer-${Date.now()}@easewaybill.com`,
  password: 'Buyer@123456',
  firstName: 'Buyer',
  lastName: 'User',
};

const RIDER = {
  email: `rider-${Date.now()}@easewaybill.com`,
  password: 'Rider@123456',
  firstName: 'Rider',
  lastName: 'User',
};

describe('Auth Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

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
  });

  afterAll(async () => {
    await prisma.user
      .deleteMany({
        where: {
          email: {
            in: [
              TEST_USER.email,
              SELLER.email,
              BUYER.email,
              RIDER.email,
            ].filter(Boolean),
          },
        },
      })
      .catch(() => null);

    await app.close();
  });

  // ─────────────────────────────────────────────────────────────
  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(res.body.data).toMatchObject({
        status: 'ok',
        environment: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('POST /auth/register', () => {
    it('should register user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(TEST_USER)
        .expect(201);

      expect(res.body.success).toBe(true);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
      userId = res.body.data.user.id;
    });

    it('should return 409 if email exists', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(TEST_USER)
        .expect(409);
    });

    it('should validate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...TEST_USER, email: 'invalid' })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('should login user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject invalid login', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'wrong-password',
        })
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('Protected route', () => {
    it('should get current user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(userId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('Refresh token', () => {
    it('should refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token' })
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('Logout', () => {
    it('should logout user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('RBAC', () => {
    let sellerToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        });

      sellerToken = res.body.data.accessToken;
    });

    it('should block SELLER from admin route', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);
    });
  });
});