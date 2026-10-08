"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Package,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { Notification } from "@/lib/types/api.types";

const TYPE_ICON: Record<string, React.ElementType> = {
  ORDER_SENT_TO_BUYER: Package,
  ORDER_CREATED: Package,
  ORDER_CONFIRMED: CheckCircle,
  ORDER_PAID: CreditCard,
  PAYMENT_SUCCESS: CreditCard,
  PAYMENT_FAILED: X,
  ESCROW_FUNDED: ShieldCheck,
  ESCROW_RELEASED: ShieldCheck,
  ORDER_SHIPPED: Truck,
  ORDER_PICKED_UP: Truck,
  ORDER_DELIVERED: CheckCircle,
  ORDER_COMPLETED: CheckCheck,
  ORDER_CANCELLED: X,
  ORDER_DISPUTED: AlertTriangle,
  DISPUTE_RESOLVED: ShieldCheck,
  REFUND_ISSUED: CreditCard,
  NEW_MESSAGE: MessageCircle,
};

const TYPE_COLOR: Record<string, string> = {
  ORDER_SENT_TO_BUYER: "#2563eb",
  ORDER_CREATED: "#16a34a",
  ORDER_CONFIRMED: "#2563eb",
  ORDER_PAID: "#16a34a",
  PAYMENT_SUCCESS: "#16a34a",
  PAYMENT_FAILED: "#dc2626",
  ESCROW_FUNDED: "#16a34a",
  ESCROW_RELEASED: "#166534",
  ORDER_SHIPPED: "#d97706",
  ORDER_PICKED_UP: "#c2410c",
  ORDER_DELIVERED: "#16a34a",
  ORDER_COMPLETED: "#166534",
  ORDER_CANCELLED: "#dc2626",
  ORDER_DISPUTED: "#dc2626",
  DISPUTE_RESOLVED: "#2563eb",
  REFUND_ISSUED: "#9333ea",
  NEW_MESSAGE: "#2563eb",
};

interface DropdownRowProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClose: () => void;
}

function DropdownRow({ notification, onRead, onClose }: DropdownRowProps) {
  const Icon = TYPE_ICON[notification.type] ?? Bell;
  const color = TYPE_COLOR[notification.type] ?? "#6b7280";

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
    if (notification.orderId) onClose();
  };

  const inner = (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 16px",
        cursor: "pointer",
        background: !notification.isRead ? "#f0fdf4" : "white",
        borderBottom: "1px solid #f3f4f6",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          !notification.isRead ? "#dcfce7" : "#f9fafb";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          !notification.isRead ? "#f0fdf4" : "white";
      }}
    >
      {/* Dot */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: !notification.isRead ? color : "#e5e7eb",
          flexShrink: 0,
          marginTop: "5px",
        }}
      />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: !notification.isRead ? 700 : 500,
            color: "#111827",
            marginBottom: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {notification.title}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "#6b7280",
            lineHeight: 1.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {notification.body}
        </p>
        <time
          dateTime={notification.createdAt}
          style={{
            fontSize: "10px",
            color: "#9ca3af",
            marginTop: "3px",
            display: "block",
          }}
        >
          {new Date(notification.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>

      {/* Type icon pill */}
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "7px",
          background: "#f3f4f6",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={13} color={color} aria-hidden="true" />
      </div>
    </div>
  );

  if (notification.orderId) {
    return (
      <Link
        href={`/dashboard/orders/${notification.orderId}`}
        onClick={onClose}
        style={{ textDecoration: "none", display: "block" }}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    refetch,
  } = useNotifications({ limit: 10 });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((v) => {
      if (!v) void refetch();
      return !v;
    });
  }, [refetch]);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={handleToggle}
        style={{
          position: "relative",
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          background: open
            ? "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))"
            : "linear-gradient(145deg, var(--color-cream-200), var(--color-cream-300))",
          boxShadow: open
            ? "inset 3px 3px 7px rgba(23,29,9,0.25), inset -1px -1px 4px rgba(114,143,50,0.15)"
            : "4px 4px 10px rgba(23,29,9,0.18), -2px -2px 6px rgba(162,191,114,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell size={18} color={open ? "white" : "var(--color-olive-600)"} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "white",
              fontSize: "9px",
              fontWeight: 700,
              minWidth: "16px",
              height: "16px",
              borderRadius: "8px",
              padding: "0 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            zIndex: 50,
            width: "340px",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #f3f4f6",
              background: "linear-gradient(145deg, #f9fafb, #f3f4f6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={14} color="#374151" aria-hidden="true" />
              <span
                style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: "9999px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                aria-label="Mark all notifications as read"
                onClick={() => void markAllRead()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  cursor: "pointer",
                }}
              >
                <CheckCheck size={12} aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {/* Items */}
          <div role="list" style={{ maxHeight: "380px", overflowY: "auto" }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "12px 16px",
                    borderBottom: "1px solid #f9fafb",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      background: "#e5e7eb",
                      borderRadius: "50%",
                      marginTop: "5px",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        height: "11px",
                        background: "#f3f4f6",
                        borderRadius: "4px",
                        width: "55%",
                      }}
                    />
                    <div
                      style={{
                        height: "10px",
                        background: "#f3f4f6",
                        borderRadius: "4px",
                        width: "80%",
                      }}
                    />
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div style={{ padding: "36px 16px", textAlign: "center" }}>
                <BellOff
                  size={32}
                  color="#d1d5db"
                  style={{ margin: "0 auto 8px" }}
                />
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div role="listitem" key={n.id}>
                  <DropdownRow
                    notification={n}
                    onRead={markRead}
                    onClose={() => setOpen(false)}
                  />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid #f3f4f6",
              padding: "10px 16px",
              background: "#f9fafb",
            }}
          >
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                textAlign: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                textDecoration: "none",
              }}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
