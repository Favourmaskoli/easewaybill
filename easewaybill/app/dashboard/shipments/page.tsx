// app/dashboard/shipments/page.tsx
// ================================================================
// SHIPMENTS / TRACKING PAGE — Deep Olive Claymorphism
// ================================================================
//
// DESKTOP (lg+):
//   Header stats row → Active shipments table → Completed list
//
// MOBILE (<lg):
//   Summary pill → Shipment cards with progress bars
//   Each card shows route, carrier, ETA, and live progress
// ================================================================

"use client";

import { useState } from "react";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  ChevronRight,
  Navigation,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";

// ── Shared components ─────────────────────────────────────────
import MobilePageHeader from "@/components/layout/MobilePageHeader";

// ================================================================
// TYPES
// ================================================================

type ShipmentStatus = "In Transit" | "Delivered" | "Processing" | "Pending";

interface Shipment {
  id: string;
  orderId: string;
  item: string;
  from: string;
  to: string;
  status: ShipmentStatus;
  /** Progress as a percentage 0–100 */
  progress: number;
  eta: string;
  carrier: string;
  trackingNumber: string;
  dispatchedDate: string;
}

// ================================================================
// MOCK DATA
// ================================================================

const shipments: Shipment[] = [
  {
    id: "SHP-001",
    orderId: "EWB-001",
    item: "iPhone 15 Pro Max",
    from: "Lagos",
    to: "Abuja",
    status: "In Transit",
    progress: 65,
    eta: "Apr 9, 2026",
    carrier: "GIG Logistics",
    trackingNumber: "GIG-28556778",
    dispatchedDate: "Apr 7, 2026",
  },
  {
    id: "SHP-002",
    orderId: "EWB-003",
    item: "MacBook Air M2",
    from: "Lagos",
    to: "Port Harcourt",
    status: "Delivered",
    progress: 100,
    eta: "Apr 5, 2026",
    carrier: "DHL Express",
    trackingNumber: "DHL-99284756",
    dispatchedDate: "Apr 3, 2026",
  },
  {
    id: "SHP-003",
    orderId: "EWB-006",
    item: "AirPods Pro 2",
    from: "Kano",
    to: "Lagos",
    status: "Processing",
    progress: 15,
    eta: "Apr 12, 2026",
    carrier: "FedEx",
    trackingNumber: "FDX-44718293",
    dispatchedDate: "Apr 7, 2026",
  },
  {
    id: "SHP-004",
    orderId: "EWB-007",
    item: "Sony Camera A7IV",
    from: "Lagos",
    to: "Ibadan",
    status: "In Transit",
    progress: 40,
    eta: "Apr 10, 2026",
    carrier: "Kwik Delivery",
    trackingNumber: "KWK-66230198",
    dispatchedDate: "Apr 6, 2026",
  },
  {
    id: "SHP-005",
    orderId: "EWB-008",
    item: "Mechanical Keyboard",
    from: "Abuja",
    to: "Lagos",
    status: "Delivered",
    progress: 100,
    eta: "Mar 30, 2026",
    carrier: "GIG Logistics",
    trackingNumber: "GIG-11203847",
    dispatchedDate: "Mar 28, 2026",
  },
];

// ================================================================
// HELPERS
// ================================================================

/**
 * Returns style config for a given shipment status.
 */
