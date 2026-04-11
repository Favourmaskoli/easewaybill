// components/dashboard/TransactionList.tsx
// ================================================================
// TRANSACTION LIST COMPONENT
// ================================================================
// A vertical list of recent order/transaction cards.
// Used on the MOBILE dashboard home view.
//
// Each card shows:
//   • Product icon placeholder
//   • Item name + date
//   • Status badge
//
// Props:
//   orders   — array of Order objects to display
//   maxItems — maximum number of items to show (default: all)
// ================================================================

import React from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import type { Order } from "@/lib/mock-data";

interface TransactionListProps {
  /** Array of order objects to render */
  orders: Order[];
  /** Maximum number of items to display (default: show all) */
  maxItems?: number;
}

export default function TransactionList({
  orders,
  maxItems,
}: TransactionListProps) {
  // ── Slice orders if maxItems is specified ────────────────────
  const visibleOrders = maxItems ? orders.slice(0, maxItems) : orders;

  return (
    <div className="space-y-3">
      {visibleOrders.map((order) => (
        <Link
          key={order.id}
          href={`/dashboard/orders/${order.id}`}
          className="flex items-center gap-3 bg-white p-4 rounded-xl
                     shadow-olive-sm border border-cream-300
                     hover:bg-olive-50/50 active:scale-[0.99]
                     transition-all"
        >
          {/* ── Product Thumbnail Placeholder ───────────────── */}
          <div
            className="w-11 h-11 bg-cream-200 rounded-xl
                       flex items-center justify-center shrink-0"
          >
            <Package
              size={18}
              className="text-olive-500"
              aria-hidden="true"
            />
          </div>

          {/* ── Order Info ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-olive-900 truncate">
              {order.item}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{order.date}</p>
          </div>

          {/* ── Status Badge ───────────────────────────────── */}
          <StatusBadge
            label={order.status}
            colorClass={order.statusColor}
            size="sm"
          />
        </Link>
      ))}

      {/* ── Empty State ────────────────────────────────────── */}
      {visibleOrders.length === 0 && (
        <div
          className="bg-white rounded-2xl p-8 text-center
                     shadow-olive-sm border border-cream-300"
        >
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No transactions yet</p>
        </div>
      )}
    </div>
  );
}