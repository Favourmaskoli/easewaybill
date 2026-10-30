import type { PaymentChannel } from '@prisma/client';

/** Paystack channel → our PaymentChannel enum */
export const CHANNEL_MAP: Record<string, PaymentChannel> = {
  card: 'CARD',
  bank: 'BANK_TRANSFER',
  bank_transfer: 'BANK_TRANSFER',
  ussd: 'USSD',
  qr: 'QR',
  mobile_money: 'MOBILE_MONEY',
};

/** Escrow states that must never be funded again by a payment. */
export const TERMINAL_ESCROW_STATUSES = new Set<string>([
  'RELEASED',
  'PARTIALLY_RELEASED',
  'REFUNDED',
  'DISPUTED',
]);

/** Reads the order id from Paystack metadata (plain key or custom_fields). */
export function extractOrderId(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const data = metadata as Record<string, unknown>;

  if (typeof data.orderId === 'string' && data.orderId.trim()) {
    return data.orderId.trim();
  }

  if (!Array.isArray(data.custom_fields)) {
    return undefined;
  }

  for (const field of data.custom_fields) {
    if (!field || typeof field !== 'object' || Array.isArray(field)) {
      continue;
    }

    const customField = field as Record<string, unknown>;

    if (
      customField.variable_name === 'order_id' &&
      typeof customField.value === 'string' &&
      customField.value.trim()
    ) {
      return customField.value.trim();
    }
  }

  return undefined;
}
