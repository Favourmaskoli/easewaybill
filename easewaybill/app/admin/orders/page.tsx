"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Truck,
  ExternalLink,
  X,
  CheckCircle,
  User,
} from "lucide-react";
import { ordersApi } from "@/lib/api/orders.api";
import { adminApi } from "@/lib/api/admin.api";
import type { AdminUser } from "@/lib/api/admin.api";
import type { Order } from "@/lib/types/api.types";
import { formatNaira } from "@/lib/utils/format";

// ── Status filter pills ─────────────────────────────────────────────
const statusFilters = [
  "All",
  "PENDING_BUYER",
  "AWAITING_PAYMENT",
  "PAID",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
];

const statusMeta: Record<string, { bg: string; color: string; label: string }> = {
  PENDING_BUYER:    { bg: "#f3e8ff", color: "#7e22ce", label: "Pending Buyer" },
  AWAITING_PAYMENT: { bg: "#fef3c7", color: "#92400e", label: "Awaiting Payment" },
  PAID:             { bg: "#dbeafe", color: "#1e40af", label: "Paid" },
  SHIPPED:          { bg: "#fef9c3", color: "#854d0e", label: "Shipped" },
  IN_TRANSIT:       { bg: "#ffedd5", color: "#9a3412", label: "In Transit" },
  DELIVERED:        { bg: "#ccfbf1", color: "#115e59", label: "Delivered" },
  COMPLETED:        { bg: "#dcfce7", color: "#166534", label: "Completed" },
  DISPUTED:         { bg: "#fee2e2", color: "#991b1b", label: "Disputed" },
  CANCELLED:        { bg: "#f3f4f6", color: "#374151", label: "Cancelled" },
  REFUNDED:         { bg: "#fee2e2", color: "#991b1b", label: "Refunded" },
};

