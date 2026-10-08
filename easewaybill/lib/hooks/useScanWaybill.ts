"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ScanWaybillPayload,
  WaybillTrackingResponse,
} from "@/lib/types/waybill.types";

export function useScanWaybill(waybillNumber: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ScanWaybillPayload) => {
      try {
        const response = await apiClient.post<{ data: WaybillTrackingResponse }>(
          `/waybills/${encodeURIComponent(waybillNumber)}/scan`,
          payload,
        );
        return unwrap(response);
      } catch (error) {
        if (isAxiosError(error)) {
          if (error.response?.status === 403) {
            throw new Error(
              error.response.data?.message ??
                "You're not the assigned rider for this order.",
            );
          }
          if (error.response?.status === 400) {
            throw new Error(
              error.response.data?.message ??
                "This order can't be scanned in its current status.",
            );
          }
          if (error.response?.status === 404) {
            throw new Error("Waybill not found.");
          }
        }
        throw new Error("Something went wrong while recording the scan.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["track-waybill", waybillNumber] });
    },
  });
}