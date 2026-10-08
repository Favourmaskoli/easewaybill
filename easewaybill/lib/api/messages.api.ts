import { apiClient, unwrap } from "@/lib/api/client";
import type { MessageListResponse, OrderMessage } from "@/lib/types/api.types";

export const messagesApi = {
  // GET /orders/:id/messages
  list: (orderId: string, params?: { limit?: number; cursor?: string }) =>
    apiClient
      .get<{
        data: MessageListResponse;
      }>(`/orders/${orderId}/messages`, { params })
      .then(unwrap),

  // POST /orders/:id/messages
  send: (orderId: string, body: string) =>
    apiClient
      .post<{ data: OrderMessage }>(`/orders/${orderId}/messages`, { body })
      .then(unwrap),
};
