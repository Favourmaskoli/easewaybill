// components/dashboard/OrdersTable.tsx
// ================================================================
// ORDERS TABLE COMPONENT
// ================================================================
// Full data table for recent orders. Used on the DESKTOP dashboard.
//
// Renders a table with columns:
//   Order ID | Item | Buyer | Amount | Status | Date | Action
//
// Props:
//   orders     — array of Order objects
//   showHeader — whether to show the section header (default: true)
//   title      — custom title text (default: "Recent Orders")
//   subtitle   — custom subtitle (default: "Your latest 5 orders")
// ================================================================

import React from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import type { Order } from "@/lib/mock-data";

interface OrdersTableProps {
  /** Array of order objects to render in the table */
  orders: Order[];
  /** Whether to show the title/subtitle header row */
  showHeader?: boolean;
  /** Title text for the header */
  title?: string;
  /** Subtitle text for the header */
  subtitle?: string;
  /** "View All" link URL */
  viewAllHref?: string;
}

/** Column definitions for the table */
const columns = [
  { key: "id", label: "Order ID" },
  { key: "item", label: "Item" },
  { key: "buyer", label: "Buyer" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
] as const;

export default function OrdersTable({
  orders,
  showHeader = true,
  title = "Recent Orders",
  subtitle = "Your latest 5 orders",
  viewAllHref = "/dashboard/orders",
}: OrdersTableProps) {
  return (
    <section
      className="bg-white rounded-2xl shadow-olive-sm
                 border border-cream-300 overflow-hidden"
      aria-label={title}
    >
      {/* ── Section Header ─────────────────────────────────── */}
      {showHeader && (
        <div className="px-5 py-4 border-b border-cream-300">
          <SectionHeader
            title={title}
            subtitle={subtitle}
            linkText="View All"
            linkHref={viewAllHref}
          />
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table head */}
          <thead>
            <tr className="bg-cream-100/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="text-left text-xs font-semibold text-gray-500
                             uppercase tracking-wide px-5 py-3"
                >
                  {col.label}
                </th>
              ))}
              {/* Action column (empty header) */}
              <th scope="col" className="px-5 py-3 w-10" />
            </tr>
          </thead>

          {/* Table body */}
          <tbody className="divide-y divide-cream-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-olive-50/40 transition-colors"
              >
                {/* Order ID */}
                <td className="px-5 py-4">
                  <span className="text-sm font-bold text-olive-600">
                    {order.id}
                  </span>
                </td>

                {/* Item name */}
                <td className="px-5 py-4">
                  <span
                    className="text-sm font-medium text-olive-800
                               truncate max-w-[160px] block"
                  >
                    {order.item}
                  </span>
                </td>

                {/* Buyer */}
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-600">
                    {order.buyer}
                  </span>
                </td>

                {/* Amount */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-olive-800">
                    {order.amount}
                  </span>
                </td>

                {/* Status badge */}
                <td className="px-5 py-4">
                  <StatusBadge
                    label={order.status}
                    colorClass={order.statusColor}
                  />
                </td>

                {/* Date */}
                <td className="px-5 py-4">
                  <time className="text-xs text-gray-400">
                    {order.date}
                  </time>
                </td>

                {/* View action */}
                <td className="px-5 py-4">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="p-1.5 text-gray-400 hover:text-olive-600
                               hover:bg-olive-100 rounded-lg
                               transition-colors inline-flex"
                    aria-label={`View order ${order.id}`}
                  >
                    <Eye size={15} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Empty State ──────────────────────────────────── */}
        {orders.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No orders found</p>
          </div>
        )}
      </div>
    </section>
  );
}