"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Search,
  ArrowRight,
  Navigation,
} from "lucide-react";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { useOrders } from "@/lib/hooks/useOrders";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatNaira } from "@/lib/utils/format";
import type { Order } from "@/lib/types/api.types";

// ── Helpers ───────────────────────────────────────────────────

type ShipmentStatus = "In Transit" | "Delivered" | "Processing" | "Pending";

function getShipmentStatus(order: Order): ShipmentStatus {
  const map: Record<string, ShipmentStatus> = {
    SHIPPED: "Processing",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    COMPLETED: "Delivered",
  };
  return map[order.status] ?? "Pending";
}

function getProgress(order: Order): number {
  const map: Record<string, number> = {
    PAID: 5,
    SHIPPED: 20,
    IN_TRANSIT: 60,
    DELIVERED: 90,
    COMPLETED: 100,
  };
  return map[order.status] ?? 0;
}

function getStatusConfig(status: ShipmentStatus): {
  colorClass: string;
  barColor: string;
} {
  const map: Record<ShipmentStatus, { colorClass: string; barColor: string }> =
    {
      "In Transit": {
        colorClass: "bg-amber-100 text-amber-800",
        barColor: "linear-gradient(90deg, #fbbf24, #d97706)",
      },
      Delivered: {
        colorClass: "bg-green-100 text-green-800",
        barColor:
          "linear-gradient(90deg, var(--color-olive-400), var(--color-olive-600))",
      },
      Processing: {
        colorClass: "bg-blue-100 text-blue-800",
        barColor: "linear-gradient(90deg, #60a5fa, #3b82f6)",
      },
      Pending: {
        colorClass: "bg-yellow-100 text-yellow-800",
        barColor: "linear-gradient(90deg, #fde047, #eab308)",
      },
    };
  return map[status];
}

// Filter tabs
const filterTabs = ["All", "Processing", "In Transit", "Delivered"];

const filterMap: Record<string, string[]> = {
  All: ["SHIPPED", "IN_TRANSIT", "DELIVERED", "COMPLETED"],
  Processing: ["SHIPPED"],
  "In Transit": ["IN_TRANSIT"],
  Delivered: ["DELIVERED", "COMPLETED"],
};

// ================================================================
// SUB-COMPONENTS — outside main to prevent remount
// ================================================================

function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const config = getStatusConfig(status);
  return <span className={`clay-badge ${config.colorClass}`}>{status}</span>;
}

function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: ShipmentStatus;
}) {
  const config = getStatusConfig(status);
  return (
    <div className="clay-inset h-2.5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${progress}%`,
          background: config.barColor,
        }}
      />
    </div>
  );
}

