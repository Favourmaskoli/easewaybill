"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Package,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { useOrders } from "@/lib/hooks/useOrders";
import {
  getStatusLabel,
  getStatusColor,
  formatNaira,
} from "@/lib/utils/format";

const filterTabs = [
  "All",
  "AWAITING_PAYMENT",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

const filterLabels: Record<string, string> = {
  All: "All",
  AWAITING_PAYMENT: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { orders, total, isLoading } = useOrders({
    status: activeFilter !== "All" ? activeFilter : undefined,
    limit: 50,
  });

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <>
      {/* ── MOBILE VIEW ──────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader
          title="Orders"
          showBack={false}
          rightSlot={
            <Link
              href="/dashboard/orders/create"
              className="p-2.5 rounded-xl clay-inset text-green-700"
              aria-label="Create order"
            >
              <Plus size={18} />
            </Link>
          }
        />

        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2 px-3.5 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="search"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 w-full"
            />
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
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200",
                ].join(" ")}
              >
                {filterLabels[tab]}
              </button>
            ))}
          </div>

          <h2 className="text-sm font-bold text-gray-800">
            {isLoading ? "Loading..." : `${filteredOrders.length} orders`}
          </h2>

          {/* Cards */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-2xl border border-gray-100">
                <Package size={38} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">No orders found</p>
                <Link
                  href="/dashboard/orders/create"
                  className="text-sm text-green-600 font-semibold"
                >
                  Create your first order →
                </Link>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                    <Package size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {order.description}
                      </p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500">
                        {order.trackingCode}
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        {formatNaira(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP VIEW ─────────────────────────────────────────── */}
      <div className="hidden lg:block p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Orders</h2>
            <p className="text-sm text-gray-500 mt-1">
              {isLoading
                ? "Loading..."
                : `${total} total · ${filteredOrders.length} shown`}
            </p>
          </div>
          <Link
            href="/dashboard/orders/create"
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            New Order
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2.5 w-64 bg-white border border-gray-200 rounded-xl">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="search"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 w-full"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={[
                  "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                  activeFilter === tab
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-green-300",
                ].join(" ")}
              >
                {filterLabels[tab]}
              </button>
            ))}
          </div>

          <button
            className="p-2.5 text-gray-600 hover:text-gray-800 transition-colors ml-auto bg-white border border-gray-200 rounded-xl"
            aria-label="Advanced filters"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading orders...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Order ID",
                      "Description",
                      "Buyer",
                      "Amount",
                      "Status",
                      "Date",
                      "",
                    ].map((col) => (
                      <th
                        key={col || "action"}
                        className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3.5"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={[
                        "hover:bg-green-50/30 transition-colors",
                        idx !== filteredOrders.length - 1
                          ? "border-b border-gray-50"
                          : "",
                      ].join(" ")}
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-green-600">
                          {order.trackingCode}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-800 max-w-[200px] block truncate">
                          {order.description}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          {order.buyer
                            ? `${order.buyer.firstName} ${order.buyer.lastName}`
                            : order.buyerEmail}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-800">
                          {formatNaira(order.totalAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <time className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-NG",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </time>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="inline-flex p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors rounded-lg"
                          aria-label={`View ${order.trackingCode}`}
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="py-16 text-center">
                  <Package size={44} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-2">No orders found</p>
                  <Link
                    href="/dashboard/orders/create"
                    className="text-sm text-green-600 font-semibold hover:underline"
                  >
                    Create your first order →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
