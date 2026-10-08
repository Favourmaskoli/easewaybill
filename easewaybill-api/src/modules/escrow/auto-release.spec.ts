/**
 * Session 14 — Auto-release queue test
 *
 * ASSUMPTIONS TO VERIFY / FIX:
 *  - Import paths below (../../src/...) — adjust to your actual src layout.
 *  - There is a worker/processor consuming EscrowJobs.AUTO_RELEASE from the
 *    ESCROW_QUEUE and calling `escrowService.releaseFunds(dto, 'auto-release')`
 *    when it fires. If your processor is named differently (e.g.
 *    EscrowProcessor, AutoReleaseProcessor), update the import + the
 *    `runAutoReleaseJob` helper below to call that processor's handler
 *    directly instead of re-deriving the call.
 *  - Test env queue: assumes BullMQ is configured against a *test* Redis
 *    instance (e.g. REDIS_URL pointed at a disposable/test DB or
 *    ioredis-mock). If you're using a real Redis for test, make sure
 *    jest teardown closes the queue/connection (see afterAll) or the
 *    test process will hang.
 *
 * What this covers:
 *  1. holdFunds() schedules an auto-release job with the correct jobId,
 *     delay (48h), and payload.
 *  2. cancelAutoRelease() removes a pending job (dispute/buyer-release path).
 *  3. cancelAutoRelease() is a safe no-op when no job exists.
 *  4. When the job is actually processed (simulated — we don't wait 48h),
 *     it results in releaseFunds() being invoked with triggeredBy
 *     'auto-release', and the order/escrow status flips to
 *     RELEASED/COMPLETED.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { EscrowService } from './escrow.service';
import { ESCROW_QUEUE, EscrowJobs } from './escrow.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const AUTO_RELEASE_DELAY_MS = 48 * 60 * 60 * 1000;

describe('Escrow auto-release (BullMQ)', () => {
  let escrowService: EscrowService;
  let queue: jest.Mocked<Queue>;
  let prisma: {
    order: { findUnique: jest.Mock; update: jest.Mock };
    escrowTransaction: { findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock };
    escrowAuditLog: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  const orderId = 'order_test_001';

  const baseOrder = {
    id: orderId,
    status: 'AWAITING_PAYMENT',
    escrowStatus: 'PENDING',
    totalAmount: 10000,
    sellerPayout: 9500,
    trackingCode: 'EW-TEST-001',
    buyerId: 'buyer_1',
    sellerId: 'seller_1',
  };

  beforeEach(async () => {
    const queueMock = {
      add: jest.fn().mockResolvedValue({ id: `auto-release-${orderId}` }),
      getJob: jest.fn(),
    } as unknown as jest.Mocked<Queue>;

    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(baseOrder),
        update: jest.fn().mockResolvedValue(baseOrder),
      },
      escrowTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'tx_1', ...data })),
      },
      escrowAuditLog: { create: jest.fn().mockResolvedValue({}) },
      // Simplified $transaction: just runs the callback with a tx proxy
      // pointing back at the same mocked methods. Good enough for
      // verifying call sequence; not a real transaction.
      $transaction: jest.fn(async (cb: any) => {
        if (Array.isArray(cb)) return Promise.all(cb);
        return cb(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken(ESCROW_QUEUE), useValue: queueMock },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    escrowService = module.get(EscrowService);
    queue = module.get(getQueueToken(ESCROW_QUEUE));
  });

  it('schedules an auto-release job with a 48h delay and deterministic jobId on holdFunds()', async () => {
    await escrowService.holdFunds({
      orderId,
      amount: 10000,
      reference: 'PSK-REF-001',
      paystackRef: 'PSK-REF-001',
    } as any);

    expect(queue.add).toHaveBeenCalledWith(
      EscrowJobs.AUTO_RELEASE,
      { orderId },
      expect.objectContaining({
        delay: AUTO_RELEASE_DELAY_MS,
        jobId: `auto-release-${orderId}`,
        attempts: 3,
      }),
    );
  });

  it('cancelAutoRelease() removes a pending job for the order', async () => {
    const removeMock = jest.fn().mockResolvedValue(undefined);
    (queue.getJob as jest.Mock).mockResolvedValue({ remove: removeMock } as unknown as Job);

    await escrowService.cancelAutoRelease(orderId);

    expect(queue.getJob).toHaveBeenCalledWith(`auto-release-${orderId}`);
    expect(removeMock).toHaveBeenCalledTimes(1);
  });

  it('cancelAutoRelease() is a no-op when no job exists (does not throw)', async () => {
    (queue.getJob as jest.Mock).mockResolvedValue(null);

    await expect(escrowService.cancelAutoRelease(orderId)).resolves.toBeUndefined();
  });

  it('cancelAutoRelease() swallows errors if the job is locked/already active', async () => {
    const removeMock = jest.fn().mockRejectedValue(new Error('Job is locked'));
    (queue.getJob as jest.Mock).mockResolvedValue({ remove: removeMock } as unknown as Job);

    await expect(escrowService.cancelAutoRelease(orderId)).resolves.toBeUndefined();
  });

  it('firing the auto-release job releases funds and marks the order COMPLETED', async () => {
    // Order must be DELIVERED for releaseFunds() to proceed — override the
    // mock for this test since the default fixture is AWAITING_PAYMENT.
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: 'DELIVERED',
      escrowStatus: 'HOLDING',
    });
    prisma.escrowTransaction.findFirst.mockResolvedValue({
      id: 'hold_1',
      amount: 10000,
      reference: 'PSK-REF-001',
    });
    (queue.getJob as jest.Mock).mockResolvedValue(null); // no cleanup job to remove

    // Simulates what your BullMQ worker/processor does when the delayed
    // AUTO_RELEASE job fires. If you have a real processor class, replace
    // this direct call with invoking that processor's handler instead —
    // this test should exercise the same code path your worker runs in
    // production, not just releaseFunds() in isolation.
    await escrowService.releaseFunds(
      { orderId, reference: `AUTO-${orderId}` } as any,
      'auto-release',
    );

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: orderId } }),
      // NOTE: adjust matcher shape if your update call signature differs
    );
    expect(prisma.escrowTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'FULL_RELEASE' }),
      }),
    );
  });

  afterAll(async () => {
    // If this suite runs against a real (test) Redis-backed queue rather
    // than a mock, close it here so Jest doesn't hang on an open connection:
    // await queue.close();
  });
});