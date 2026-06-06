import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EscrowService } from './escrow.service';

import { describe, it, jest } from '@jest/globals';

import { expect } from '@jest/globals';

// ── Fixtures ──────────────────────────────────────────────────────

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-001',
  status: 'AWAITING_PAYMENT',
  escrowStatus: 'PENDING',
  totalAmount: '354500',
  sellerPayout: '336775',
  trackingCode: 'EW-TESTCODE',
  buyerId: 'buyer-001',
  sellerId: 'seller-001',
  ...overrides,
});

const makeHoldTx = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx-hold-001',
  orderId: 'order-001',
  type: 'ESCROW_HOLD',
  paymentStatus: 'SUCCESS',
  amount: '354500',
  currency: 'NGN',
  reference: 'PAY-REF-001',
  paystackRef: 'ps_test_001',
  paystackResponse: null,
  actorId: 'buyer-001',
  note: 'Buyer paid',
  processedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeReleaseTx = () => ({
  ...makeHoldTx(),
  id: 'tx-release-001',
  type: 'FULL_RELEASE',
  reference: 'REL-order-001-123',
  note: 'Released to seller',
});

const makeRefundTx = () => ({
  ...makeHoldTx(),
  id: 'tx-refund-001',
  type: 'REFUND',
  reference: 'REFUND-order-001-123',
  note: 'Buyer refunded',
});

// ── Mock factory ──────────────────────────────────────────────────

function buildMocks() {
  const txClient = {
    escrowTransaction: { create: jest.fn() },
    escrowAuditLog: { create: jest.fn() },
    order: { update: jest.fn() },
  };

  const prisma = {
    order: { findUnique: jest.fn() },
    escrowTransaction: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    escrowAuditLog: { findMany: jest.fn() },
    $transaction: jest
      .fn()
      .mockImplementation(async (fn: (tx: typeof txClient) => Promise<unknown>) => fn(txClient)),
  };

  const queue = {
    add: jest.fn().mockResolvedValue({ id: 'job-001' }),
    getJob: jest.fn().mockResolvedValue(null),
  };

  const service = new EscrowService(prisma as never, queue as never);

  return { service, prisma, queue, txClient };
}

// ── Tests ─────────────────────────────────────────────────────────

