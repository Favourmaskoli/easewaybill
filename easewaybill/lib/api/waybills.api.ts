import { apiClient, unwrap } from "@/lib/api/client";
import type { WaybillTracking } from "@/lib/types/api.types";

export const waybillsApi = {
  // Public tracking — no auth needed
  track: (waybillNumber: string) =>
    apiClient
      .get<{ data: WaybillTracking }>(`/waybills/${waybillNumber}`)
      .then(unwrap),

  // Rider scan
  scan: (
    waybillNumber: string,
    data: {
      location?: string;
      lat?: number;
      lng?: number;
      note?: string;
    },
  ) =>
    apiClient
      .post<{ data: WaybillTracking }>(`/waybills/${waybillNumber}/scan`, data)
      .then(unwrap),
};
