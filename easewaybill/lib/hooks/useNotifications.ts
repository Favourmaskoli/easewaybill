// // "use client";

// // import { useState, useEffect, useCallback } from "react";
// // import { notificationsApi } from "@/lib/api/notifications.api";
// // import type {
// //   Notification,
// //   NotificationListResponse,
// // } from "@/lib/types/api.types";

// // export function useNotifications(params?: {
// //   limit?: number;
// //   unreadOnly?: boolean;
// // }) {
// //   const [result, setResult] = useState<NotificationListResponse | null>(null);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [fetchKey, setFetchKey] = useState(0);

// //   const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

// //   useEffect(() => {
// //     let cancelled = false;
// //     const load = async () => {
// //       setIsLoading(true);
// //       setError(null);
// //       try {
// //         const data = await notificationsApi.list({
// //           limit: params?.limit ?? 20,
// //           unreadOnly: params?.unreadOnly,
// //         });
// //         if (!cancelled) setResult(data);
// //       } catch {
// //         if (!cancelled) setError("Failed to load notifications");
// //       } finally {
// //         if (!cancelled) setIsLoading(false);
// //       }
// //     };
// //     void load();
// //     return () => {
// //       cancelled = true;
// //     };
// //   }, [fetchKey, params?.limit, params?.unreadOnly]);

// //   const markRead = useCallback(
// //     async (id: string) => {
// //       await notificationsApi.markRead(id);
// //       refetch();
// //     },
// //     [refetch],
// //   );

// //   const markAllRead = useCallback(async () => {
// //     await notificationsApi.markAllRead();
// //     refetch();
// //   }, [refetch]);

// //   return {
// //     notifications: result?.data ?? [],
// //     unreadCount: result?.unreadCount ?? 0,
// //     total: result?.meta?.total ?? 0,
// //     hasNextPage: result?.meta?.hasNextPage ?? false,
// //     isLoading,
// //     error,
// //     refetch,
// //     markRead,
// //     markAllRead,
// //   };
// // }

// // // ── Lightweight hook for the header bell badge ────────────────────
// // export function useUnreadCount() {
// //   const [count, setCount] = useState(0);
// //   const [fetchKey, setFetchKey] = useState(0);

// //   const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

// //   useEffect(() => {
// //     let cancelled = false;
// //     const load = async () => {
// //       try {
// //         const data = await notificationsApi.list({
// //           limit: 1,
// //           unreadOnly: true,
// //         });
// //         if (!cancelled) setCount(data.unreadCount ?? 0);
// //       } catch {
// //         // Silently fail — badge not showing is not critical
// //       }
// //     };
// //     void load();
// //     return () => {
// //       cancelled = true;
// //     };
// //   }, [fetchKey]);

// //   // Poll every 30 seconds for new notifications
// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       setFetchKey((k) => k + 1);
// //     }, 30_000);
// //     return () => clearInterval(interval);
// //   }, []);

// //   return { count, refetch };
// // }

// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { notificationsApi } from "@/lib/api/notifications.api";
// import type { NotificationListResponse } from "@/lib/types/api.types";

// export function useNotifications(params?: {
//   limit?: number;
//   unreadOnly?: boolean;
// }) {
//   const [result, setResult] = useState<NotificationListResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [fetchKey, setFetchKey] = useState(0);

//   const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

//   useEffect(() => {
//     let cancelled = false;
//     const load = async () => {
//       setIsLoading(true);
//       setError(null);
//       try {
//         const data = await notificationsApi.list({
//           limit: params?.limit ?? 20,
//           unreadOnly: params?.unreadOnly,
//         });
//         if (!cancelled) setResult(data);
//       } catch {
//         if (!cancelled) setError("Failed to load notifications");
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     };
//     void load();
//     return () => {
//       cancelled = true;
//     };
//   }, [fetchKey, params?.limit, params?.unreadOnly]);

//   const markRead = useCallback(
//     async (id: string) => {
//       await notificationsApi.markRead(id);
//       refetch();
//     },
//     [refetch],
//   );

//   const markAllRead = useCallback(async () => {
//     await notificationsApi.markAllRead();
//     refetch();
//   }, [refetch]);

//   return {
//     notifications: result?.data ?? [],
//     unreadCount: result?.unreadCount ?? 0,
//     total: result?.meta?.total ?? 0,
//     hasNextPage: result?.meta?.hasNextPage ?? false,
//     isLoading,
//     error,
//     refetch,
//     markRead,
//     markAllRead,
//   };
// }

"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationsApi } from "@/lib/api/notifications.api";
import type {
  Notification,
  NotificationListResponse,
} from "@/lib/types/api.types";

export function useNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const [result, setResult] = useState<NotificationListResponse | null>(null);
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
        const data = await notificationsApi.list({
          limit: params?.limit ?? 20,
          unreadOnly: params?.unreadOnly,
        });
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setError("Failed to load notifications");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey, params?.limit, params?.unreadOnly]);

  const markRead = useCallback(
    async (id: string) => {
      await notificationsApi.markRead(id);
      refetch();
    },
    [refetch],
  );

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    refetch();
  }, [refetch]);

  return {
    // ✅ backend returns `notifications` not `data`
    notifications: result?.notifications ?? [],
    unreadCount: result?.unreadCount ?? 0,
    total: result?.total ?? 0,
    hasNextPage: result?.hasNextPage ?? false,
    isLoading,
    error,
    refetch,
    markRead,
    markAllRead,
  };
}

// ── Lightweight hook for the header bell badge ────────────────────
export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await notificationsApi.list({
          limit: 1,
          unreadOnly: true,
        });
        if (!cancelled) setCount(data.unreadCount ?? 0);
      } catch {
        // Silently fail — badge not visible is not critical
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  // Poll every 30s for new notifications
  useEffect(() => {
    const interval = setInterval(() => setFetchKey((k) => k + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return { count, refetch };
}