describe('EscrowService', () => {
  // ── holdFunds ────────────────────────────────────────────────────
  describe('holdFunds()', () => {
    const dto = {
      orderId: 'order-001',
      amount: 354500,
      reference: 'PAY-REF-001',
      paystackRef: 'ps_test_001',
    };

    it('creates hold transaction and moves order to PAID', async () => {
      const { service, prisma, txClient, queue } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(makeOrder());
      prisma.escrowTransaction.findFirst.mockResolvedValue(null);
      prisma.escrowTransaction.findUnique.mockResolvedValue(null);
      txClient.escrowTransaction.create.mockResolvedValue(makeHoldTx());

      const result = await service.holdFunds(dto);

      expect(result.type).toBe('ESCROW_HOLD');
      expect(result.paymentStatus).toBe('SUCCESS');
      expect(txClient.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PAID', escrowStatus: 'HOLDING' }),
        }),
      );
      expect(txClient.escrowAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'HOLD',
            fromStatus: 'PENDING',
            toStatus: 'HOLDING',
          }),
        }),
      );
      expect(queue.add).toHaveBeenCalledWith(
        'auto-release',
        { orderId: 'order-001' },
        expect.objectContaining({ delay: 172800000, jobId: 'auto-release-order-001' }),
      );
    });

    it('throws NotFoundException if order not found', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.holdFunds(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if order not AWAITING_PAYMENT', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(makeOrder({ status: 'PAID' }));
      await expect(service.holdFunds(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if active hold already exists', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(makeOrder());
      prisma.escrowTransaction.findFirst.mockResolvedValue(makeHoldTx());
      await expect(service.holdFunds(dto)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if reference is duplicate', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(makeOrder());
      prisma.escrowTransaction.findFirst.mockResolvedValue(null);
      prisma.escrowTransaction.findUnique.mockResolvedValue(makeHoldTx());
      await expect(service.holdFunds(dto)).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if amount does not match order total', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(makeOrder());
      prisma.escrowTransaction.findFirst.mockResolvedValue(null);
      prisma.escrowTransaction.findUnique.mockResolvedValue(null);
      await expect(service.holdFunds({ ...dto, amount: 999 })).rejects.toThrow(BadRequestException);
    });
  });

  // ── releaseFunds ─────────────────────────────────────────────────
  describe('releaseFunds()', () => {
    const dto = { orderId: 'order-001' };
    const deliveredOrder = makeOrder({ status: 'DELIVERED', escrowStatus: 'HOLDING' });

    it('creates release transactions and moves order to COMPLETED', async () => {
      const { service, prisma, txClient } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(deliveredOrder);
      prisma.escrowTransaction.findFirst.mockResolvedValue(makeHoldTx());
      txClient.escrowTransaction.create
        .mockResolvedValueOnce({ id: 'fee-tx' }) // platform fee
        .mockResolvedValueOnce(makeReleaseTx()); // full release

      const result = await service.releaseFunds(dto, 'buyer');

      expect(result.type).toBe('FULL_RELEASE');
      expect(txClient.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ escrowStatus: 'RELEASED', status: 'COMPLETED' }),
        }),
      );
      expect(txClient.escrowAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'RELEASE', toStatus: 'RELEASED' }),
        }),
      );
    });

    it('throws NotFoundException if order not found', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.releaseFunds(dto, 'buyer')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if order not DELIVERED or COMPLETED', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(makeOrder({ status: 'SHIPPED' }));
      await expect(service.releaseFunds(dto, 'buyer')).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException on double release', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: 'COMPLETED', escrowStatus: 'RELEASED' }),
      );
      await expect(service.releaseFunds(dto, 'buyer')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if escrow is REFUNDED', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: 'DELIVERED', escrowStatus: 'REFUNDED' }),
      );
      await expect(service.releaseFunds(dto, 'buyer')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if escrow is DISPUTED', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: 'DELIVERED', escrowStatus: 'DISPUTED' }),
      );
      await expect(service.releaseFunds(dto, 'buyer')).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException if no active hold', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(deliveredOrder);
      prisma.escrowTransaction.findFirst.mockResolvedValue(null);
      await expect(service.releaseFunds(dto, 'buyer')).rejects.toThrow(NotFoundException);
    });

    it('cancels auto-release job when buyer confirms manually', async () => {
      const { service, prisma, txClient, queue } = buildMocks();
      const mockJob = { remove: jest.fn() };
      queue.getJob.mockResolvedValue(mockJob);
      prisma.order.findUnique.mockResolvedValue(deliveredOrder);
      prisma.escrowTransaction.findFirst.mockResolvedValue(makeHoldTx());
      txClient.escrowTransaction.create
        .mockResolvedValueOnce({ id: 'fee-tx' })
        .mockResolvedValueOnce(makeReleaseTx());

      await service.releaseFunds(dto, 'buyer');

      expect(queue.getJob).toHaveBeenCalledWith('auto-release-order-001');
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('does NOT cancel job when triggered by auto-release', async () => {
      const { service, prisma, txClient, queue } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(deliveredOrder);
      prisma.escrowTransaction.findFirst.mockResolvedValue(makeHoldTx());
      txClient.escrowTransaction.create
        .mockResolvedValueOnce({ id: 'fee-tx' })
        .mockResolvedValueOnce(makeReleaseTx());

      await service.releaseFunds(dto, 'auto-release');

      expect(queue.getJob).not.toHaveBeenCalled();
    });
  });

  // ── refundFunds ──────────────────────────────────────────────────
  describe('refundFunds()', () => {
    const dto = { orderId: 'order-001', actorId: 'admin-001' };
    const disputedOrder = makeOrder({ status: 'DISPUTED', escrowStatus: 'DISPUTED' });

    it('creates refund transaction and moves order to REFUNDED', async () => {
      const { service, prisma, txClient } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(disputedOrder);
      prisma.escrowTransaction.findFirst.mockResolvedValue(makeHoldTx());
      txClient.escrowTransaction.create.mockResolvedValue(makeRefundTx());

      const result = await service.refundFunds(dto);

      expect(result.type).toBe('REFUND');
      expect(txClient.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ escrowStatus: 'REFUNDED', status: 'REFUNDED' }),
        }),
      );
      expect(txClient.escrowAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'REFUND',
            fromStatus: 'DISPUTED',
            toStatus: 'REFUNDED',
          }),
        }),
      );
    });

    it('throws NotFoundException if order not found', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.refundFunds(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if order not DISPUTED', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(makeOrder({ status: 'DELIVERED' }));
      await expect(service.refundFunds(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException on double refund', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: 'DISPUTED', escrowStatus: 'REFUNDED' }),
      );
      await expect(service.refundFunds(dto)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if escrow already released to seller', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: 'DISPUTED', escrowStatus: 'RELEASED' }),
      );
      await expect(service.refundFunds(dto)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException if no active hold exists', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findUnique.mockResolvedValue(disputedOrder);
      prisma.escrowTransaction.findFirst.mockResolvedValue(null);
      await expect(service.refundFunds(dto)).rejects.toThrow(NotFoundException);
    });

    it('cancels auto-release job on refund', async () => {
      const { service, prisma, txClient, queue } = buildMocks();
      const mockJob = { remove: jest.fn() };
      queue.getJob.mockResolvedValue(mockJob);
      prisma.order.findUnique.mockResolvedValue(disputedOrder);
      prisma.escrowTransaction.findFirst.mockResolvedValue(makeHoldTx());
      txClient.escrowTransaction.create.mockResolvedValue(makeRefundTx());

      await service.refundFunds(dto);

      expect(queue.getJob).toHaveBeenCalledWith('auto-release-order-001');
      expect(mockJob.remove).toHaveBeenCalled();
    });
  });
});
