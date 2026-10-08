import { apiClient, unwrap } from "@/lib/api/client";
import type { Dispute, RaiseDisputeDto } from "@/lib/types/api.types";

export const disputesApi = {
  raise: (orderId: string, dto: RaiseDisputeDto) =>
    apiClient
      .post<{ data: Dispute }>(`/orders/${orderId}/dispute`, dto)
      .then(unwrap),

  getByOrder: (orderId: string) =>
    apiClient.get<{ data: Dispute }>(`/orders/${orderId}/dispute`).then(unwrap),

  resolve: (
    orderId: string,
    dto: { resolution: string; resolveFor: "BUYER" | "SELLER" },
  ) =>
    apiClient
      .patch<{ data: Dispute }>(`/orders/${orderId}/dispute`, dto)
      .then(unwrap),

  findAll: (status?: string) =>
    apiClient
      .get<{ data: Dispute[] }>("/disputes", { params: { status } })
      .then(unwrap),
};