function MobileShipmentCard({ order }: { order: Order }) {
  const status = getShipmentStatus(order);
  const progress = getProgress(order);
  const waybillNumber = order.waybills?.[0]?.waybillNumber ?? null;

  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className="clay-card space-y-3 block active:scale-[0.98] transition-transform"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background:
                status === "Delivered"
                  ? "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))"
                  : "linear-gradient(145deg, #fbbf24, #d97706)",
              boxShadow:
                "3px 3px 8px rgba(23,29,9,0.18), -1px -1px 4px rgba(114,143,50,0.14)",
            }}
          >
            {status === "Delivered" ? (
              <CheckCircle size={16} className="text-white" />
            ) : (
              <Truck size={16} className="text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-olive-900">
              {order.description}
            </p>
            <p className="text-[11px] text-olive-400">
              {order.trackingCode}
              {waybillNumber && ` · ${waybillNumber}`}
            </p>
          </div>
        </div>
        <ShipmentStatusBadge status={status} />
      </div>

      {/* Route */}
      <div className="clay-inset px-3 py-2.5 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-olive-700">
          <MapPin size={13} className="text-olive-500 shrink-0" />
          <span className="font-medium truncate">{order.pickupAddress}</span>
          <div className="flex-1 border-t border-dashed border-olive-300" />
          <ArrowRight size={13} className="text-olive-400 shrink-0" />
          <span className="font-medium truncate">{order.deliveryAddress}</span>
          <MapPin size={13} className="text-olive-600 shrink-0" />
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-olive-600">
            {formatNaira(order.totalAmount)}
          </span>
          <span className="text-xs font-bold text-olive-700">{progress}%</span>
        </div>
        <ProgressBar progress={progress} status={status} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-olive-400" />
          <span className="text-xs text-olive-500">
            {new Date(order.createdAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        {waybillNumber && (
          <span className="text-xs font-mono text-olive-500">
            {waybillNumber}
          </span>
        )}
      </div>
    </Link>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function ShipmentsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all orders and filter to shipment-relevant statuses
  const { orders, isLoading } = useOrders({ limit: 100 });

  // Only show orders in shipping stages that belong to this user
  const shipmentOrders = orders.filter(
    (o) =>
      ["SHIPPED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(o.status) &&
      (o.sellerId === user?.id || o.buyerId === user?.id),
  );

  // Apply filter tab
  const statusFilter = filterMap[activeFilter] ?? [];
  const filtered = shipmentOrders.filter((o) => {
    const matchFilter = statusFilter.includes(o.status);
    const matchSearch =
      o.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.waybills?.[0]?.waybillNumber ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Counts
  const inTransitCount = shipmentOrders.filter(
    (o) => o.status === "IN_TRANSIT",
  ).length;
  const deliveredCount = shipmentOrders.filter((o) =>
    ["DELIVERED", "COMPLETED"].includes(o.status),
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── MOBILE VIEW ──────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader title="Shipments" showBack={false} />

        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* Summary pills */}
          <div className="grid grid-cols-2 gap-3">
            <div className="clay-card !p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(145deg, #fbbf24, #d97706)",
                }}
              >
                <Truck size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-olive-900">
                  {inTransitCount}
                </p>
                <p className="text-[11px] text-olive-500">In Transit</p>
              </div>
            </div>
            <div className="clay-card !p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                }}
              >
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-olive-900">
                  {deliveredCount}
                </p>
                <p className="text-[11px] text-olive-500">Delivered</p>
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={[
                  "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                  activeFilter === tab
                    ? "clay-btn text-white"
                    : "clay-inset text-olive-600",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="clay-card py-10 text-center">
                <Truck size={38} className="text-olive-300 mx-auto mb-3" />
                <p className="text-sm text-olive-500">
                  {shipmentOrders.length === 0
                    ? "No shipments yet"
                    : "No shipments match your filter"}
                </p>
              </div>
            ) : (
              filtered.map((order) => (
                <MobileShipmentCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP VIEW ─────────────────────────────────────────── */}
      <div className="hidden lg:block p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-olive-900">
            Shipment Tracking
          </h2>
          <p className="text-sm text-olive-500 mt-1">
            {shipmentOrders.length} total shipments · {inTransitCount} in
            transit
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Total Shipments",
              value: shipmentOrders.length,
              icon: Package,
              grad: "var(--color-olive-400), var(--color-olive-600)",
            },
            {
              label: "Processing",
              value: shipmentOrders.filter((o) => o.status === "SHIPPED")
                .length,
              icon: Clock,
              grad: "#60a5fa, #3b82f6",
            },
            {
              label: "In Transit",
              value: inTransitCount,
              icon: Truck,
              grad: "#fbbf24, #d97706",
            },
            {
              label: "Delivered",
              value: deliveredCount,
              icon: CheckCircle,
              grad: "var(--color-olive-400), var(--color-olive-600)",
            },
          ].map((stat) => (
            <div key={stat.label} className="clay-card">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(145deg, ${stat.grad})`,
                    boxShadow:
                      "4px 4px 10px rgba(23,29,9,0.20), -2px -2px 6px rgba(114,143,50,0.16)",
                  }}
                >
                  <stat.icon size={18} className="text-white" />
                </div>
                <p className="text-xs font-bold text-olive-500 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
              <p className="text-2xl font-bold text-olive-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3">
          <div className="clay-inset flex items-center gap-2 px-3.5 py-2.5 w-64">
            <Search size={15} className="text-olive-400 shrink-0" />
            <input
              type="search"
              placeholder="Search by item, tracking code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-olive-800 outline-none placeholder:text-olive-400 w-full"
            />
          </div>
          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={[
                  "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                  activeFilter === tab
                    ? "clay-btn text-white"
                    : "clay-inset text-olive-600",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="clay-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-olive-50), var(--color-cream-200))",
                  }}
                >
                  {[
                    "Order",
                    "Item",
                    "Route",
                    "Progress",
                    "Amount",
                    "Status",
                    "",
                  ].map((col) => (
                    <th
                      key={col || "action"}
                      className="text-left text-[11px] font-bold text-olive-500 uppercase tracking-wider px-5 py-3.5"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, idx) => {
                  const status = getShipmentStatus(order);
                  const progress = getProgress(order);
                  const waybillNumber =
                    order.waybills?.[0]?.waybillNumber ?? null;

                  return (
                    <tr
                      key={order.id}
                      className={[
                        "hover:bg-olive-50/30 transition-colors",
                        idx !== filtered.length - 1
                          ? "border-b border-cream-300/50"
                          : "",
                      ].join(" ")}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-olive-600">
                          {order.trackingCode}
                        </p>
                        {waybillNumber && (
                          <p className="text-xs text-olive-400 font-mono mt-0.5">
                            {waybillNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-olive-800 max-w-[160px] block truncate">
                          {order.description}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-olive-600 max-w-[200px]">
                          <span className="truncate">
                            {order.pickupAddress.split(",")[0]}
                          </span>
                          <ArrowRight
                            size={13}
                            className="text-olive-400 shrink-0"
                          />
                          <span className="truncate">
                            {order.deliveryAddress.split(",")[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-28">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-xs font-semibold text-olive-600">
                              {progress}%
                            </span>
                          </div>
                          <div className="clay-inset h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${progress}%`,
                                background: getStatusConfig(status).barColor,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-olive-800">
                          {formatNaira(order.totalAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ShipmentStatusBadge status={status} />
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="clay-inset inline-flex p-2 rounded-xl text-olive-500 hover:text-olive-800 transition-colors"
                          aria-label={`View ${order.trackingCode}`}
                        >
                          <Navigation size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <Truck size={44} className="text-olive-300 mx-auto mb-3" />
                <p className="text-sm text-olive-400 mb-2">
                  {shipmentOrders.length === 0
                    ? "No shipments yet"
                    : "No shipments match your search"}
                </p>
                {shipmentOrders.length === 0 && (
                  <Link
                    href="/dashboard/orders/create"
                    className="text-sm text-green-600 font-semibold hover:underline"
                  >
                    Create your first order →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
