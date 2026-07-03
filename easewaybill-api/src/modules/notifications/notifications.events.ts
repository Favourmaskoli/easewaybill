// ── Event names ───────────────────────────────────────────────────
// Used by EventEmitter2 to route events to the correct listener.
// Import this in any service that emits or listens to notifications.

export const NotificationEvents = {
  // Order events
  ORDER_CREATED: 'notification.order.created',
  ORDER_SENT_TO_BUYER: 'notification.order.sent_to_buyer',
  ORDER_CONFIRMED: 'notification.order.confirmed',
  ORDER_PAID: 'notification.order.paid',
  ORDER_SHIPPED: 'notification.order.shipped',
  ORDER_PICKED_UP: 'notification.order.picked_up',
  ORDER_DELIVERED: 'notification.order.delivered',
  ORDER_COMPLETED: 'notification.order.completed',
  ORDER_CANCELLED: 'notification.order.cancelled',
  ORDER_DISPUTED: 'notification.order.disputed',
  // Escrow events
  ESCROW_FUNDED: 'notification.escrow.funded',
  ESCROW_RELEASED: 'notification.escrow.released',
  ESCROW_REFUNDED: 'notification.escrow.refunded',
  // Payment events
  PAYMENT_SUCCESS: 'notification.payment.success',
  PAYMENT_FAILED: 'notification.payment.failed',
  // Dispute events
  DISPUTE_OPENED: 'notification.dispute.opened',
  DISPUTE_RESOLVED: 'notification.dispute.resolved',
} as const;

// ── Event payload types ───────────────────────────────────────────

export interface OrderEventPayload {
  orderId: string;
  trackingCode: string;
  sellerId: string;
  buyerId?: string | null;
  riderId?: string | null;
  buyerEmail?: string;
  status: string;
  totalAmount?: number;
}

export interface EscrowEventPayload {
  orderId: string;
  trackingCode: string;
  sellerId: string;
  buyerId?: string | null;
  amount: number;
  type: 'HOLD' | 'RELEASE' | 'REFUND';
}

export interface DisputeEventPayload {
  orderId: string;
  trackingCode: string;
  sellerId: string;
  buyerId: string;
  reason: string;
  resolution?: string;
}
