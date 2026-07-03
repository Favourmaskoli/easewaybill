// import { apiClient, unwrap } from "@/lib/api/client";
// import type { AdminDashboard } from "@/lib/types/api.types";

// export interface AdminUser {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   phone?: string | null;
//   role: string;
//   isActive: boolean;
//   isEmailVerified: boolean;
//   ordersAsSeller: number;
//   ordersAsBuyer: number;
//   createdAt: string;
// }

// export interface AdminDispute {
//   id: string;
//   orderId: string;
//   trackingCode: string;
//   reason: string;
//   description?: string;
//   status: string;
//   raisedByEmail: string;
//   raisedByRole: string;
//   sellerEmail: string;
//   buyerEmail: string;
//   orderAmount: string;
//   createdAt: string;
// }

// export interface AdminEscrowEntry {
//   id: string;
//   orderId: string;
//   trackingCode: string;
//   type: string;
//   paymentStatus: string;
//   amount: string;
//   currency: string;
//   reference: string;
//   actorEmail?: string | null;
//   note?: string | null;
//   processedAt?: string | null;
//   createdAt: string;
// }

// export interface AdminPaginatedResult<T> {
//   data: T[];
//   meta: {
//     total: number;
//     limit: number;
//     hasNextPage: boolean;
//     nextCursor: string | null;
//   };
// }

// export const adminApi = {
//   getDashboard: () =>
//     apiClient.get<{ data: AdminDashboard }>("/admin/dashboard").then(unwrap),

//   getUsers: (params?: {
//     role?: string;
//     search?: string;
//     limit?: number;
//     cursor?: string;
//   }) =>
//     apiClient
//       .get<{ data: AdminPaginatedResult<AdminUser> }>("/admin/users", {
//         params,
//       })
//       .then(unwrap),

//   suspendUser: (userId: string) =>
//     apiClient
//       .patch<{
//         data: { message: string; userId: string; isActive: boolean };
//       }>(`/admin/users/${userId}/suspend`)
//       .then(unwrap),

//   unsuspendUser: (userId: string) =>
//     apiClient
//       .patch<{
//         data: { message: string; userId: string; isActive: boolean };
//       }>(`/admin/users/${userId}/unsuspend`)
//       .then(unwrap),

//   getDisputes: (params?: {
//     status?: string;
//     limit?: number;
//     cursor?: string;
//   }) =>
//     apiClient
//       .get<{ data: AdminPaginatedResult<AdminDispute> }>("/admin/disputes", {
//         params,
//       })
//       .then(unwrap),

//   getEscrowLedger: (params?: {
//     type?: string;
//     limit?: number;
//     cursor?: string;
//   }) =>
//     apiClient
//       .get<{ data: AdminPaginatedResult<AdminEscrowEntry> }>("/admin/escrow", {
//         params,
//       })
//       .then(unwrap),

//   assignRider: (orderId: string, riderId: string) =>
//     apiClient
//       .post(`/admin/orders/${orderId}/assign-rider`, { riderId })
//       .then((r) => r.data),

//   updateOrderStatus: (orderId: string, status: string) =>
//     apiClient
//       .patch(`/admin/orders/${orderId}/status`, { status })
//       .then((r) => r.data),
//   // Add inside the adminApi object, alongside your existing methods:

//   createRider: (data: {
//     email: string;
//     firstName: string;
//     lastName: string;
//     password: string;
//     phoneNumber?: string;
//     vehicleType?: string;
//     vehiclePlate?: string;
//   }) =>
//     apiClient
//       .post<{ data: AdminUser }>("/admin/users/create-rider", data)
//       .then(unwrap),

//   createAdmin: (data: {
//     email: string;
//     firstName: string;
//     lastName: string;
//     password: string;
//     phoneNumber?: string;
//   }) =>
//     apiClient
//       .post<{ data: AdminUser }>("/admin/users/create-admin", data)
//       .then(unwrap),

//   changeUserRole: (userId: string, role: "USER" | "RIDER" | "ADMIN") =>
//     apiClient
//       .patch<{ data: AdminUser }>(`/admin/users/${userId}/role`, { role })
//       .then(unwrap),
// };

import { apiClient, unwrap } from "@/lib/api/client";
import type { AdminDashboard } from "@/lib/types/api.types";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  ordersAsSeller: number;
  ordersAsBuyer: number;
  createdAt: string;
}

export interface AdminDispute {
  id: string;
  orderId: string;
  trackingCode: string;
  reason: string;
  description?: string;
  status: string;
  raisedByEmail: string;
  raisedByRole: string;
  sellerEmail: string;
  buyerEmail: string;
  orderAmount: string;
  createdAt: string;
}

export interface AdminEscrowEntry {
  id: string;
  orderId: string;
  trackingCode: string;
  type: string;
  paymentStatus: string;
  amount: string;
  currency: string;
  reference: string;
  actorEmail?: string | null;
  note?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface AdminPaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

export const adminApi = {
  getDashboard: () =>
    apiClient.get<{ data: AdminDashboard }>("/admin/dashboard").then(unwrap),

  getUsers: (params?: {
    role?: string;
    search?: string;
    limit?: number;
    cursor?: string;
  }) =>
    apiClient
      .get<{ data: AdminPaginatedResult<AdminUser> }>("/admin/users", {
        params,
      })
      .then(unwrap),

  suspendUser: (userId: string) =>
    apiClient
      .patch<{
        data: { message: string; userId: string; isActive: boolean };
      }>(`/admin/users/${userId}/suspend`)
      .then(unwrap),

  unsuspendUser: (userId: string) =>
    apiClient
      .patch<{
        data: { message: string; userId: string; isActive: boolean };
      }>(`/admin/users/${userId}/unsuspend`)
      .then(unwrap),

  // ── Role management ────────────────────────────────────────────
  createRider: (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phoneNumber?: string;
    vehicleType?: string;
    vehiclePlate?: string;
  }) =>
    apiClient
      .post<{ data: AdminUser }>("/admin/users/create-rider", data)
      .then(unwrap),

  createAdmin: (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phoneNumber?: string;
  }) =>
    apiClient
      .post<{ data: AdminUser }>("/admin/users/create-admin", data)
      .then(unwrap),

  changeUserRole: (userId: string, role: "USER" | "RIDER" | "ADMIN") =>
    apiClient
      .patch<{ data: AdminUser }>(`/admin/users/${userId}/role`, { role })
      .then(unwrap),

  getDisputes: (params?: {
    status?: string;
    limit?: number;
    cursor?: string;
  }) =>
    apiClient
      .get<{ data: AdminPaginatedResult<AdminDispute> }>("/admin/disputes", {
        params,
      })
      .then(unwrap),

  getEscrowLedger: (params?: {
    type?: string;
    limit?: number;
    cursor?: string;
  }) =>
    apiClient
      .get<{ data: AdminPaginatedResult<AdminEscrowEntry> }>("/admin/escrow", {
        params,
      })
      .then(unwrap),

  assignRider: (orderId: string, riderId: string) =>
    apiClient
      .post(`/admin/orders/${orderId}/assign-rider`, { riderId })
      .then((r) => r.data),

  updateOrderStatus: (orderId: string, status: string) =>
    apiClient
      .patch(`/admin/orders/${orderId}/status`, { status })
      .then((r) => r.data),
};
