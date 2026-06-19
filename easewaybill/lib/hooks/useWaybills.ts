"use client";

import { useState, useEffect } from "react";
import { waybillsApi } from "@/lib/api/waybills.api";
import type { WaybillTracking } from "@/lib/types/api.types";

export function useWaybill(waybillNumber: string | null) {
  const [waybill, setWaybill] = useState<WaybillTracking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!waybillNumber) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await waybillsApi.track(waybillNumber);
        if (!cancelled) setWaybill(result);
      } catch {
        if (!cancelled) setError("Waybill not found");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [waybillNumber]);

  return { waybill, isLoading, error };
}
