// import { apiClient, unwrap } from "./client";
// import type {
//   Order,
//   CreateOrderDto,
//   PaginatedResponse,
// } from "../types/api.types";

// export interface OrderFilters {
//   status?: string;
//   search?: string;
//   dateFrom?: string;
//   dateTo?: string;
//   limit?: number;
//   cursor?: string;
// }

// export const ordersApi = {
//   // List orders (role-aware — backend filters by user)
//   list: (filters?: OrderFilters) =>
//     apiClient
//       .get<{ data: PaginatedResponse<Order> }>("/orders", {
//         params: filters,
//       })
//       .then(unwrap),

//   // Get single order
//   get: (id: string) =>
//     apiClient.get<{ data: Order }>(`/orders/${id}`).then(unwrap),

//   // Create order (SELLER only)
//   create: (dto: CreateOrderDto) =>
//     apiClient.post<{ data: Order }>("/orders", dto).then(unwrap),

//   // Send order to buyer (DRAFT → PENDING_BUYER)
//   sendToBuyer: (id: string) =>
//     apiClient
//       .patch<{ data: Order }>(`/orders/${id}/status`, {
//         status: "PENDING_BUYER",
//       })
//       .then(unwrap),

//   // Buyer confirms order
//   confirm: (id: string) =>
//     apiClient.post<{ data: Order }>(`/orders/${id}/confirm`).then(unwrap),

//   // Update order status
//   updateStatus: (id: string, status: string) =>
//     apiClient
//       .patch<{ data: Order }>(`/orders/${id}/status`, { status })
//       .then(unwrap),

//   // Assign rider (ADMIN)
//   assignRider: (id: string, riderId: string) =>
//     apiClient
//       .post<{ data: Order }>(`/orders/${id}/assign-rider`, { riderId })
//       .then(unwrap),
// };

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

  // Create order (SELLER only).
  //
  // Takes a FormData body, not CreateOrderDto directly — the endpoint is
  // multipart/form-data because it accepts up to 5 item images alongside
  // the order fields (see NestJS FilesInterceptor('images', 5, ...) on
  // OrdersController.create). The caller (useCreateOrder) is responsible
  // for building the FormData: primitive fields as strings, the nested
  // `items` array as a single JSON.stringify'd field, and each File
  // appended under the "images" key.
  //
  // IMPORTANT: do NOT set a Content-Type header here. When axios is given
  // a FormData body it detects this automatically and sets
  // "multipart/form-data; boundary=..." itself — the boundary value is
  // generated per-request and can't be set manually. If apiClient has a
  // default Content-Type: application/json header configured globally
  // (check your axios instance in ./client), it must be overridden to
  // undefined for this specific call, which the empty headers object
  // below does by taking precedence over defaults for this request only.
  create: (formData: FormData) =>
    apiClient
      .post<{ data: Order }>("/orders", formData, {
        headers: { "Content-Type": undefined },
      })
      .then(unwrap),

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
