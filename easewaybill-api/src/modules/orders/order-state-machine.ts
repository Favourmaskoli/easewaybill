import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

// ── Contextual roles — describe relationship to a specific order ──
// These are INDEPENDENT of the UserRole account enum (USER/RIDER/ADMIN).
// A single account can be SELLER on Order A and BUYER on Order B.
type ContextualRole = 'ADMIN' | 'SELLER' | 'BUYER' | 'RIDER';

export type OrderAction =
  | 'SEND_TO_BUYER'
  | 'CANCEL'
  | 'CONFIRM_ORDER'
  | 'PAYMENT_CONFIRMED'
  | 'SHIP'
  | 'PICKUP'
  | 'DELIVER'
  | 'CONFIRM_SATISFACTION'
  | 'RAISE_DISPUTE'
  | 'RESOLVE_SELLER'
  | 'RESOLVE_BUYER';

export interface OrderTransition {
  to: OrderStatus;
  description: string;
  roles: ContextualRole[];
}

export const ORDER_STATE_MACHINE: Record<
  OrderStatus,
  Partial<Record<OrderAction, OrderTransition>>
> = {
  [OrderStatus.DRAFT]: {
    SEND_TO_BUYER: {
      to: OrderStatus.PENDING_BUYER,
      roles: ['SELLER', 'ADMIN'],
      description: 'Seller sends order to buyer for confirmation',
    },
    CANCEL: {
      to: OrderStatus.CANCELLED,
      roles: ['SELLER', 'ADMIN'],
      description: 'Cancel before sending to buyer',
    },
  },

  [OrderStatus.PENDING_BUYER]: {
    CONFIRM_ORDER: {
      to: OrderStatus.AWAITING_PAYMENT,
      roles: ['BUYER', 'ADMIN'],
      description: 'Buyer confirms order details',
    },
    CANCEL: {
      to: OrderStatus.CANCELLED,
      roles: ['SELLER', 'BUYER', 'ADMIN'],
      description: 'Cancel before payment',
    },
  },

  [OrderStatus.AWAITING_PAYMENT]: {
    PAYMENT_CONFIRMED: {
      to: OrderStatus.PAID,
      roles: ['ADMIN'],
      description: 'Payment confirmed via Paystack webhook',
    },
    CANCEL: {
      to: OrderStatus.CANCELLED,
      roles: ['SELLER', 'BUYER', 'ADMIN'],
      description: 'Cancel before payment completes',
    },
  },

  [OrderStatus.PAID]: {
    SHIP: {
      to: OrderStatus.SHIPPED,
      roles: ['SELLER', 'ADMIN'],
      description: 'Seller ships goods',
    },
    CANCEL: {
      to: OrderStatus.REFUNDED,
      roles: ['ADMIN'],
      description: 'Admin cancels after payment, triggers refund',
    },
  },

  [OrderStatus.SHIPPED]: {
    PICKUP: {
      to: OrderStatus.IN_TRANSIT,
      roles: ['RIDER', 'ADMIN'],
      description: 'Rider picks up goods',
    },
  },

  [OrderStatus.IN_TRANSIT]: {
    DELIVER: {
      to: OrderStatus.DELIVERED,
      roles: ['RIDER', 'ADMIN'],
      description: 'Rider confirms delivery',
    },
  },

  [OrderStatus.DELIVERED]: {
    CONFIRM_SATISFACTION: {
      to: OrderStatus.COMPLETED,
      roles: ['BUYER', 'ADMIN'],
      description: 'Buyer confirms satisfaction — escrow released',
    },
    RAISE_DISPUTE: {
      to: OrderStatus.DISPUTED,
      roles: ['BUYER', 'SELLER', 'ADMIN'],
      description: 'Raise a dispute',
    },
  },

  [OrderStatus.DISPUTED]: {
    RESOLVE_SELLER: {
      to: OrderStatus.COMPLETED,
      roles: ['ADMIN'],
      description: 'Admin resolves in favour of seller',
    },
    RESOLVE_BUYER: {
      to: OrderStatus.REFUNDED,
      roles: ['ADMIN'],
      description: 'Admin resolves in favour of buyer',
    },
  },

  [OrderStatus.COMPLETED]: {},
  [OrderStatus.CANCELLED]: {},
  [OrderStatus.REFUNDED]: {},
};

export function validateTransition(
  currentStatus: OrderStatus | string,
  nextStatus: OrderStatus | string,
  role: string,
): void {
  const transitions = ORDER_STATE_MACHINE[currentStatus as OrderStatus];

  if (!transitions) {
    throw new BadRequestException(`Unknown order status: ${currentStatus}`);
  }

  const transition = Object.values(transitions).find((item) => item?.to === nextStatus);

  if (!transition) {
    throw new BadRequestException(
      `Invalid order transition: ${currentStatus} cannot move to ${nextStatus}`,
    );
  }

  if (!transition.roles.includes(role as ContextualRole)) {
    throw new ForbiddenException(
      `${role} is not allowed to change order from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function canTransitionOrder(currentStatus: OrderStatus, action: OrderAction): boolean {
  return Boolean(ORDER_STATE_MACHINE[currentStatus]?.[action]);
}

export function getOrderTransition(
  currentStatus: OrderStatus,
  action: OrderAction,
): OrderTransition | undefined {
  return ORDER_STATE_MACHINE[currentStatus]?.[action];
}

export function transitionOrderStatus(
  currentStatus: OrderStatus,
  action: OrderAction,
): OrderStatus {
  const transition = getOrderTransition(currentStatus, action);

  if (!transition) {
    throw new BadRequestException(
      `Invalid order transition: ${currentStatus} cannot perform ${action}`,
    );
  }

  return transition.to;
}
