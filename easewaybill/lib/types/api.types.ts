// ── Auth ──────────────────────────────────────────────────────

export type UserRole = "USER" | "RIDER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl?: string | null;
  businessName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankCode?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  // role is intentionally omitted — backend defaults to USER
  // role does NOT restrict permissions. Any user can act as user or rider
  // depending on which orders they create vs which orders they pay for.
}

// ── API Response wrapper ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

// ── Orders ────────────────────────────────────────────────────

export type OrderStatus =
  | "DRAFT"
  | "PENDING_BUYER"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED"
  | "REFUNDED";

export type EscrowStatus =
  | "PENDING"
  | "HOLDING"
  | "PARTIALLY_RELEASED"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED";

export interface OrderItem {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice?: string | null;
  weight?: string | null;
  fragile: boolean;
}

export interface OrderParty {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
}

export interface OrderWaybill {
  id: string;
  waybillNumber: string;
  status: string;
  pdfUrl?: string | null;
  generatedAt: string;
}

export interface Order {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  escrowStatus: EscrowStatus;
  description: string;
  fragile: boolean;
  dimensions?: string | null;
  pickupAddress: string;
  pickupLat?: string | null;
  pickupLng?: string | null;
  deliveryAddress: string;
  deliveryLat?: string | null;
  deliveryLng?: string | null;
  buyerEmail: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
  itemPrice: string;
  deliveryFee: string;
  totalAmount: string;
  platformFee: string;
  sellerPayout: string;
  riderPayout: string;
  sellerId: string;
  buyerId?: string | null;
  riderId?: string | null;
  seller?: OrderParty;
  buyer?: OrderParty | null;
  rider?: OrderParty | null;
  items: OrderItem[];
  waybills: OrderWaybill[];
  paidAt?: string | null;
  shippedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  disputedAt?: string | null;
  cancelledAt?: string | null;
  refundedAt?: string | null;
  sentToBuyerAt?: string | null;
  buyerConfirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  buyerEmail: string;
  buyerName?: string;
  buyerPhone?: string;
  itemPrice: number;
  deliveryFee?: number;
  fragile?: boolean;
  dimensions?: string;
  items: {
    name: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    weight?: number;
    fragile?: boolean;
  }[];
}

// ── Payments ──────────────────────────────────────────────────

export interface PaymentRecord {
  id: string;
  orderId: string;
  reference: string;
  amount: string;
  currency: string;
  channel: string;
  channelLabel: string;
  status: string;
  authorizationUrl?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  orderId: string;
  amount: number;
  currency: string;
}

// ── Escrow ────────────────────────────────────────────────────

export interface EscrowTransaction {
  id: string;
  orderId: string;
  trackingCode: string;
  type: string;
  paymentStatus: string;
  amount: string;
  currency: string;
  reference: string;
  note?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface EscrowStatusDetail {
  escrowStatus: string;
  orderStatus: string;
  trackingCode: string;
  transactions: EscrowTransaction[];
  auditLog: AuditLog[];
}

export interface AuditLog {
  id: string;
  orderId: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  amount: string;
  note?: string | null;
  createdAt: string;
}

// ── Notifications ─────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  orderId?: string | null;
  type: string;
  channel: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationList {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasNextPage: boolean;
  nextCursor?: string | null;
}

// ── Waybill ───────────────────────────────────────────────────

export interface WaybillEvent {
  id: string;
  status: string;
  note?: string | null;
  location?: string | null;
  lat?: string | null;
  lng?: string | null;
  createdAt: string;
}

export interface WaybillTracking {
  waybillNumber: string;
  status: string;
  orderStatus: string;
  trackingCode: string;
  description: string;
  sellerName: string;
  sellerAddress: string;
  buyerName: string;
  buyerAddress: string;
  weight?: string | null;
  fragile: boolean;
  timeline: WaybillEvent[];
  generatedAt: string;
  estimatedDelivery?: string | null;
}

export interface AdminDashboard {
  // Users
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalRiders: number;
  // Orders
  totalOrders: number;
  ordersDraft: number;
  ordersPendingBuyer: number;
  ordersAwaitingPayment: number;
  ordersPaid: number;
  ordersShipped: number;
  ordersInTransit: number;
  ordersDelivered: number;
  ordersCompleted: number;
  ordersCancelled: number;
  ordersDisputed: number;
  ordersRefunded: number;
  // Revenue
  totalRevenueHeld: number;
  totalRevenueReleased: number;
  totalRevenueRefunded: number;
  totalPlatformFees: number;
  // Disputes
  openDisputes: number;
  resolvedDisputes: number;
  generatedAt: string;
}
