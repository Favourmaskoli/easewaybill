// lib/query-keys.ts
export const queryKeys = {
  orders: {
    all: ["orders"] as const,
    list: (filters?: unknown) => ["orders", "list", filters] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: unknown) => ["notifications", "list", params] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
};