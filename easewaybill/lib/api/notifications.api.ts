import { apiClient, unwrap } from "@/lib/api/client";
import type {
  Notification,
  NotificationListResponse,
} from "@/lib/types/api.types";

export const notificationsApi = {
  // List notifications for current user
  list: (params?: { limit?: number; cursor?: string; unreadOnly?: boolean }) =>
    apiClient
      .get<{ data: NotificationListResponse }>("/notifications", { params })
      .then(unwrap),

  // Mark a single notification as read
  markRead: (id: string) =>
    apiClient
      .patch<{ data: Notification }>(`/notifications/${id}/read`)
      .then(unwrap),

  // Mark all notifications as read
  markAllRead: () =>
    apiClient
      .patch<{ data: { updated: number } }>("/notifications/read-all")
      .then(unwrap),
};