function getStatusConfig(status: ShipmentStatus): {
  label: string;
  colorClass: string;
  barColor: string;
  iconColor: string;
} {
  switch (status) {
    case "In Transit":
      return {
        label: "In Transit",
        colorClass: "bg-amber-100 text-amber-800",
        barColor: "from-amber-400 to-amber-600",
        iconColor: "text-amber-600",
      };
    case "Delivered":
      return {
        label: "Delivered",
        colorClass: "bg-olive-100 text-olive-800",
        barColor: "from-olive-400 to-olive-600",
        iconColor: "text-olive-600",
      };
    case "Processing":
      return {
        label: "Processing",
        colorClass: "bg-blue-100 text-blue-800",
        barColor: "from-blue-400 to-blue-600",
        iconColor: "text-blue-600",
      };
    case "Pending":
      return {
        label: "Pending",
        colorClass: "bg-yellow-100 text-yellow-800",
        barColor: "from-yellow-400 to-yellow-600",
        iconColor: "text-yellow-600",
      };
  }
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function ShipmentsPage() {
  // ── Active filter state ──────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<string>("All");

  // ── Search query ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── Derived counts for summary pills ────────────────────────
  const inTransitCount = shipments.filter(
    (s) => s.status === "In Transit"
  ).length;
  const deliveredCount = shipments.filter(
    (s) => s.status === "Delivered"
  ).length;

  // ── Filtered shipments ───────────────────────────────────────
  const filtered = shipments.filter((s) => {
    const matchFilter =
      activeFilter === "All" || s.status === activeFilter;
    const matchSearch =
      s.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filterTabs = ["All", "Processing", "In Transit", "Delivered"];

  return (
    <>
      {/* ============================================================
          MOBILE VIEW
          ============================================================ */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader title="Shipments" showBack={false} />

        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* ── Summary Pill Row ────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {/* In transit */}
            <div className="clay-card !p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center
                           justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(145deg, #fbbf24, #d97706)",
                  boxShadow:
                    "4px 4px 10px rgba(23,29,9,0.20)," +
                    " -2px -2px 6px rgba(251,191,36,0.18)",
                }}
              >
                <Truck size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-olive-900">
                  {inTransitCount}
                </p>
                <p className="text-[11px] text-olive-500 leading-tight">
                  In Transit
                </p>
              </div>
            </div>

            {/* Delivered */}
            <div className="clay-card !p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center
                           justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(145deg, var(--color-olive-400)," +
                    " var(--color-olive-600))",
                  boxShadow:
                    "4px 4px 10px rgba(23,29,9,0.20)," +
                    " -2px -2px 6px rgba(114,143,50,0.18)",
                }}
              >
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-olive-900">
                  {deliveredCount}
                </p>
                <p className="text-[11px] text-olive-500 leading-tight">
                  Delivered
                </p>
              </div>
            </div>
          </div>

          {/* ── Filter Tabs ─────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={[
                  "px-4 py-2 rounded-full text-xs font-semibold",
                  "whitespace-nowrap transition-all",
                  activeFilter === tab
                    ? "clay-btn text-white"
                    : "clay-inset text-olive-600",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Shipment Cards ──────────────────────────────── */}
          <div className="space-y-3">
            {filtered.map((shipment) => (
              <MobileShipmentCard
                key={shipment.id}
                shipment={shipment}
              />
            ))}

            {filtered.length === 0 && (
              <div className="clay-card py-10 text-center">
                <Truck size={38} className="text-olive-300 mx-auto mb-3" />
                <p className="text-sm text-olive-400">
                  No shipments found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          DESKTOP VIEW
          ============================================================ */}
      <div className="hidden lg:block p-6 space-y-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold text-olive-900">
            Shipment Tracking
          </h2>
          <p className="text-sm text-olive-500 mt-1">
            {shipments.length} total shipments ·{" "}
            {inTransitCount} currently in transit
          </p>
        </div>

        {/* ── Summary Stat Cards ─────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Total Shipments",
              value: shipments.length,
              icon: Package,
              grad: "var(--color-olive-400), var(--color-olive-600)",
            },
            {
              label: "Processing",
              value: shipments.filter((s) => s.status === "Processing")
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
                  className="w-10 h-10 rounded-xl flex items-center
                             justify-center shrink-0"
                  style={{
                    background: `linear-gradient(145deg, ${stat.grad})`,
                    boxShadow:
                      "4px 4px 10px rgba(23,29,9,0.20)," +
                      " -2px -2px 6px rgba(114,143,50,0.16)",
                  }}
                >
                  <stat.icon size={18} className="text-white" />
                </div>
                <p className="text-xs font-bold text-olive-500 uppercase
                              tracking-wider">
                  {stat.label}
                </p>
              </div>
              <p className="text-2xl font-bold text-olive-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ───────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="clay-inset flex items-center gap-2 px-3.5 py-2.5 w-64">
            <Search size={15} className="text-olive-400 shrink-0" />
            <input
              type="search"
              placeholder="Search shipments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-olive-800 outline-none
                         placeholder:text-olive-400 w-full"
            />
          </div>

          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={[
                  "px-4 py-2 rounded-full text-xs font-semibold",
                  "whitespace-nowrap transition-all",
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

        {/* ── Shipments Table ─────────────────────────────────── */}
        <div className="clay-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-olive-50)," +
                      " var(--color-cream-200))",
                  }}
                >
                  {[
                    "Shipment ID",
                    "Item",
                    "Route",
                    "Progress",
                    "Carrier",
                    "ETA",
                    "Status",
                    "",
                  ].map((col) => (
                    <th
                      key={col || "action"}
                      scope="col"
                      className="text-left text-[11px] font-bold
                                 text-olive-500 uppercase tracking-wider
                                 px-5 py-3.5"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((shipment, idx) => {
                  const config = getStatusConfig(shipment.status);
                  return (
                    <tr
                      key={shipment.id}
                      className={[
                        "hover:bg-olive-50/30 transition-colors",
                        idx !== filtered.length - 1
                          ? "border-b border-cream-300/50"
                          : "",
                      ].join(" ")}
                    >
                      {/* Shipment ID */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-olive-600">
                          {shipment.id}
                        </p>
                        <p className="text-xs text-olive-400 mt-0.5">
                          {shipment.orderId}
                        </p>
                      </td>

                      {/* Item */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-olive-800">
                          {shipment.item}
                        </span>
                      </td>

                      {/* Route */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm
                                        text-olive-600">
                          <span className="font-medium">{shipment.from}</span>
                          <ArrowRight
                            size={13}
                            className="text-olive-400"
                          />
                          <span className="font-medium">{shipment.to}</span>
                        </div>
                      </td>

                      {/* Progress bar */}
                      <td className="px-5 py-4">
                        <div className="w-28">
                          <div className="flex items-center justify-between
                                          mb-1.5">
                            <span className="text-xs font-semibold
                                            text-olive-600">
                              {shipment.progress}%
                            </span>
                          </div>
                          {/* Track */}
                          <div className="clay-inset h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all
                                         duration-700"
                              style={{
                                width: `${shipment.progress}%`,
                                background: `linear-gradient(90deg, ${
                                  config.barColor
                                    .replace("from-", "")
                                    .replace(" to-", ", ")
                                })`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-olive-600">
                          {shipment.carrier}
                        </span>
                      </td>

                      {/* ETA */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-olive-400" />
                          <time className="text-xs text-olive-500">
                            {shipment.eta}
                          </time>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`clay-badge ${config.colorClass}`}
                        >
                          {config.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4">
                        <button
                          className="clay-inset inline-flex p-2 rounded-xl
                                     text-olive-500 hover:text-olive-800
                                     transition-colors"
                          aria-label={`Track ${shipment.id}`}
                        >
                          <Navigation size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <Truck size={44} className="text-olive-300 mx-auto mb-3" />
                <p className="text-sm text-olive-400">
                  No shipments match your search
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ================================================================
// SUB-COMPONENT: MobileShipmentCard
// ================================================================
// A single shipment card for the mobile list view.
// Shows item, route, progress bar, carrier, and ETA.
// ================================================================

interface MobileShipmentCardProps {
  shipment: Shipment;
}

function MobileShipmentCard({ shipment }: MobileShipmentCardProps) {
  const config = getStatusConfig(shipment.status);

  return (
    <div className="clay-card space-y-3">
      {/* ── Header row ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center
                       justify-center shrink-0"
            style={{
              background:
                shipment.status === "Delivered"
                  ? "linear-gradient(145deg, var(--color-olive-400)," +
                    " var(--color-olive-600))"
                  : "linear-gradient(145deg, #fbbf24, #d97706)",
              boxShadow:
                "3px 3px 8px rgba(23,29,9,0.18)," +
                " -1px -1px 4px rgba(114,143,50,0.14)",
            }}
          >
            {shipment.status === "Delivered" ? (
              <CheckCircle size={16} className="text-white" />
            ) : (
              <Truck size={16} className="text-white" />
            )}
          </div>

          {/* Item name + shipment ID */}
          <div>
            <p className="text-sm font-bold text-olive-900">
              {shipment.item}
            </p>
            <p className="text-[11px] text-olive-400">
              {shipment.id} · {shipment.orderId}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span className={`clay-badge ${config.colorClass} shrink-0`}>
          {config.label}
        </span>
      </div>

      {/* ── Route row ──────────────────────────────────────── */}
      <div className="clay-inset px-3 py-2.5 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-olive-700">
          <MapPin size={13} className="text-olive-500 shrink-0" />
          <span className="font-medium">{shipment.from}</span>
          <div className="flex-1 border-t border-dashed border-olive-300" />
          <ArrowRight size={13} className="text-olive-400 shrink-0" />
          <span className="font-medium">{shipment.to}</span>
          <MapPin size={13} className="text-olive-600 shrink-0" />
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-olive-600">
            {shipment.carrier}
          </span>
          <span className="text-xs font-bold text-olive-700">
            {shipment.progress}%
          </span>
        </div>
        {/* Track */}
        <div className="clay-inset h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${shipment.progress}%`,
              background:
                shipment.status === "Delivered"
                  ? "linear-gradient(90deg, var(--color-olive-400)," +
                    " var(--color-olive-600))"
                  : "linear-gradient(90deg, #fbbf24, #d97706)",
            }}
          />
        </div>
      </div>

      {/* ── Footer row ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-olive-400" />
          <span className="text-xs text-olive-500">ETA: {shipment.eta}</span>
        </div>
        <span className="text-xs font-mono text-olive-500">
          {shipment.trackingNumber}
        </span>
      </div>
    </div>
  );
}