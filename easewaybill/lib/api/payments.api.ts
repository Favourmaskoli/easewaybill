import { apiClient, unwrap } from "./client";
import type {
  PaymentRecord,
  InitiatePaymentResponse,
} from "../types/api.types";

export const paymentsApi = {
  // Initiate Paystack payment (BUYER)
  initiate: (orderId: string, callbackUrl?: string) =>
    apiClient
      .post<{ data: InitiatePaymentResponse }>("/payments/initiate", {
        orderId,
        callbackUrl,
      })
      .then(unwrap),

  // Get payment status for an order
  getStatus: (orderId: string) =>
    apiClient
      .get<{
        data: {
          orderId: string;
          orderStatus: string;
          escrowStatus: string;
          trackingCode: string;
          payments: PaymentRecord[];
          latestPayment: PaymentRecord | null;
        };
      }>(`/payments/status/${orderId}`)
      .then(unwrap),

  // Verify payment by reference (polling)
  verify: (reference: string) =>
    apiClient
      .get<{
        data: {
          reference: string;
          status: string;
          channelLabel: string;
          amount: number;
          paidAt: string | null;
          record: PaymentRecord;
        };
      }>(`/payments/verify/${reference}`)
      .then(unwrap),

  // Payment history for current user
  history: (limit?: number, cursor?: string) =>
    apiClient
      .get<{ data: PaymentRecord[] }>("/payments/history", {
        params: { limit, cursor },
      })
      .then(unwrap),

  // Get payment records for an order
  getByOrder: (orderId: string) =>
    apiClient
      .get<{ data: PaymentRecord[] }>(`/payments/orders/${orderId}/records`)
      .then(unwrap),
};
