// import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { UserRole, TransactionType } from '@prisma/client';
// import type {
//   CreateRiderDto,
//   PromoteUserDto,
//   CreateAdminDto 
// } from './dto/admin-user.dto';

// import type {
//   AdminDashboardDto,
//   AdminUserDto,
//   AdminDisputeDto,
//   AdminEscrowLedgerDto,
// } from './dto/admin-stats.dto';
// import type { PaginatedResult } from '../../common/dto/pagination.dto';
// import { paginate } from '../../common/dto/pagination.dto';

// @Injectable()
// export class AdminService {
//   private readonly logger = new Logger(AdminService.name);

//   constructor(private readonly prisma: PrismaService) {}

//   // ── GET /admin/dashboard ──────────────────────────────────────────
//   async getDashboard(): Promise<AdminDashboardDto> {
//     const [
//       userCounts,
//       orderCounts,
//       escrowHeld,
//       escrowReleased,
//       escrowRefunded,
//       platformFees,
//       disputeCounts,
//     ] = await Promise.all([
//       // User counts by role
//       this.prisma.user.groupBy({
//         by: ['role'],
//         _count: { id: true },
//         where: { accountStatus: 'ACTIVE' },
//       }),
//       // Order counts by status
//       this.prisma.order.groupBy({
//         by: ['status'],
//         _count: { id: true },
//       }),
//       // Total held in escrow
//       this.prisma.escrowTransaction.aggregate({
//         where: { type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
//         _sum: { amount: true },
//       }),
//       // Total released
//       this.prisma.escrowTransaction.aggregate({
//         where: { type: 'FULL_RELEASE', paymentStatus: 'SUCCESS' },
//         _sum: { amount: true },
//       }),
//       // Total refunded
//       this.prisma.escrowTransaction.aggregate({
//         where: { type: 'REFUND', paymentStatus: 'SUCCESS' },
//         _sum: { amount: true },
//       }),
//       // Platform fees
//       this.prisma.escrowTransaction.aggregate({
//         where: { type: 'PLATFORM_FEE', paymentStatus: 'SUCCESS' },
//         _sum: { amount: true },
//       }),
//       // Dispute counts by status
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       (this.prisma as any).dispute.groupBy({
//         by: ['status'],
//         _count: { id: true },
//       }),
//     ]);

//     // Build maps
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const userMap = userCounts.reduce(
//       (acc: Record<string, number>, r: any) => {
//         acc[r.role] = r._count.id;
//         return acc;
//       },
//       {} as Record<string, number>,
//     );

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const orderMap = orderCounts.reduce(
//       (acc: Record<string, number>, r: any) => {
//         acc[r.status] = r._count.id;
//         return acc;
//       },
//       {} as Record<string, number>,
//     );

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const disputeMap = disputeCounts.reduce(
//       (acc: Record<string, number>, r: any) => {
//         acc[r.status] = r._count.id;
//         return acc;
//       },
//       {} as Record<string, number>,
//     );

//     const totalOrders = Object.values(orderMap).reduce((sum: number, v) => sum + (v as number), 0);

//     const openDisputeStatuses = ['OPEN', 'UNDER_REVIEW'];
//     const openDisputes = openDisputeStatuses.reduce((sum, s) => sum + (disputeMap[s] ?? 0), 0);
//     const resolvedDisputes =
//       (disputeMap['RESOLVED_FOR_BUYER'] ?? 0) +
//       (disputeMap['RESOLVED_FOR_SELLER'] ?? 0) +
//       (disputeMap['CLOSED'] ?? 0);

//     return {
//       // Users
//       totalUsers: Object.values(userMap).reduce((sum: number, v) => sum + (v as number), 0),
//       totalSellers: userMap['SELLER'] ?? 0,
//       totalBuyers: userMap['BUYER'] ?? 0,
//       totalRiders: userMap['RIDER'] ?? 0,

//       // Orders
//       totalOrders,
//       ordersDraft: orderMap['DRAFT'] ?? 0,
//       ordersPendingBuyer: orderMap['PENDING_BUYER'] ?? 0,
//       ordersAwaitingPayment: orderMap['AWAITING_PAYMENT'] ?? 0,
//       ordersPaid: orderMap['PAID'] ?? 0,
//       ordersShipped: orderMap['SHIPPED'] ?? 0,
//       ordersInTransit: orderMap['IN_TRANSIT'] ?? 0,
//       ordersDelivered: orderMap['DELIVERED'] ?? 0,
//       ordersCompleted: orderMap['COMPLETED'] ?? 0,
//       ordersCancelled: orderMap['CANCELLED'] ?? 0,
//       ordersDisputed: orderMap['DISPUTED'] ?? 0,
//       ordersRefunded: orderMap['REFUNDED'] ?? 0,

//       // Revenue
//       totalRevenueHeld: parseFloat(String(escrowHeld._sum.amount ?? 0)),
//       totalRevenueReleased: parseFloat(String(escrowReleased._sum.amount ?? 0)),
//       totalRevenueRefunded: parseFloat(String(escrowRefunded._sum.amount ?? 0)),
//       totalPlatformFees: parseFloat(String(platformFees._sum.amount ?? 0)),

//       // Disputes
//       openDisputes,
//       resolvedDisputes,

//       generatedAt: new Date().toISOString(),
//     };
//   }

//   // ── GET /admin/users ──────────────────────────────────────────────
//   async getUsers(
//     role?: string,
//     search?: string,
//     limit = 20,
//     cursor?: string,
//   ): Promise<PaginatedResult<AdminUserDto>> {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const where: any = {
//       ...(role && { role }),
//       ...(search && {
//         OR: [
//           { email: { contains: search, mode: 'insensitive' } },
//           { firstName: { contains: search, mode: 'insensitive' } },
//           { lastName: { contains: search, mode: 'insensitive' } },
//         ],
//       }),
//       ...(cursor && { id: { lt: cursor } }),
//     };

//     const [users, total] = await Promise.all([
//       this.prisma.user.findMany({
//         where,
//         select: {
//           id: true,
//           email: true,
//           firstName: true,
//           lastName: true,
//           phone: true,
//           role: true,
//           accountStatus: true,
//           isEmailVerified: true,
//           createdAt: true,
//           _count: {
//             select: {
//               ordersAsSeller: true,
//               ordersAsBuyer: true,
//             },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//       }),
//       this.prisma.user.count({
//         where: {
//           //   ...(role && { role: as any }),
//           ...(role && { role: role as UserRole }),
//           ...(search && {
//             OR: [
//               { email: { contains: search, mode: 'insensitive' } },
//               { firstName: { contains: search, mode: 'insensitive' } },
//               { lastName: { contains: search, mode: 'insensitive' } },
//             ],
//           }),
//         },
//       }),
//     ]);

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const formatted: AdminUserDto[] = users.map((u: any) => ({
//       id: u.id,
//       email: u.email,
//       firstName: u.firstName,
//       lastName: u.lastName,
//       phone: u.phone,
//       role: u.role,
//       isActive: u.isActive,
//       isEmailVerified: u.isEmailVerified,
//       ordersAsSeller: u._count.ordersAsSeller,
//       ordersAsBuyer: u._count.ordersAsBuyer,
//       createdAt: u.createdAt,
//     }));

//     return paginate(formatted as (AdminUserDto & { id: string })[], total, limit);
//   }

//   // ── PATCH /admin/users/:id/suspend ────────────────────────────────
//   async suspendUser(
//     userId: string,
//     adminId: string,
//   ): Promise<{ message: string; userId: string; isActive: boolean }> {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: { id: true, email: true, role: true, accountStatus: true },
//     });

//     if (!user) {
//       throw new NotFoundException(`User ${userId} not found`);
//     }

//     if (user.role === 'ADMIN') {
//       throw new BadRequestException('Cannot suspend an admin account');
//     }

//     const updated = await this.prisma.user.update({
//       where: { id: userId },
//       data: { accountStatus: 'ACTIVE' },
//       select: { id: true, email: true, accountStatus: true },
//     });

//     this.logger.log(`User [${userId}] ${user.email} suspended by admin [${adminId}]`);

//     return {
//       message: `User ${user.email} has been suspended`,
//       userId: updated.id,
//       isActive: updated.isActive,
//     };
//   }

//   // ── PATCH /admin/users/:id/unsuspend ──────────────────────────────
//   async unsuspendUser(
//     userId: string,
//     adminId: string,
//   ): Promise<{ message: string; userId: string; isActive: boolean }> {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: { id: true, email: true, isActive: true },
//     });

//     if (!user) {
//       throw new NotFoundException(`User ${userId} not found`);
//     }

//     const updated = await this.prisma.user.update({
//       where: { id: userId },
//       data: { isActive: true },
//       select: { id: true, email: true, isActive: true },
//     });

//     this.logger.log(`User [${userId}] ${user.email} unsuspended by admin [${adminId}]`);

//     return {
//       message: `User ${user.email} has been reactivated`,
//       userId: updated.id,
//       isActive: updated.isActive,
//     };
//   }
//   // ── POST /admin/users/create-rider ───────────────────────────────
//   async createRider(dto: CreateRiderDto, adminId: string): Promise<AdminUserDto> {
//     const exists = await this.prisma.user.findUnique({
//       where: { email: dto.email },
//     });
//     if (exists) {
//       throw new BadRequestException(`A user with email ${dto.email} already exists`);
//     }

//     const bcrypt = await import('bcrypt');
//     const hashedPassword = await bcrypt.hash(dto.password, 10);

//     const rider = await this.prisma.user.create({
//       data: {
//         email: dto.email,
//         firstName: dto.firstName,
//         lastName: dto.lastName,
//         password: hashedPassword,
//         phoneNumber: dto.phoneNumber,
//         vehicleType: dto.vehicleType,
//         vehiclePlate: dto.vehiclePlate,
//         role: 'RIDER',
//         accountStatus: 'ACTIVE',
//       },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         phoneNumber: true,
//         role: true,
//         accountStatus: true,
//         isEmailVerified: true,
//         createdAt: true,
//         _count: {
//           select: {
//             ordersAsSeller: true,
//             ordersAsBuyer: true,
//           },
//         },
//       },
//     });

//     this.logger.log(`Rider account created: ${rider.email} by admin [${adminId}]`);

//     return this.formatUser(rider);
//   }

//   // ── POST /admin/users/create-admin ───────────────────────────────
//   async createAdmin(dto: CreateAdminDto, adminId: string): Promise<AdminUserDto> {
//     const exists = await this.prisma.user.findUnique({
//       where: { email: dto.email },
//     });
//     if (exists) {
//       throw new BadRequestException(`A user with email ${dto.email} already exists`);
//     }

//     const bcrypt = await import('bcrypt');
//     const hashedPassword = await bcrypt.hash(dto.password, 10);

//     const admin = await this.prisma.user.create({
//       data: {
//         email: dto.email,
//         firstName: dto.firstName,
//         lastName: dto.lastName,
//         password: hashedPassword,
//         phoneNumber: dto.phoneNumber,
//         role: 'ADMIN',
//         accountStatus: 'ACTIVE',
//       },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         phoneNumber: true,
//         role: true,
//         accountStatus: true,
//         isEmailVerified: true,
//         createdAt: true,
//         _count: {
//           select: {
//             ordersAsSeller: true,
//             ordersAsBuyer: true,
//           },
//         },
//       },
//     });

//     this.logger.log(`Admin account created: ${admin.email} by admin [${adminId}]`);

//     return this.formatUser(admin);
//   }

//   // ── PATCH /admin/users/:id/role ───────────────────────────────────
//   async changeUserRole(
//     userId: string,
//     dto: PromoteUserDto,
//     adminId: string,
//   ): Promise<AdminUserDto> {
//     // Prevent admin from changing their own role
//     if (userId === adminId) {
//       throw new BadRequestException('You cannot change your own role');
//     }

//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         email: true,
//         role: true,
//       },
//     });

//     if (!user) {
//       throw new NotFoundException(`User ${userId} not found`);
//     }

//     // Prevent removing the last admin
//     if (user.role === 'ADMIN' && dto.role !== 'ADMIN') {
//       const adminCount = await this.prisma.user.count({
//         where: { role: 'ADMIN' },
//       });
//       if (adminCount <= 1) {
//         throw new BadRequestException('Cannot demote the last remaining admin in the system');
//       }
//     }

//     const updated = await this.prisma.user.update({
//       where: { id: userId },
//       data: { role: dto.role as any },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         phoneNumber: true,
//         role: true,
//         accountStatus: true,
//         isEmailVerified: true,
//         createdAt: true,
//         _count: {
//           select: {
//             ordersAsSeller: true,
//             ordersAsBuyer: true,
//           },
//         },
//       },
//     });

//     this.logger.log(
//       `User ${user.email} role changed: ${user.role} → ${dto.role} by admin [${adminId}]`,
//     );

//     return this.formatUser(updated);
//   }

//   // ── Private helper ────────────────────────────────────────────────
//   private formatUser(u: any): AdminUserDto {
//     return {
//       id: u.id,
//       email: u.email,
//       firstName: u.firstName,
//       lastName: u.lastName,
//       phone: u.phoneNumber,
//       role: u.role,
//       isActive: u.accountStatus === 'ACTIVE',
//       isEmailVerified: u.isEmailVerified,
//       ordersAsSeller: u._count?.ordersAsSeller ?? 0,
//       ordersAsBuyer: u._count?.ordersAsBuyer ?? 0,
//       createdAt: u.createdAt,
//     };
//   }
//   // ── GET /admin/escrow ─────────────────────────────────────────────
//   async getEscrowLedger(
//     type?: string,
//     limit = 20,
//     cursor?: string,
//   ): Promise<PaginatedResult<AdminEscrowLedgerDto>> {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const where: any = {
//       ...(type && { type }),
//       ...(cursor && { id: { lt: cursor } }),
//     };

//     const countWhere: any = type ? { type } : {};

//     const [transactions, total] = await Promise.all([
//       this.prisma.escrowTransaction.findMany({
//         where,
//         include: {
//           order: { select: { trackingCode: true } },
//           actor: { select: { email: true } },
//         },
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//       }),
//       this.prisma.escrowTransaction.count({ where: countWhere }),
//     ]);

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const formatted: AdminEscrowLedgerDto[] = transactions.map((t: any) => ({
//       id: t.id,
//       orderId: t.orderId,
//       trackingCode: t.order?.trackingCode ?? '',
//       type: t.type,
//       paymentStatus: t.paymentStatus,
//       amount: t.amount,
//       currency: t.currency,
//       reference: t.reference,
//       actorEmail: t.actor?.email ?? null,
//       note: t.note,
//       processedAt: t.processedAt,
//       createdAt: t.createdAt,
//     }));

//     return paginate(formatted as (AdminEscrowLedgerDto & { id: string })[], total, limit);
//   }

//   // ── GET /admin/disputes ───────────────────────────────────────────
//   async getDisputes(
//     status?: string,
//     limit = 20,
//     cursor?: string,
//   ): Promise<PaginatedResult<AdminDisputeDto>> {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const where: any = {
//       ...(status && { status }),
//       ...(cursor && { id: { lt: cursor } }),
//     };

//     const countWhere = status ? { status } : {};

//     const [disputes, total] = await Promise.all([
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       (this.prisma as any).dispute.findMany({
//         where,
//         include: {
//           order: {
//             select: {
//               trackingCode: true,
//               totalAmount: true,
//               seller: { select: { email: true } },
//               buyer: { select: { email: true } },
//             },
//           },
//           raisedBy: { select: { email: true, role: true } },
//         },
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//       }),
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       (this.prisma as any).dispute.count({ where: countWhere }),
//     ]);

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const formatted: AdminDisputeDto[] = disputes.map((d: any) => ({
//       id: d.id,
//       orderId: d.orderId,
//       trackingCode: d.order?.trackingCode ?? '',
//       reason: d.reason,
//       description: d.description,
//       status: d.status,
//       raisedByEmail: d.raisedBy?.email ?? '',
//       raisedByRole: d.raisedBy?.role ?? '',
//       sellerEmail: d.order?.seller?.email ?? '',
//       buyerEmail: d.order?.buyer?.email ?? '',
//       orderAmount: d.order?.totalAmount,
//       createdAt: d.createdAt,
//     }));

//     return paginate(formatted as (AdminDisputeDto & { id: string })[], total, limit);
//   }
// }

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import type { CreateRiderDto, PromoteUserDto, CreateAdminDto } from './dto/admin-user.dto';
import type {
  AdminDashboardDto,
  AdminUserDto,
  AdminDisputeDto,
  AdminEscrowLedgerDto,
} from './dto/admin-stats.dto';
import type { PaginatedResult } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── GET /admin/dashboard ──────────────────────────────────────────
  async getDashboard(): Promise<AdminDashboardDto> {
    const [
      userCounts,
      orderCounts,
      escrowHeld,
      escrowReleased,
      escrowRefunded,
      platformFees,
      disputeCounts,
    ] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
        where: { accountStatus: 'ACTIVE' } as any,
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { type: 'ESCROW_HOLD', paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { type: 'FULL_RELEASE', paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { type: 'REFUND', paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { type: 'PLATFORM_FEE', paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.prisma as any).dispute.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userMap = userCounts.reduce((acc: Record<string, number>, r: any) => {
      acc[r.role] = r._count.id;
      return acc;
    }, {} as Record<string, number>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderMap = orderCounts.reduce((acc: Record<string, number>, r: any) => {
      acc[r.status] = r._count.id;
      return acc;
    }, {} as Record<string, number>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const disputeMap = disputeCounts.reduce((acc: Record<string, number>, r: any) => {
      acc[r.status] = r._count.id;
      return acc;
    }, {} as Record<string, number>);

    const totalOrders = Object.values(orderMap).reduce(
      (sum: number, v) => sum + (v as number), 0,
    );
    const openDisputes = ['OPEN', 'UNDER_REVIEW'].reduce(
      (sum, s) => sum + (disputeMap[s] ?? 0), 0,
    );
    const resolvedDisputes =
      (disputeMap['RESOLVED_FOR_BUYER'] ?? 0) +
      (disputeMap['RESOLVED_FOR_SELLER'] ?? 0) +
      (disputeMap['CLOSED'] ?? 0);

    return {
      // ✅ Updated: USER replaces SELLER/BUYER after migration
      totalUsers: Object.values(userMap).reduce((sum: number, v) => sum + (v as number), 0),
      totalSellers: userMap['USER'] ?? 0,   // kept as totalSellers for DTO compat
      totalBuyers: userMap['USER'] ?? 0,    // same — USER is now the base role
      totalRiders: userMap['RIDER'] ?? 0,
      totalOrders,
      ordersDraft: orderMap['DRAFT'] ?? 0,
      ordersPendingBuyer: orderMap['PENDING_BUYER'] ?? 0,
      ordersAwaitingPayment: orderMap['AWAITING_PAYMENT'] ?? 0,
      ordersPaid: orderMap['PAID'] ?? 0,
      ordersShipped: orderMap['SHIPPED'] ?? 0,
      ordersInTransit: orderMap['IN_TRANSIT'] ?? 0,
      ordersDelivered: orderMap['DELIVERED'] ?? 0,
      ordersCompleted: orderMap['COMPLETED'] ?? 0,
      ordersCancelled: orderMap['CANCELLED'] ?? 0,
      ordersDisputed: orderMap['DISPUTED'] ?? 0,
      ordersRefunded: orderMap['REFUNDED'] ?? 0,
      totalRevenueHeld: parseFloat(String(escrowHeld._sum.amount ?? 0)),
      totalRevenueReleased: parseFloat(String(escrowReleased._sum.amount ?? 0)),
      totalRevenueRefunded: parseFloat(String(escrowRefunded._sum.amount ?? 0)),
      totalPlatformFees: parseFloat(String(platformFees._sum.amount ?? 0)),
      openDisputes,
      resolvedDisputes,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── GET /admin/users ──────────────────────────────────────────────
  async getUsers(
    role?: string,
    search?: string,
    limit = 20,
    cursor?: string,
  ): Promise<PaginatedResult<AdminUserDto>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(cursor && { id: { lt: cursor } }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          accountStatus: true,       // ✅ was isActive
          isEmailVerified: true,
          createdAt: true,
          _count: {
            select: {
              ordersAsSeller: true,
              ordersAsBuyer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          ...(role && { role: role as UserRole }),
          ...(search && {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted: AdminUserDto[] = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      role: u.role,
      isActive: u.accountStatus === 'ACTIVE', // ✅ derive boolean from enum
      isEmailVerified: u.isEmailVerified,
      ordersAsSeller: u._count.ordersAsSeller,
      ordersAsBuyer: u._count.ordersAsBuyer,
      createdAt: u.createdAt,
    }));

    return paginate(formatted as (AdminUserDto & { id: string })[], total, limit);
  }

  // ── PATCH /admin/users/:id/suspend ────────────────────────────────
  async suspendUser(
    userId: string,
    adminId: string,
  ): Promise<{ message: string; userId: string; isActive: boolean }> {
    if (userId === adminId) {
      throw new BadRequestException('You cannot suspend your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, accountStatus: true },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot suspend the last remaining admin');
      }
    }

    // ✅ use accountStatus not isActive
    await (this.prisma.user.update as any)({
      where: { id: userId },
      data: { accountStatus: 'SUSPENDED' },
    });

    this.logger.log(`User [${userId}] ${user.email} suspended by admin [${adminId}]`);

    return {
      message: `User ${user.email} has been suspended`,
      userId,
      isActive: false,
    };
  }

  // ── PATCH /admin/users/:id/unsuspend ──────────────────────────────
  async unsuspendUser(
    userId: string,
    adminId: string,
  ): Promise<{ message: string; userId: string; isActive: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, accountStatus: true },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // ✅ use accountStatus not isActive
    await (this.prisma.user.update as any)({
      where: { id: userId },
      data: { accountStatus: 'ACTIVE' },
    });

    this.logger.log(`User [${userId}] ${user.email} unsuspended by admin [${adminId}]`);

    return {
      message: `User ${user.email} has been reactivated`,
      userId,
      isActive: true,
    };
  }

  // ── POST /admin/users/create-rider ────────────────────────────────
  async createRider(
    dto: CreateRiderDto,
    adminId: string,
  ): Promise<AdminUserDto> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException(
        `A user with email ${dto.email} already exists`,
      );
    }

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // ✅ use passwordHash not password (check your schema field name)
    const rider = await (this.prisma.user.create as any)({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: hashedPassword,  // ← use whichever field your schema has
        phone: dto.phoneNumber,        // ← your schema uses `phone` not `phoneNumber`
        vehicleType: dto.vehicleType,
        vehiclePlate: dto.vehiclePlate,
        role: 'RIDER',
        accountStatus: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        accountStatus: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: {
            ordersAsSeller: true,
            ordersAsBuyer: true,
          },
        },
      },
    });

    this.logger.log(
      `Rider account created: ${rider.email} by admin [${adminId}]`,
    );

    return this.formatUser(rider);
  }

  // ── POST /admin/users/create-admin ────────────────────────────────
  async createAdmin(
    dto: CreateAdminDto,
    adminId: string,
  ): Promise<AdminUserDto> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException(
        `A user with email ${dto.email} already exists`,
      );
    }

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await (this.prisma.user.create as any)({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: hashedPassword,  // ← match your schema field name
        phone: dto.phoneNumber,        // ← your schema uses `phone` not `phoneNumber`
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        accountStatus: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: {
            ordersAsSeller: true,
            ordersAsBuyer: true,
          },
        },
      },
    });

    this.logger.log(
      `Admin account created: ${admin.email} by admin [${adminId}]`,
    );

    return this.formatUser(admin);
  }

  // ── PATCH /admin/users/:id/role ───────────────────────────────────
  async changeUserRole(
    userId: string,
    dto: PromoteUserDto,
    adminId: string,
  ): Promise<AdminUserDto> {
    if (userId === adminId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (user.role === 'ADMIN' && dto.role !== 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last remaining admin in the system',
        );
      }
    }

    const updated = await (this.prisma.user.update as any)({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        accountStatus: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: {
            ordersAsSeller: true,
            ordersAsBuyer: true,
          },
        },
      },
    });

    this.logger.log(
      `User ${user.email} role: ${user.role} → ${dto.role} by admin [${adminId}]`,
    );

    return this.formatUser(updated);
  }

  // ── Private helper ────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatUser(u: any): AdminUserDto {
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      role: u.role,
      isActive: u.accountStatus === 'ACTIVE', // ✅ derive boolean from enum
      isEmailVerified: u.isEmailVerified,
      ordersAsSeller: u._count?.ordersAsSeller ?? 0,
      ordersAsBuyer: u._count?.ordersAsBuyer ?? 0,
      createdAt: u.createdAt,
    };
  }

  // ── GET /admin/escrow ─────────────────────────────────────────────
  async getEscrowLedger(
    type?: string,
    limit = 20,
    cursor?: string,
  ): Promise<PaginatedResult<AdminEscrowLedgerDto>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ...(type && { type }),
      ...(cursor && { id: { lt: cursor } }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countWhere: any = type ? { type } : {};

    const [transactions, total] = await Promise.all([
      this.prisma.escrowTransaction.findMany({
        where,
        include: {
          order: { select: { trackingCode: true } },
          actor: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.escrowTransaction.count({ where: countWhere }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted: AdminEscrowLedgerDto[] = transactions.map((t: any) => ({
      id: t.id,
      orderId: t.orderId,
      trackingCode: t.order?.trackingCode ?? '',
      type: t.type,
      paymentStatus: t.paymentStatus,
      amount: t.amount,
      currency: t.currency,
      reference: t.reference,
      actorEmail: t.actor?.email ?? null,
      note: t.note,
      processedAt: t.processedAt,
      createdAt: t.createdAt,
    }));

    return paginate(
      formatted as (AdminEscrowLedgerDto & { id: string })[],
      total,
      limit,
    );
  }

  // ── GET /admin/disputes ───────────────────────────────────────────
  async getDisputes(
    status?: string,
    limit = 20,
    cursor?: string,
  ): Promise<PaginatedResult<AdminDisputeDto>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ...(status && { status }),
      ...(cursor && { id: { lt: cursor } }),
    };
    const countWhere = status ? { status } : {};

    const [disputes, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.prisma as any).dispute.findMany({
        where,
        include: {
          order: {
            select: {
              trackingCode: true,
              totalAmount: true,
              seller: { select: { email: true } },
              buyer: { select: { email: true } },
            },
          },
          raisedBy: { select: { email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.prisma as any).dispute.count({ where: countWhere }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted: AdminDisputeDto[] = disputes.map((d: any) => ({
      id: d.id,
      orderId: d.orderId,
      trackingCode: d.order?.trackingCode ?? '',
      reason: d.reason,
      description: d.description,
      status: d.status,
      raisedByEmail: d.raisedBy?.email ?? '',
      raisedByRole: d.raisedBy?.role ?? '',
      sellerEmail: d.order?.seller?.email ?? '',
      buyerEmail: d.order?.buyer?.email ?? '',
      orderAmount: d.order?.totalAmount,
      createdAt: d.createdAt,
    }));

    return paginate(
      formatted as (AdminDisputeDto & { id: string })[],
      total,
      limit,
    );
  }
}