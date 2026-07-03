"use client";

import { useState, useEffect, useCallback } from "react";
import { ordersApi } from "@/lib/api/orders.api";
import type { Order } from "@/lib/types/api.types";

export interface RiderOrderFilters {
  status?: string;
  search?: string;
}

export interface RiderOrderStats {
  total: number;
  inTransit: number;
  outForDelivery: number;
  delivered: number;
}

// Rider-relevant statuses mapped from your backend state machine
const RIDER_STATUSES = ["SHIPPED", "IN_TRANSIT", "DELIVERED"] as const;

export type RiderStatus = (typeof RIDER_STATUSES)[number];

export function useRiderOrders(filters: RiderOrderFilters = {}) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all orders — backend already filters by riderId
        // via the OR clause in findAll. We fetch a large limit
        // and do client-side status/search filtering for instant UX.
        const result = await ordersApi.list({ limit: 100 });
        if (!cancelled) {
          // Only show orders actually assigned to the rider
          // (riderId is set by admin, so these are genuinely assigned)
          const riderOrders = result.data.filter((o) =>
            ["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(o.status),
          );
          setAllOrders(riderOrders);
        }
      } catch {
        if (!cancelled)
          setError("Failed to load your orders. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  // Client-side filtering for instant search/filter without extra API calls
  const filteredOrders = allOrders.filter((order) => {
    const matchesStatus =
      !filters.status ||
      filters.status === "All" ||
      order.status === filters.status;

    const q = filters.search?.toLowerCase() ?? "";
    const matchesSearch =
      !q ||
      order.trackingCode?.toLowerCase().includes(q) ||
      order.buyer?.firstName?.toLowerCase().includes(q) ||
      order.buyer?.lastName?.toLowerCase().includes(q) ||
      order.seller?.firstName?.toLowerCase().includes(q) ||
      order.seller?.lastName?.toLowerCase().includes(q) ||
      order.pickupAddress?.toLowerCase().includes(q) ||
      order.deliveryAddress?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const stats: RiderOrderStats = {
    total: allOrders.length,
    inTransit: allOrders.filter((o) => o.status === "IN_TRANSIT").length,
    outForDelivery: allOrders.filter((o) => o.status === "SHIPPED").length,
    delivered: allOrders.filter((o) => o.status === "DELIVERED").length,
  };

  return {
    orders: filteredOrders,
    allOrders,
    stats,
    isLoading,
    error,
    refetch,
  };
}
