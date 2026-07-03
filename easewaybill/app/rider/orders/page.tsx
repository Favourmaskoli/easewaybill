"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  Package,
  Search,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Navigation,
} from "lucide-react";
import { useRiderOrders } from "@/lib/hooks/useRiderOrders";
import { ordersApi } from "@/lib/api/orders.api";
import { formatNaira } from "@/lib/utils/format";
import type { Order } from "@/lib/types/api.types";

// ================================================================
// TYPES
// ================================================================

interface RiderAction {
  label: string;
  nextStatus: string;
  color: string;
  bg: string;
  border: string;
}

// ================================================================
// CONSTANTS
// ================================================================

const STATUS_FILTERS = [
  { value: "All", label: "All" },
  { value: "SHIPPED", label: "Assigned" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
];

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  SHIPPED:     { label: "Assigned",    bg: "#fef3c7", color: "#92400e" },
  IN_TRANSIT:  { label: "In Transit",  bg: "#dbeafe", color: "#1e40af" },
  DELIVERED:   { label: "Delivered",   bg: "#dcfce7", color: "#166534" },
};

// Maps current status → the action the rider should take next
function getRiderAction(status: string): RiderAction | null {
  switch (status) {
    case "SHIPPED":
      return {
        label: "Mark as Picked Up",
        nextStatus: "IN_TRANSIT",
        color: "#92400e",
        bg: "#fffbeb",
        border: "#fde68a",
      };
    case "IN_TRANSIT":
      return {
        label: "Mark as Delivered",
        nextStatus: "DELIVERED",
        color: "#166534",
        bg: "#f0fdf4",
        border: "#bbf7d0",
      };
    default:
      return null;
  }
}

// ================================================================
// SUB-COMPONENT: RiderStatusBadge
// ================================================================

function RiderStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: "9999px",
        background: meta.bg,
        color: meta.color,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

// ================================================================
// SUB-COMPONENT: RiderStatsCards
// ================================================================

