import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 10;

// ── Helpers ──────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function nanoid8(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Seed ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean all tables
  await prisma.notification.deleteMany();
  await prisma.escrowTransaction.deleteMany();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).waybillEvent.deleteMany().catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).dispute.deleteMany().catch(() => null);
  await prisma.waybill.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing data\n');

  // ── Users ─────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@easewaybill.com',
      passwordHash: await bcrypt.hash('Admin@123456', BCRYPT_ROUNDS),
      firstName: 'Super', lastName: 'Admin',
      phone: '+2348000000001',
      role: 'ADMIN', isEmailVerified: true, accountStatus: 'ACTIVE',
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: 'seller@easewaybill.com',
      passwordHash: await bcrypt.hash('Seller@123456', BCRYPT_ROUNDS),
      firstName: 'Chidi', lastName: 'Okonkwo',
      phone: '+2348012345678',
      role: 'USER', isEmailVerified: true, accountStatus: "ACTIVE",
      businessName: 'Chidi Electronics',
      bankAccountName: 'Chidi Okonkwo',
      bankAccountNumber: '0123456789',
      bankCode: '058',
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'seller2@easewaybill.com',
      passwordHash: await bcrypt.hash('Seller@123456', BCRYPT_ROUNDS),
      firstName: 'Ngozi', lastName: 'Adeyemi',
      phone: '+2348033445566',
      role: 'USER', isEmailVerified: true, accountStatus: 'ACTIVE',
      businessName: 'Ngozi Fashion House',
      bankAccountName: 'Ngozi Adeyemi',
      bankAccountNumber: '9876543210',
      bankCode: '011',
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@easewaybill.com',
      passwordHash: await bcrypt.hash('Buyer@123456', BCRYPT_ROUNDS),
      firstName: 'Amaka', lastName: 'Nwosu',
      phone: '+2348099887766',
      role: 'USER', isEmailVerified: true, accountStatus: 'ACTIVE',
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      email: 'buyer2@easewaybill.com',
      passwordHash: await bcrypt.hash('Buyer@123456', BCRYPT_ROUNDS),
      firstName: 'Tunde', lastName: 'Bakare',
      phone: '+2348077665544',
      role: 'USER', isEmailVerified: true, accountStatus: 'ACTIVE',
    },
  });

  const rider = await prisma.user.create({
    data: {
      email: 'rider@easewaybill.com',
      passwordHash: await bcrypt.hash('Rider@123456', BCRYPT_ROUNDS),
      firstName: 'Emeka', lastName: 'Eze',
      phone: '+2348087654321',
      role: 'USER', isEmailVerified: true, accountStatus: 'ACTIVE',
      isAvailable: true, vehicleType: 'Motorcycle', vehiclePlate: 'LAG-234-AB',
    },
  });

  console.log('✅ Users created: admin, seller x2, buyer x2, rider\n');

  // ── Order factory ──────────────────────────────────────────────────
  async function createOrder(opts: {
    trackingCode: string;
    status: string;
    escrowStatus: string;
    sellerId: string;
    buyerId?: string;
    riderId?: string;
    buyerEmail: string;
    buyerName: string;
    buyerPhone: string;
    description: string;
    itemPrice: number;
    deliveryFee: number;
    items: Array<{ name: string; quantity: number; unitPrice: number; weight?: number }>;
    timestamps?: Record<string, Date>;
    waybillStatus?: string;
  }) {
    const totalAmount = opts.itemPrice + opts.deliveryFee;
    const platformFee = parseFloat((totalAmount * 0.05).toFixed(2));
    const sellerPayout = parseFloat((totalAmount - platformFee).toFixed(2));
    const riderPayout = parseFloat((opts.deliveryFee * 0.9).toFixed(2));
    const waybillNumber = `WB-${nanoid8()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma as any).$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          trackingCode: opts.trackingCode,
          status: opts.status,
          escrowStatus: opts.escrowStatus,
          description: opts.description,
          pickupAddress: '12 Adeola Odeku Street, Victoria Island, Lagos',
          pickupLat: 6.4281, pickupLng: 3.4219,
          deliveryAddress: '45 Admiralty Way, Lekki Phase 1, Lagos',
          deliveryLat: 6.4474, deliveryLng: 3.5105,
          buyerEmail: opts.buyerEmail,
          buyerName: opts.buyerName,
          buyerPhone: opts.buyerPhone,
          itemPrice: opts.itemPrice,
          deliveryFee: opts.deliveryFee,
          totalAmount,
          platformFee,
          sellerPayout,
          riderPayout,
          sellerId: opts.sellerId,
          buyerId: opts.buyerId,
          riderId: opts.riderId,
          ...opts.timestamps,
        },
      });

      await tx.orderItem.createMany({
        data: opts.items.map(item => ({
          orderId: order.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          weight: item.weight ?? null,
        })),
      });

      await tx.waybill.create({
        data: {
          waybillNumber,
          orderId: order.id,
          status: opts.waybillStatus ?? 'GENERATED',
          sellerName: 'Chidi Okonkwo',
          sellerPhone: '+2348012345678',
          sellerAddress: '12 Adeola Odeku Street, Victoria Island, Lagos',
          buyerName: opts.buyerName,
          buyerPhone: opts.buyerPhone,
          buyerAddress: '45 Admiralty Way, Lekki Phase 1, Lagos',
          description: opts.description,
          declaredValue: opts.itemPrice,
          fragile: false,
        },
      });

      return order;
    });
  }

  // ── 10 Orders across all statuses ─────────────────────────────────

  // 1. DRAFT — seller just created
  const o1 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'DRAFT', escrowStatus: 'PENDING',
    sellerId: seller.id,
    buyerEmail: buyer.email, buyerName: 'Amaka Nwosu', buyerPhone: buyer.phone!,
    description: 'iPhone 15 Pro — brand new sealed',
    itemPrice: 850000, deliveryFee: 5000,
    items: [{ name: 'iPhone 15 Pro', quantity: 1, unitPrice: 850000, weight: 0.5 }],
    timestamps: { createdAt: daysAgo(1) },
  });

  // 2. PENDING_BUYER — sent to buyer, awaiting confirmation
  const o2 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'PENDING_BUYER', escrowStatus: 'PENDING',
    sellerId: seller.id,
    buyerEmail: buyer2.email, buyerName: 'Tunde Bakare', buyerPhone: buyer2.phone!,
    description: 'Nike Air Max — Size 42',
    itemPrice: 45000, deliveryFee: 2000,
    items: [{ name: 'Nike Air Max 270', quantity: 1, unitPrice: 45000, weight: 1.2 }],
    timestamps: { createdAt: daysAgo(2), sentToBuyerAt: daysAgo(2) },
  });

  // 3. AWAITING_PAYMENT — buyer confirmed, pending payment
  const o3 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'AWAITING_PAYMENT', escrowStatus: 'PENDING',
    sellerId: seller2.id, buyerId: buyer.id,
    buyerEmail: buyer.email, buyerName: 'Amaka Nwosu', buyerPhone: buyer.phone!,
    description: 'Ankara fabric — 12 yards mixed prints',
    itemPrice: 28000, deliveryFee: 1500,
    items: [{ name: 'Ankara Fabric 12 yards', quantity: 1, unitPrice: 28000 }],
    timestamps: { createdAt: daysAgo(3), sentToBuyerAt: daysAgo(3), buyerConfirmedAt: daysAgo(2) },
  });

  // 4. PAID — escrow funded, seller to ship
  const o4 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'PAID', escrowStatus: 'HOLDING',
    sellerId: seller.id, buyerId: buyer2.id,
    buyerEmail: buyer2.email, buyerName: 'Tunde Bakare', buyerPhone: buyer2.phone!,
    description: 'MacBook Pro 14" M3 — Space Grey',
    itemPrice: 1200000, deliveryFee: 8000,
    items: [{ name: 'MacBook Pro 14"', quantity: 1, unitPrice: 1200000, weight: 1.6 }],
    timestamps: {
      createdAt: daysAgo(5), sentToBuyerAt: daysAgo(5),
      buyerConfirmedAt: daysAgo(4), paidAt: daysAgo(3),
    },
  });

  // 5. SHIPPED — seller shipped, rider not yet assigned
  const o5 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'SHIPPED', escrowStatus: 'HOLDING',
    sellerId: seller2.id, buyerId: buyer2.id,
    buyerEmail: buyer2.email, buyerName: 'Tunde Bakare', buyerPhone: buyer2.phone!,
    description: 'Custom agbada — cream and gold embroidery',
    itemPrice: 75000, deliveryFee: 3000,
    items: [{ name: 'Custom Agbada Set', quantity: 1, unitPrice: 75000 }],
    timestamps: {
      createdAt: daysAgo(7), sentToBuyerAt: daysAgo(7),
      buyerConfirmedAt: daysAgo(6), paidAt: daysAgo(5), shippedAt: daysAgo(4),
    },
  });

  // 6. IN_TRANSIT — rider picked up
  const o6 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'IN_TRANSIT', escrowStatus: 'HOLDING',
    sellerId: seller.id, buyerId: buyer.id, riderId: rider.id,
    buyerEmail: buyer.email, buyerName: 'Amaka Nwosu', buyerPhone: buyer.phone!,
    description: 'Samsung 65" QLED TV',
    itemPrice: 650000, deliveryFee: 10000,
    items: [{ name: 'Samsung 65" QLED TV', quantity: 1, unitPrice: 650000, weight: 25 }],
    timestamps: {
      createdAt: daysAgo(8), sentToBuyerAt: daysAgo(8),
      buyerConfirmedAt: daysAgo(7), paidAt: daysAgo(6),
      shippedAt: daysAgo(3), pickedUpAt: daysAgo(2),
    },
  });

  // 7. DELIVERED — rider delivered, buyer yet to confirm
  const o7 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'DELIVERED', escrowStatus: 'HOLDING',
    sellerId: seller2.id, buyerId: buyer2.id, riderId: rider.id,
    buyerEmail: buyer2.email, buyerName: 'Tunde Bakare', buyerPhone: buyer2.phone!,
    description: 'PlayStation 5 Console + 2 Controllers',
    itemPrice: 420000, deliveryFee: 6000,
    items: [
      { name: 'PlayStation 5', quantity: 1, unitPrice: 380000, weight: 3.9 },
      { name: 'DualSense Controller', quantity: 2, unitPrice: 20000 },
    ],
    timestamps: {
      createdAt: daysAgo(10), sentToBuyerAt: daysAgo(10),
      buyerConfirmedAt: daysAgo(9), paidAt: daysAgo(8),
      shippedAt: daysAgo(5), pickedUpAt: daysAgo(4), deliveredAt: daysAgo(1),
    },
  });

  // 8. COMPLETED — buyer confirmed, escrow released
  const o8 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'COMPLETED', escrowStatus: 'RELEASED',
    sellerId: seller.id, buyerId: buyer.id, riderId: rider.id,
    buyerEmail: buyer.email, buyerName: 'Amaka Nwosu', buyerPhone: buyer.phone!,
    description: 'HP LaserJet Pro Printer',
    itemPrice: 185000, deliveryFee: 4500,
    items: [{ name: 'HP LaserJet Pro MFP M428', quantity: 1, unitPrice: 185000, weight: 8.5 }],
    timestamps: {
      createdAt: daysAgo(15), sentToBuyerAt: daysAgo(15),
      buyerConfirmedAt: daysAgo(14), paidAt: daysAgo(13),
      shippedAt: daysAgo(10), pickedUpAt: daysAgo(9),
      deliveredAt: daysAgo(7), completedAt: daysAgo(6),
    },
    waybillStatus: 'ATTACHED',
  });

  // 9. DISPUTED — buyer raised dispute
  const o9 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'DISPUTED', escrowStatus: 'DISPUTED',
    sellerId: seller2.id, buyerId: buyer.id, riderId: rider.id,
    buyerEmail: buyer.email, buyerName: 'Amaka Nwosu', buyerPhone: buyer.phone!,
    description: 'Dyson V15 Cordless Vacuum',
    itemPrice: 320000, deliveryFee: 5500,
    items: [{ name: 'Dyson V15 Detect', quantity: 1, unitPrice: 320000, weight: 3.1 }],
    timestamps: {
      createdAt: daysAgo(20), sentToBuyerAt: daysAgo(20),
      buyerConfirmedAt: daysAgo(19), paidAt: daysAgo(18),
      shippedAt: daysAgo(15), pickedUpAt: daysAgo(14),
      deliveredAt: daysAgo(12), disputedAt: daysAgo(11),
    },
  });

  // 10. CANCELLED — cancelled before payment
  const o10 = await createOrder({
    trackingCode: `EW-${nanoid8()}`,
    status: 'CANCELLED', escrowStatus: 'PENDING',
    sellerId: seller.id, buyerId: buyer2.id,
    buyerEmail: buyer2.email, buyerName: 'Tunde Bakare', buyerPhone: buyer2.phone!,
    description: 'Vintage leather sofa — 3-seater',
    itemPrice: 250000, deliveryFee: 15000,
    items: [{ name: 'Leather Sofa 3-seater', quantity: 1, unitPrice: 250000, weight: 85 }],
    timestamps: {
      createdAt: daysAgo(12), sentToBuyerAt: daysAgo(12),
      buyerConfirmedAt: daysAgo(11), cancelledAt: daysAgo(10),
    },
  });

  console.log('✅ 10 orders created across all statuses\n');

  // ── Escrow transactions for paid orders ───────────────────────────
  for (const [order, actorId] of [
    [o4, buyer2.id], [o5, buyer2.id], [o6, buyer.id],
    [o7, buyer2.id], [o8, buyer.id], [o9, buyer.id],
  ] as [any, string][]) {
    await prisma.escrowTransaction.create({
      data: {
        orderId: order.id,
        type: 'ESCROW_HOLD',
        paymentStatus: 'SUCCESS',
        amount: order.totalAmount,
        currency: 'NGN',
        reference: `PAY-${nanoid8()}`,
        paystackRef: `ps_test_${nanoid8().toLowerCase()}`,
        actorId,
        note: 'Buyer paid — funds held in escrow',
        processedAt: new Date(),
      },
    });
  }

  // Escrow released for completed order
  await prisma.escrowTransaction.create({
    data: {
      orderId: o8.id,
      type: 'FULL_RELEASE',
      paymentStatus: 'SUCCESS',
      amount: o8.sellerPayout,
      currency: 'NGN',
      reference: `REL-${nanoid8()}`,
      actorId: buyer.id,
      note: 'Buyer confirmed satisfaction — funds released to seller',
      processedAt: new Date(),
    },
  });

  console.log('✅ Escrow transactions created\n');

  // ── Dispute for order 9 ───────────────────────────────────────────
  await (prisma as any).dispute.create({
    data: {
      orderId: o9.id,
      raisedById: buyer.id,
      reason: 'ITEM_DAMAGED',
      description: 'The Dyson vacuum arrived with a cracked body and the motor makes grinding noises. It appears the item was dropped during transit.',
      evidence: ['https://example.com/evidence/photo1.jpg', 'https://example.com/evidence/photo2.jpg'],
      status: 'UNDER_REVIEW',
    },
  }).catch(() => console.log('⚠️  Dispute table not yet migrated — run npx prisma migrate dev'));

  console.log('✅ Dispute created for order 9\n');

  // ── Notifications ─────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: seller.id, orderId: o4.id, type: 'ESCROW_FUNDED', channel: 'IN_APP', title: 'Payment confirmed — ship now', body: `Order ${o4.trackingCode} has been paid. Please ship the goods.`, isRead: false },
      { userId: buyer.id, orderId: o6.id, type: 'ORDER_PAID', channel: 'IN_APP', title: 'Your order is on the way', body: `Order ${o6.trackingCode} has been picked up and is in transit.`, isRead: false },
      { userId: buyer2.id, orderId: o7.id, type: 'ORDER_DELIVERED', channel: 'IN_APP', title: 'Order delivered!', body: `Order ${o7.trackingCode} has been delivered. Please confirm if you are satisfied.`, isRead: false },
      { userId: buyer.id, orderId: o8.id, type: 'ESCROW_RELEASED', channel: 'IN_APP', title: 'Transaction complete', body: `Order ${o8.trackingCode} is complete. Thank you for using EaseWaybill!`, isRead: true },
      { userId: seller2.id, orderId: o9.id, type: 'ORDER_DISPUTED', channel: 'IN_APP', title: 'Dispute raised on your order', body: `Buyer raised a dispute on order ${o9.trackingCode}. Admin is reviewing.`, isRead: false },
      { userId: admin.id, orderId: o9.id, type: 'DISPUTE_OPENED', channel: 'IN_APP', title: 'New dispute requires review', body: `Order ${o9.trackingCode} has an open dispute. Reason: ITEM_DAMAGED`, isRead: false },
    ],
  });

  console.log('✅ Notifications created\n');

  // ── Summary ────────────────────────────────────────────────────────
  console.log('─────────────────────────────────────────────────────');
  console.log('🎉 Seed complete!\n');
  console.log('Users:');
  console.log('  Admin   → admin@easewaybill.com   / Admin@123456');
  console.log('  Seller  → seller@easewaybill.com  / Seller@123456');
  console.log('  Seller2 → seller2@easewaybill.com / Seller@123456');
  console.log('  Buyer   → buyer@easewaybill.com   / Buyer@123456');
  console.log('  Buyer2  → buyer2@easewaybill.com  / Buyer@123456');
  console.log('  Rider   → rider@easewaybill.com   / Rider@123456');
  console.log('\nOrders by status:');
  console.log('  DRAFT             → 1 order');
  console.log('  PENDING_BUYER     → 1 order');
  console.log('  AWAITING_PAYMENT  → 1 order');
  console.log('  PAID              → 1 order');
  console.log('  SHIPPED           → 1 order');
  console.log('  IN_TRANSIT        → 1 order');
  console.log('  DELIVERED         → 1 order');
  console.log('  COMPLETED         → 1 order');
  console.log('  DISPUTED          → 1 order (with open dispute)');
  console.log('  CANCELLED         → 1 order');
  console.log('─────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
