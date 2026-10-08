"use client";

import { useState, useEffect, useCallback } from "react";
import { disputesApi } from "@/lib/api/disputes.api";
import type { Dispute, RaiseDisputeDto } from "@/lib/types/api.types";

export function useDispute(orderId: string) {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await disputesApi.getByOrder(orderId);
        if (!cancelled) setDispute(data);
      } catch {
        // 404 means no dispute exists — not an error
        if (!cancelled) setDispute(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, fetchKey]);

  const raiseDispute = useCallback(
    async (dto: RaiseDisputeDto) => {
      const data = await disputesApi.raise(orderId, dto);
      setDispute(data);
      return data;
    },
    [orderId],
  );

  return { dispute, isLoading, error, refetch, raiseDispute };
}