function RiderStatsCards({
  total,
  inTransit,
  outForDelivery,
  delivered,
}: {
  total: number;
  inTransit: number;
  outForDelivery: number;
  delivered: number;
}) {
  const cards = [
    {
      label: "Total Assigned",
      value: total,
      icon: Package,
      bg: "#f3f4f6",
      color: "#374151",
      iconBg: "#e5e7eb",
    },
    {
      label: "In Transit",
      value: inTransit,
      icon: Truck,
      bg: "#eff6ff",
      color: "#1d4ed8",
      iconBg: "#dbeafe",
    },
    {
      label: "Awaiting Pickup",
      value: outForDelivery,
      icon: Clock,
      bg: "#fffbeb",
      color: "#b45309",
      iconBg: "#fef3c7",
    },
    {
      label: "Delivered",
      value: delivered,
      icon: CheckCircle,
      bg: "#f0fdf4",
      color: "#15803d",
      iconBg: "#dcfce7",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: card.bg,
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9px",
              background: card.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <card.icon size={18} color={card.color} />
          </div>
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: card.color,
              lineHeight: 1,
            }}
          >
            {card.value}
          </p>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: card.color,
              opacity: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: RiderEmptyState
// ================================================================

function RiderEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div
      style={{
        padding: "60px 24px",
        textAlign: "center",
        background: "white",
        borderRadius: "16px",
        border: "1px solid #f3f4f6",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          background: "#fef3c7",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <Truck size={30} color="#d97706" />
      </div>
      <p
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "#111827",
          marginBottom: "6px",
        }}
      >
        {filtered ? "No orders match your filter" : "No deliveries assigned yet"}
      </p>
      <p style={{ fontSize: "13px", color: "#9ca3af", maxWidth: "280px", margin: "0 auto" }}>
        {filtered
          ? "Try changing your filter or search term."
          : "You don't have any assigned deliveries yet. Check back when an admin assigns an order to you."}
      </p>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: RiderOrderCard (mobile)
// ================================================================

function RiderOrderCard({
  order,
  onAction,
  acting,
}: {
  order: Order;
  onAction: (orderId: string, status: string) => Promise<void>;
  acting: boolean;
}) {
  const action = getRiderAction(order.status);

  return (
    <div
      style={{
        background: "white",
        borderRadius: "14px",
        border: "1px solid #f3f4f6",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        padding: "16px",
        marginBottom: "10px",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "3px",
            }}
          >
            {order.trackingCode}
          </p>
          <p style={{ fontSize: "11px", color: "#9ca3af" }}>
            {new Date(order.createdAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <RiderStatusBadge status={order.status} />
      </div>

      {/* Addresses */}
      <div
        style={{
          background: "#f9fafb",
          borderRadius: "10px",
          padding: "10px 12px",
          marginBottom: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <MapPin size={12} color="#22c55e" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pickup
            </p>
            <p style={{ fontSize: "12px", color: "#374151" }}>{order.pickupAddress}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <Navigation size={12} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Delivery
            </p>
            <p style={{ fontSize: "12px", color: "#374151" }}>{order.deliveryAddress}</p>
          </div>
        </div>
      </div>

      {/* Buyer / Amount */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div>
          <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>
            Buyer
          </p>
          <p style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>
            {order.buyer
              ? `${order.buyer.firstName} ${order.buyer.lastName}`
              : order.buyerName ?? "—"}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>
            Delivery Fee
          </p>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>
            {formatNaira(order.deliveryFee ?? "0")}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px" }}>
        <Link
          href={`/dashboard/orders/${order.id}`}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            padding: "9px",
            borderRadius: "9px",
            border: "1px solid #e5e7eb",
            background: "white",
            color: "#6b7280",
            fontSize: "12px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View Details
        </Link>

        {action && order.status !== "DELIVERED" && (
          <button
            onClick={() => onAction(order.id, action.nextStatus)}
            disabled={acting}
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "9px",
              borderRadius: "9px",
              border: `1px solid ${action.border}`,
              background: action.bg,
              color: action.color,
              fontSize: "12px",
              fontWeight: 700,
              cursor: acting ? "not-allowed" : "pointer",
              opacity: acting ? 0.6 : 1,
            }}
          >
            <Truck size={13} />
            {acting ? "Updating..." : action.label}
          </button>
        )}

        {order.status === "DELIVERED" && (
          <div
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "9px",
              borderRadius: "9px",
              background: "#f0fdf4",
              color: "#166534",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <CheckCircle size={13} />
            Delivery Completed
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: Skeleton loader
// ================================================================

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} style={{ padding: "14px 20px" }}>
          <div
            style={{
              height: "14px",
              borderRadius: "6px",
              background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              width: i === 1 ? "80px" : i === 2 ? "120px" : "60px",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ================================================================
// MAIN PAGE
// ================================================================

export default function RiderOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actingOrderId, setActingOrderId] = useState<string | null>(null);

  const { orders, stats, isLoading, error, refetch } = useRiderOrders({
    status: statusFilter === "All" ? undefined : statusFilter,
    search: search || undefined,
  });

  const handleAction = useCallback(
    async (orderId: string, nextStatus: string) => {
      setActingOrderId(orderId);
      try {
        await ordersApi.updateStatus(orderId, nextStatus);
        await refetch();
      } catch (err: unknown) {
        console.error("Failed to update status:", err);
      } finally {
        setActingOrderId(null);
      }
    },
    [refetch],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "#f59e0b",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Truck size={19} color="white" />
            </div>
            <h1
              style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}
            >
              My Deliveries
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            {stats.total} order{stats.total !== 1 ? "s" : ""} assigned to you
          </p>
        </div>

        <button
          onClick={() => refetch()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            background: "white",
            color: "#6b7280",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <RiderStatsCards
        total={stats.total}
        inTransit={stats.inTransit}
        outForDelivery={stats.outForDelivery}
        delivered={stats.delivered}
      />

      {/* ── Search + Filters ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            width: "280px",
          }}
        >
          <Search size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Search by tracking, buyer, address..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchInput);
            }}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "13px",
              color: "#111827",
              width: "100%",
            }}
          />
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: "7px 16px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                border:
                  statusFilter === f.value ? "none" : "1px solid #e5e7eb",
                background: statusFilter === f.value ? "#f59e0b" : "white",
                color: statusFilter === f.value ? "white" : "#4b5563",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error State ───────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "13px", color: "#dc2626" }}>{error}</p>
          <button
            onClick={() => refetch()}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
              background: "white",
              color: "#dc2626",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── MOBILE: Cards ─────────────────────────────────────────── */}
      <div className="lg:hidden">
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: "14px",
                  padding: "16px",
                  height: "180px",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <RiderEmptyState filtered={statusFilter !== "All" || !!search} />
        ) : (
          <div>
            {orders.map((order) => (
              <RiderOrderCard
                key={order.id}
                order={order}
                onAction={handleAction}
                acting={actingOrderId === order.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: Table ────────────────────────────────────────── */}
      <div
        className="hidden lg:block"
        style={{
          background: "white",
          borderRadius: "16px",
          border: "1px solid #f3f4f6",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  {["Tracking", "Status", "Buyer", "Pickup", "Delivery", "Fee", "Actions"].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: "left",
                        padding: "12px 20px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : orders.length === 0 ? (
          <RiderEmptyState filtered={statusFilter !== "All" || !!search} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  {["Tracking", "Status", "Buyer", "Pickup", "Delivery", "Fee", "Actions"].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: "left",
                        padding: "12px 20px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => {
                  const action = getRiderAction(order.status);
                  const isActing = actingOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom:
                          idx !== orders.length - 1
                            ? "1px solid #f9fafb"
                            : "none",
                      }}
                    >
                      {/* Tracking */}
                      <td style={{ padding: "14px 20px" }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {order.trackingCode}
                        </p>
                        <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-NG",
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 20px" }}>
                        <RiderStatusBadge status={order.status} />
                      </td>

                      {/* Buyer */}
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>
                          {order.buyer
                            ? `${order.buyer.firstName} ${order.buyer.lastName}`
                            : order.buyerName ?? "—"}
                        </p>
                        {order.buyer?.phone && (
                          <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                            {order.buyer.phone}
                          </p>
                        )}
                      </td>

                      {/* Pickup */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                          <MapPin size={12} color="#22c55e" style={{ flexShrink: 0, marginTop: "2px" }} />
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#374151",
                              maxWidth: "160px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {order.pickupAddress}
                          </p>
                        </div>
                      </td>

                      {/* Delivery */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                          <Navigation size={12} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#374151",
                              maxWidth: "160px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {order.deliveryAddress}
                          </p>
                        </div>
                      </td>

                      {/* Fee */}
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>
                          {formatNaira(order.deliveryFee ?? "0")}
                        </p>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              background: "white",
                              color: "#6b7280",
                              fontSize: "11px",
                              fontWeight: 600,
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <ChevronRight size={12} />
                            View
                          </Link>

                          {action && (
                            <button
                              onClick={() =>
                                handleAction(order.id, action.nextStatus)
                              }
                              disabled={isActing}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: `1px solid ${action.border}`,
                                background: action.bg,
                                color: action.color,
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: isActing ? "not-allowed" : "pointer",
                                opacity: isActing ? 0.6 : 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isActing ? (
                                <>
                                  <div
                                    style={{
                                      width: "10px",
                                      height: "10px",
                                      border: "2px solid currentColor",
                                      borderTopColor: "transparent",
                                      borderRadius: "50%",
                                      animation: "spin 1s linear infinite",
                                    }}
                                  />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Truck size={11} />
                                  {action.label}
                                </>
                              )}
                            </button>
                          )}

                          {order.status === "DELIVERED" && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                background: "#f0fdf4",
                                color: "#166534",
                                fontSize: "11px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <CheckCircle size={11} />
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}