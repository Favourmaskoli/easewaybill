"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api/admin.api";
import type {
  AdminUser,
  AdminDispute,
  AdminEscrowEntry,
  AdminPaginatedResult,
} from "@/lib/api/admin.api";
import type { AdminDashboard } from "@/lib/types/api.types";

export function useAdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const data = await adminApi.getDashboard();
        if (!cancelled) setDashboard(data);
      } catch {
        if (!cancelled) setError("Failed to load dashboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { dashboard, isLoading, error };
}

export function useAdminUsers(params?: {
  role?: string;
  search?: string;
  limit?: number;
}) {
  const [result, setResult] = useState<AdminPaginatedResult<AdminUser> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = () => setFetchKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const data = await adminApi.getUsers(params);
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setError("Failed to load users");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchKey, params?.role, params?.search, params?.limit]);

  const suspendUser = async (userId: string) => {
    await adminApi.suspendUser(userId);
    refetch();
  };

  const unsuspendUser = async (userId: string) => {
    await adminApi.unsuspendUser(userId);
    refetch();
  };

  return {
    users: result?.data ?? [],
    total: result?.meta.total ?? 0,
    isLoading,
    error,
    refetch,
    suspendUser,
    unsuspendUser,
  };
}

export function useAdminDisputes(params?: { status?: string; limit?: number }) {
  const [result, setResult] =
    useState<AdminPaginatedResult<AdminDispute> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = () => setFetchKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const data = await adminApi.getDisputes(params);
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setError("Failed to load disputes");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchKey, params?.status, params?.limit]);

  return {
    disputes: result?.data ?? [],
    total: result?.meta.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}

export function useAdminEscrow(params?: { type?: string; limit?: number }) {
  const [result, setResult] =
    useState<AdminPaginatedResult<AdminEscrowEntry> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = () => setFetchKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const data = await adminApi.getEscrowLedger(params);
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setError("Failed to load escrow ledger");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchKey, params?.type, params?.limit]);

  return {
    entries: result?.data ?? [],
    total: result?.meta.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}
