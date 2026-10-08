"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient, unwrap } from "@/lib/api/client";
import type { TrackWaybillResponse } from "@/lib/types/api.types";

export class TrackingNotFoundError extends Error {}

async function fetchTracking(
  waybillNumber: string,
): Promise<TrackWaybillResponse> {
  try {
    const response = await apiClient.get<{ data: TrackWaybillResponse }>(
      `/track/${encodeURIComponent(waybillNumber)}`,
    );
    return unwrap(response);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new TrackingNotFoundError(
        `No shipment found for waybill number "${waybillNumber}"`,
      );
    }
    throw new Error("Something went wrong while fetching tracking info.");
  }
}

export function useTrackWaybill(waybillNumber: string | null) {
  return useQuery({
    queryKey: ["track-waybill", waybillNumber],
    queryFn: () => fetchTracking(waybillNumber as string),
    enabled: !!waybillNumber,
    retry: false,
    staleTime: 30_000,
  });
}
