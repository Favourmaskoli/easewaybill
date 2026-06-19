/**
 * EASEWAYBILL ORDER CONTEXT MODEL
 *
 * EaseWaybill uses context-based roles, not account-based roles.
 *
 * - Any authenticated user can CREATE an order → they become the SELLER for that order
 * - Any authenticated user can CONFIRM and PAY for an order → they become the BUYER
 * - The same user can be seller on Order A and buyer on Order B simultaneously
 * - The user's `role` field on their account is for display/admin filtering only
 * - All permission checks use: order.sellerId === user.id (not user.role === 'SELLER')
 *
 * UI context is derived at render time:
 *   const isSeller = order.sellerId === user.id
 *   const isBuyer  = order.buyerId  === user.id
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { ordersApi } from "@/lib/api/orders.api";
import type { Order, CreateOrderDto } from "@/lib/types/api.types";
import type { OrderFilters } from "@/lib/api/orders.api";

export function useOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const refetch = () => setFetchKey((k) => k + 1);

  useEffect(() => {
    // ── Don't fetch if no token ───────────────────────────────
    const hasToken =
      typeof window !== "undefined" &&
      (localStorage.getItem("accessToken") ||
        (() => {
          try {
            const raw = localStorage.getItem("easewaybill-auth");
            return raw
              ? (JSON.parse(raw) as { state?: { accessToken?: string } })?.state
                  ?.accessToken
              : null;
          } catch {
            return null;
          }
        })());

    if (!hasToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await ordersApi.list(filtersRef.current);
        if (!cancelled) {
          setOrders(result.data);
          setTotal(result.meta.total);
          setHasNextPage(result.meta.hasNextPage);
          setNextCursor(result.meta.nextCursor);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError("Failed to load orders");
          console.error("useOrders error:", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, filters?.status, filters?.limit, filters?.search]);

  return {
    orders,
    total,
    hasNextPage,
    nextCursor,
    isLoading,
    error,
    refetch,
  };
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = () => setFetchKey((k) => k + 1);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await ordersApi.get(id);
        if (!cancelled) setOrder(result);
      } catch {
        if (!cancelled) setError("Order not found");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [id, fetchKey]);

  return { order, isLoading, error, refetch };
}

export function useCreateOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (dto: CreateOrderDto): Promise<Order | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await ordersApi.create(dto);
      return order;
    } catch (err: unknown) {
      const message = (
        err as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      const errorText = Array.isArray(message)
        ? message[0]
        : (message ?? "Failed to create order");
      setError(errorText);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOrder, isLoading, error };
}

export function useUpdateOrderStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    id: string,
    status: string,
  ): Promise<Order | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await ordersApi.updateStatus(id, status);
      return order;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update status";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateStatus, isLoading, error };
}
