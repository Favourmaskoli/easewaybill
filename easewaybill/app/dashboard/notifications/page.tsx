"use client";

import {
  Bell,
  BellOff,
  CheckCheck,
  Package,
  Truck,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { Notification } from "@/lib/types/api.types";
import Link from "next/link";

// ── Icon + colour per notification type ──────────────────────────
const TYPE_META: Record<
  string,
  { icon: React.ElementType; iconBg: string; iconColor: string }
> = {
  ORDER_SENT_TO_BUYER: {
    icon: Package,
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
  },
  ORDER_CREATED: { icon: Package, iconBg: "#f0fdf4", iconColor: "#16a34a" },
  ORDER_CONFIRMED: {
    icon: CheckCircle,
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
  },
  ORDER_PAID: { icon: CreditCard, iconBg: "#f0fdf4", iconColor: "#16a34a" },
  PAYMENT_SUCCESS: {
    icon: CreditCard,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
  PAYMENT_FAILED: { icon: X, iconBg: "#fef2f2", iconColor: "#dc2626" },
  ESCROW_FUNDED: { icon: ShieldCheck, iconBg: "#f0fdf4", iconColor: "#16a34a" },
  ESCROW_RELEASED: {
    icon: ShieldCheck,
    iconBg: "#dcfce7",
    iconColor: "#166534",
  },
  ORDER_SHIPPED: { icon: Truck, iconBg: "#fffbeb", iconColor: "#d97706" },
  ORDER_PICKED_UP: { icon: Truck, iconBg: "#fff7ed", iconColor: "#c2410c" },
  ORDER_DELIVERED: {
    icon: CheckCircle,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
  ORDER_COMPLETED: {
    icon: CheckCheck,
    iconBg: "#dcfce7",
    iconColor: "#166534",
  },
  ORDER_CANCELLED: { icon: X, iconBg: "#fef2f2", iconColor: "#dc2626" },
  ORDER_DISPUTED: {
    icon: AlertTriangle,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
  },
  DISPUTE_RESOLVED: {
    icon: ShieldCheck,
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
  },
  REFUND_ISSUED: { icon: CreditCard, iconBg: "#faf5ff", iconColor: "#9333ea" },
  NEW_MESSAGE: { icon: MessageCircle, iconBg: "#eff6ff", iconColor: "#2563eb" },
};

const DEFAULT_META = {
  icon: Bell,
  iconBg: "#f9fafb",
  iconColor: "#6b7280",
};

// ── Skeleton row ─────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px 20px",
        borderBottom: "1px solid #f9fafb",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "#f3f4f6",
          flexShrink: 0,
          animation: "pulse 1.5s ease infinite",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "7px",
        }}
      >
        <div
          style={{
            height: "13px",
            background: "#f3f4f6",
            borderRadius: "5px",
            width: "40%",
            animation: "pulse 1.5s ease infinite",
          }}
        />
        <div
          style={{
            height: "11px",
            background: "#f3f4f6",
            borderRadius: "5px",
            width: "72%",
            animation: "pulse 1.5s ease infinite",
          }}
        />
        <div
          style={{
            height: "10px",
            background: "#f3f4f6",
            borderRadius: "5px",
            width: "28%",
            animation: "pulse 1.5s ease infinite",
          }}
        />
      </div>
    </div>
  );
}

// ── Single row ────────────────────────────────────────────────────
function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const meta = TYPE_META[notification.type] ?? DEFAULT_META;
  const Icon = meta.icon;

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={
        notification.isRead
          ? notification.title
          : `Unread: ${notification.title}`
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px 20px",
        background: !notification.isRead ? "#f0fdf4" : "white",
        borderBottom: "1px solid #f3f4f6",
        cursor: !notification.isRead ? "pointer" : "default",
        transition: "background 0.15s",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: meta.iconBg,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={meta.iconColor} aria-hidden="true" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "3px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: !notification.isRead ? 700 : 500,
              color: "#111827",
              lineHeight: 1.4,
            }}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <div
              aria-label="Unread"
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
                marginTop: "4px",
              }}
            />
          )}
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "#6b7280",
            lineHeight: 1.5,
            marginBottom: "6px",
          }}
        >
          {notification.body}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <time
            dateTime={notification.createdAt}
            style={{ fontSize: "11px", color: "#9ca3af" }}
          >
            {new Date(notification.createdAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {notification.orderId && (
              <Link
                href={`/dashboard/orders/${notification.orderId}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#16a34a",
                  textDecoration: "none",
                }}
              >
                View Order →
              </Link>
            )}
            {!notification.isRead && (
              <button
                type="button"
                aria-label="Mark as read"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#9ca3af",
                  padding: 0,
                }}
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    total,
    isLoading,
    error,
    refetch,
    markRead,
    markAllRead,
  } = useNotifications({ limit: 50 });

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div>
        <h1 className="text-2xl font-bold text-olive-900">Notifications</h1>
        <p className="text-sm text-olive-500 mt-1">
          {total} total · {unreadCount} unread
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          aria-label="Refresh notifications"
          onClick={() => void refetch()}
          className="clay-inset flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-olive-600 rounded-xl"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="clay-inset flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-olive-600 rounded-xl"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>
    </div>
  );

  const body = () => {
    if (isLoading) {
      return (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            border: "1px solid #f3f4f6",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="clay-card text-center py-12">
          <AlertTriangle size={36} className="text-red-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-red-600 mb-1">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="clay-btn mt-3 px-4 py-2 text-xs"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="clay-card text-center py-16">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background:
                "linear-gradient(145deg, var(--color-cream-200), var(--color-cream-300))",
              boxShadow:
                "inset 3px 3px 7px rgba(42,53,18,0.08), inset -2px -2px 5px rgba(255,255,255,0.7)",
            }}
          >
            <BellOff size={28} className="text-olive-300" />
          </div>
          <p className="text-base font-semibold text-olive-700 mb-1">
            No notifications yet
          </p>
          <p className="text-sm text-olive-400 max-w-xs mx-auto">
            Order updates, payment confirmations, and dispute alerts will appear
            here.
          </p>
        </div>
      );
    }

    return (
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          border: "1px solid #f3f4f6",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {notifications.map((n) => (
          <NotificationRow key={n.id} notification={n} onMarkRead={markRead} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* ── MOBILE ─────────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen px-4 pt-5 pb-8 space-y-4">
        {header}
        {body()}
      </div>

      {/* ── DESKTOP ─────────────────────────────────────────────── */}
      <div className="hidden lg:block p-6 space-y-5">
        {header}
        {body()}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </>
  );
}
