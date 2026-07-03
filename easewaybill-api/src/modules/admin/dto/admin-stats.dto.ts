import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardDto {
  @ApiProperty() declare totalUsers: number;
  @ApiProperty() declare totalSellers: number;
  @ApiProperty() declare totalBuyers: number;
  @ApiProperty() declare totalRiders: number;

  @ApiProperty() declare totalOrders: number;
  @ApiProperty() declare ordersDraft: number;
  @ApiProperty() declare ordersPendingBuyer: number;
  @ApiProperty() declare ordersAwaitingPayment: number;
  @ApiProperty() declare ordersPaid: number;
  @ApiProperty() declare ordersShipped: number;
  @ApiProperty() declare ordersInTransit: number;
  @ApiProperty() declare ordersDelivered: number;
  @ApiProperty() declare ordersCompleted: number;
  @ApiProperty() declare ordersCancelled: number;
  @ApiProperty() declare ordersDisputed: number;
  @ApiProperty() declare ordersRefunded: number;

  @ApiProperty() declare totalRevenueHeld: number;
  @ApiProperty() declare totalRevenueReleased: number;
  @ApiProperty() declare totalRevenueRefunded: number;
  @ApiProperty() declare totalPlatformFees: number;

  @ApiProperty() declare openDisputes: number;
  @ApiProperty() declare resolvedDisputes: number;

  @ApiProperty() declare generatedAt: string;
}

export class AdminUserDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare email: string;
  @ApiProperty() declare firstName: string;
  @ApiProperty() declare lastName: string;
  @ApiProperty() declare phone: string | null;
  @ApiProperty() declare role: string;
  @ApiProperty() declare isActive: boolean;
  @ApiProperty() declare isEmailVerified: boolean;
  @ApiProperty() declare ordersAsSeller: number;
  @ApiProperty() declare ordersAsBuyer: number;
  @ApiProperty() declare createdAt: Date;
}

export class AdminDisputeDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare orderId: string;
  @ApiProperty() declare trackingCode: string;
  @ApiProperty() declare reason: string;
  @ApiProperty() declare description: string;
  @ApiProperty() declare status: string;
  @ApiProperty() declare raisedByEmail: string;
  @ApiProperty() declare raisedByRole: string;
  @ApiProperty() declare sellerEmail: string;
  @ApiProperty() declare buyerEmail: string;
  @ApiProperty() declare orderAmount: unknown;
  @ApiProperty() declare createdAt: Date;
}

export class AdminEscrowLedgerDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare orderId: string;
  @ApiProperty() declare trackingCode: string;
  @ApiProperty() declare type: string;
  @ApiProperty() declare paymentStatus: string;
  @ApiProperty() declare amount: unknown;
  @ApiProperty() declare currency: string;
  @ApiProperty() declare reference: string;
  @ApiProperty() declare actorEmail: string | null;
  @ApiProperty() declare note: string | null;
  @ApiProperty() declare processedAt: Date | null;
  @ApiProperty() declare createdAt: Date;
}
