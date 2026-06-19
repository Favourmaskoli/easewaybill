import { apiClient, unwrap } from "./client";
import type {
  Order,
  CreateOrderDto,
  PaginatedResponse,
} from "../types/api.types";

export interface OrderFilters {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}

export const ordersApi = {
  // List orders (role-aware — backend filters by user)
  list: (filters?: OrderFilters) =>
    apiClient
      .get<{ data: PaginatedResponse<Order> }>("/orders", {
        params: filters,
      })
      .then(unwrap),

  // Get single order
  get: (id: string) =>
    apiClient.get<{ data: Order }>(`/orders/${id}`).then(unwrap),

  // Create order (SELLER only)
  create: (dto: CreateOrderDto) =>
    apiClient.post<{ data: Order }>("/orders", dto).then(unwrap),

  // Send order to buyer (DRAFT → PENDING_BUYER)
  sendToBuyer: (id: string) =>
    apiClient
      .patch<{ data: Order }>(`/orders/${id}/status`, {
        status: "PENDING_BUYER",
      })
      .then(unwrap),

  // Buyer confirms order
  confirm: (id: string) =>
    apiClient.post<{ data: Order }>(`/orders/${id}/confirm`).then(unwrap),

  // Update order status
  updateStatus: (id: string, status: string) =>
    apiClient
      .patch<{ data: Order }>(`/orders/${id}/status`, { status })
      .then(unwrap),

  // Assign rider (ADMIN)
  assignRider: (id: string, riderId: string) =>
    apiClient
      .post<{ data: Order }>(`/orders/${id}/assign-rider`, { riderId })
      .then(unwrap),
};