// ── Assign Rider Modal ──────────────────────────────────────────────
function AssignRiderModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [riders, setRiders] = useState<AdminUser[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(true);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadRiders = async () => {
      setLoadingRiders(true);
      try {
        const result = await adminApi.getUsers({ role: "RIDER", limit: 100 });
        if (!cancelled) setRiders(result.data.filter((r) => r.isActive));
      } catch {
        if (!cancelled) setError("Failed to load riders");
      } finally {
        if (!cancelled) setLoadingRiders(false);
      }
    };
    void loadRiders();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAssign = async () => {
    if (!selectedRiderId) {
      setError("Please select a rider");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.assignRider(order.id, selectedRiderId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to assign rider",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
              Assign Rider
            </h2>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
              {order.trackingCode}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "18px",
              padding: "12px",
              background: "#fffbeb",
              borderRadius: "10px",
            }}
          >
            <Truck size={16} color="#d97706" style={{ flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "12px", color: "#92400e", lineHeight: 1.5 }}>
              Order is <strong>SHIPPED</strong>. Select an active rider to move it to{" "}
              <strong>IN_TRANSIT</strong> once they pick up the goods.
            </p>
          </div>

          {loadingRiders ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  border: "4px solid #ef4444",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 10px",
                }}
              />
              <p style={{ fontSize: "12px", color: "#9ca3af" }}>Loading riders...</p>
            </div>
          ) : riders.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <User size={32} color="#d1d5db" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                No active riders available. Create one from the Users page.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto" }}>
              {riders.map((rider) => {
                const selected = selectedRiderId === rider.id;
                return (
                  <button
                    key={rider.id}
                    onClick={() => setSelectedRiderId(rider.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: selected ? "2px solid #ef4444" : "1px solid #e5e7eb",
                      background: selected ? "#fef2f2" : "white",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#fef3c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#d97706",
                        flexShrink: 0,
                      }}
                    >
                      {rider.firstName.charAt(0)}
                      {rider.lastName.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                        {rider.firstName} {rider.lastName}
                      </p>
                      <p style={{ fontSize: "11px", color: "#9ca3af" }}>{rider.email}</p>
                    </div>
                    {selected && <CheckCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "12px",
                borderRadius: "8px",
                padding: "10px 12px",
                marginTop: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "18px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "11px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                border: "1px solid #e5e7eb",
                background: "white",
                color: "#4b5563",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={submitting || !selectedRiderId || riders.length === 0}
              style={{
                padding: "11px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                background: "#ef4444",
                color: "white",
                cursor: submitting || !selectedRiderId ? "not-allowed" : "pointer",
                opacity: submitting || !selectedRiderId || riders.length === 0 ? 0.6 : 1,
              }}
            >
              {submitting ? "Assigning..." : "Assign Rider"}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Order Row ─────────────────────────────────────────────────────
function OrderRow({
  order,
  onAssignClick,
}: {
  order: Order;
  onAssignClick: (order: Order) => void;
}) {
  const meta = statusMeta[order.status] ?? { bg: "#f3f4f6", color: "#374151", label: order.status };

  return (
    <tr style={{ borderBottom: "1px solid #f9fafb" }}>
      <td style={{ padding: "14px 20px" }}>
        <Link
          href={`/dashboard/orders/${order.id}`}
          style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", textDecoration: "none" }}
        >
          {order.trackingCode}
        </Link>
      </td>
      <td style={{ padding: "14px 20px" }}>
        <p style={{ fontSize: "13px", color: "#374151", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.description}
        </p>
      </td>
      <td style={{ padding: "14px 20px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>
          {formatNaira(order.totalAmount)}
        </span>
      </td>
      <td style={{ padding: "14px 20px" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "9999px",
            background: meta.bg,
            color: meta.color,
          }}
        >
          {meta.label}
        </span>
      </td>
      <td style={{ padding: "14px 20px" }}>
        {order.rider ? (
          <span style={{ fontSize: "12px", color: "#4b5563" }}>
            {order.rider.firstName} {order.rider.lastName}
          </span>
        ) : (
          <span style={{ fontSize: "12px", color: "#d1d5db" }}>—</span>
        )}
      </td>
      <td style={{ padding: "14px 20px" }}>
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
          {new Date(order.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </td>
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {order.status === "SHIPPED" && !order.riderId && (
            <button
              onClick={() => onAssignClick(order)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                border: "1px solid #fde68a",
                background: "#fffbeb",
                color: "#92400e",
                cursor: "pointer",
              }}
            >
              <Truck size={12} />
              Assign Rider
            </button>
          )}
          <Link
            href={`/dashboard/orders/${order.id}`}
            style={{
              display: "flex",
              padding: "6px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              color: "#6b7280",
            }}
          >
            <ExternalLink size={13} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await ordersApi.list({
          status: statusFilter === "All" ? undefined : statusFilter,
          search: search || undefined,
          limit: 50,
        });
        if (!cancelled) {
          setOrders(result.data);
          setTotal(result.meta?.total ?? result.data.length);
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, search, fetchKey]);

  const shippedAwaitingRider = orders.filter(
    (o) => o.status === "SHIPPED" && !o.riderId,
  ).length;

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>Orders</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "2px" }}>
          {total} total orders
        </p>
      </div>

      {/* Rider assignment banner */}
      {shippedAwaitingRider > 0 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Truck size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: "12px", color: "#92400e" }}>
            <strong>{shippedAwaitingRider}</strong> shipped order
            {shippedAwaitingRider === 1 ? "" : "s"} waiting for a rider assignment.
          </p>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            width: "260px",
          }}
        >
          <Search size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Search tracking code or buyer email..."
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

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "7px 14px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                border: statusFilter === s ? "none" : "1px solid #e5e7eb",
                background: statusFilter === s ? "#111827" : "white",
                color: statusFilter === s ? "white" : "#4b5563",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {s === "All" ? "All" : (statusMeta[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          border: "1px solid #f3f4f6",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "4px solid #ef4444",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: "#9ca3af", fontSize: "13px" }}>Loading orders...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  {["Tracking", "Description", "Amount", "Status", "Rider", "Date", "Action"].map((col) => (
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
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onAssignClick={setAssigningOrder}
                  />
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div style={{ padding: "60px", textAlign: "center" }}>
                <Package size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "#9ca3af", fontSize: "13px" }}>No orders found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Rider Modal */}
      {assigningOrder && (
        <AssignRiderModal
          order={assigningOrder}
          onClose={() => setAssigningOrder(null)}
          onSuccess={refetch}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}