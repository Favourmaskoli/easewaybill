import { apiClient, unwrap } from "./client";
import type { NotificationList, Notification } from "../types/api.types";

export const notificationsApi = {
  list: (params?: { limit?: number; cursor?: string; unreadOnly?: boolean }) =>
    apiClient
      .get<{ data: NotificationList }>("/notifications", { params })
      .then(unwrap),

  markRead: (id: string) =>
    apiClient
      .patch<{ data: Notification }>(`/notifications/${id}/read`)
      .then(unwrap),

  markAllRead: () =>
    apiClient
      .patch<{ data: { updated: number } }>("/notifications/read-all")
      .then(unwrap),
};
