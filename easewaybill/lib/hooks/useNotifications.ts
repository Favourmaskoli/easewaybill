"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationsApi } from "../api/notifications.api";
import type { Notification } from "../types/api.types";

export function useNotifications(unreadOnly = false) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await notificationsApi.list({ unreadOnly });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setTotal(result.total);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    total,
    isLoading,
    refetch: fetch,
    markRead,
    markAllRead,
  };
}
