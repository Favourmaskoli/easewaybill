// app/dashboard/page.tsx
// Dashboard Page — Green/Gray/Blue Theme

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  CreditCard,
  MessageSquare,
  Settings,
  Bell,
  Search,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Plus,
  Eye,
  Menu,
  X,
} from "lucide-react";

// ============================================================
// MOCK DATA
// ============================================================

const statsData = [
  {
    title: "Total Orders",
    value: "24",
    change: "+3 this week",
    icon: ShoppingCart,
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
  {
    title: "In Escrow",
    value: "₦450,000",
    change: "6 active orders",
    icon: CreditCard,
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    title: "In Transit",
    value: "8",
    change: "Awaiting delivery",
    icon: Truck,
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    title: "Completed",
    value: "16",
    change: "₦1.2M released",
    icon: CheckCircle,
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
];

const recentOrders = [
  {
    id: "EWB-001",
    item: "iPhone 15 Pro Max",
    buyer: "Adaeze Obi",
    amount: "₦850,000",
    status: "In Transit",
    statusColor: "bg-orange-100 text-orange-700",
    date: "Apr 7, 2026",
  },
  {
    id: "EWB-002",
    item: 'Samsung 65" TV',
    buyer: "Emeka Nwosu",
    amount: "₦320,000",
    status: "Awaiting Payment",
    statusColor: "bg-yellow-100 text-yellow-700",
    date: "Apr 6, 2026",
  },
  {
    id: "EWB-003",
    item: "MacBook Air M2",
    buyer: "Fatima Bello",
    amount: "₦1,100,000",
    status: "Completed",
    statusColor: "bg-green-100 text-green-700",
    date: "Apr 5, 2026",
  },
  {
    id: "EWB-004",
    item: "PS5 Console",
    buyer: "Tunde Adeola",
    amount: "₦450,000",
    status: "Disputed",
    statusColor: "bg-red-100 text-red-700",
    date: "Apr 4, 2026",
  },
  {
    id: "EWB-005",
    item: "Laptop Stand + Hub",
    buyer: "Chinyere Uzo",
    amount: "₦45,000",
    status: "Completed",
    statusColor: "bg-green-100 text-green-700",
    date: "Apr 3, 2026",
  },
];

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    active: true,
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    href: "/dashboard/orders",
    active: false,
  },
  {
    label: "Shipments",
    icon: Truck,
    href: "/dashboard/shipments",
    active: false,
  },
  {
    label: "Payments",
    icon: CreditCard,
    href: "/dashboard/payments",
    active: false,
  },
  {
    label: "Messages",
    icon: MessageSquare,
    href: "/dashboard/messages",
    active: false,
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    active: false,
  },
];

const statusBars = [
  {
    label: "Awaiting Payment",
    count: 3,
    dotColor: "bg-yellow-400",
    barColor: "bg-yellow-400",
    width: "25%",
  },
  {
    label: "In Transit",
    count: 8,
    dotColor: "bg-orange-400",
    barColor: "bg-orange-400",
    width: "60%",
  },
  {
    label: "Completed",
    count: 16,
    dotColor: "bg-green-500",
    barColor: "bg-green-500",
    width: "80%",
  },
  {
    label: "Disputed",
    count: 1,
    dotColor: "bg-red-500",
    barColor: "bg-red-500",
    width: "8%",
  },
];

const pendingActions = [
  {
    id: "EWB-002",
    title: "EWB-002 Awaiting Payment",
    description: "Samsung TV — ₦320,000",
    actionLabel: "Pay Now",
    icon: Clock,
    bg: "bg-yellow-50",
    border: "border-yellow-100",
    iconColor: "text-yellow-600",
    btnClass: "text-yellow-700 bg-yellow-100 hover:bg-yellow-200",
  },
  {
    id: "EWB-004",
    title: "EWB-004 Dispute Open",
    description: "PS5 Console — ₦450,000",
    actionLabel: "Resolve",
    icon: AlertTriangle,
    bg: "bg-red-50",
    border: "border-red-100",
    iconColor: "text-red-500",
    btnClass: "text-red-700 bg-red-100 hover:bg-red-200",
  },
  {
    id: "EWB-001",
    title: "EWB-001 Confirm Delivery",
    description: "iPhone 15 Pro — ₦850,000",
    actionLabel: "Confirm",
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-100",
    iconColor: "text-green-600",
    btnClass: "text-green-700 bg-green-100 hover:bg-green-200",
  },
];

// ============================================================
// DASHBOARD COMPONENT
// ============================================================
export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ==================================================
          SIDEBAR
      ================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed lg:static inset-y-0 left-0 z-30",
          "w-64 flex flex-col",
          "bg-white border-r border-gray-100",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* ---- Logo Header ---- */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="EaseWaybill Home"
          >
            <div className="bg-green-600 text-white p-1.5 rounded-lg group-hover:bg-green-700 transition-colors">
              <Package size={20} />
            </div>
            <span className="text-lg font-bold text-gray-900">
              ease<span className="text-green-500">waybill</span>
            </span>
          </Link>

          <button
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* ---- Navigation ---- */}
        <nav
          className="flex-1 p-4 space-y-1 overflow-y-auto"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "font-medium text-sm transition-all duration-200",
                item.active
                  ? "bg-green-600 text-white shadow-md shadow-green-200"
                  : "text-gray-600 hover:bg-green-50 hover:text-green-700",
              ].join(" ")}
              aria-current={item.active ? "page" : undefined}
            >
              <item.icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
              {item.active && (
                <ChevronRight
                  size={16}
                  className="ml-auto"
                  aria-hidden="true"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* ---- User Profile + Logout ---- */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2 text-left">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                John Doe
              </p>
              <p className="text-xs text-gray-500 truncate">john@example.com</p>
            </div>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium">
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {/* ==================================================
          MAIN CONTENT AREA
      ================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ---- Top Header Bar ---- */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                className="lg:hidden p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={22} />
              </button>

              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  Dashboard
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block mt-0.5">
                  Monday, April 7, 2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                <Search
                  size={15}
                  className="text-gray-400 shrink-0"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Search orders..."
                  className="bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400 w-full"
                  aria-label="Search orders"
                />
              </div>

              <button
                className="relative p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                aria-label="View notifications"
              >
                <Bell size={21} />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
                  aria-label="3 unread notifications"
                />
              </button>

              <div
                className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer shrink-0 hover:ring-2 hover:ring-green-300 transition-all"
                role="button"
                aria-label="User menu"
                tabIndex={0}
              >
                JD
              </div>
            </div>
          </div>
        </header>

        {/* ---- Scrollable Page Body ---- */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
          id="main-content"
        >
          {/* ==========================================
              WELCOME BANNER
          ========================================== */}
          <section
            className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white"
            aria-label="Welcome banner"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Good evening, John! 👋
                </h2>
                <p className="text-green-100 text-sm">
                  You have{" "}
                  <strong className="text-white font-semibold">
                    3 pending actions
                  </strong>{" "}
                  today. Let&apos;s get them done!
                </p>
              </div>

              <Link
                href="/dashboard/orders/create"
                className="flex items-center gap-2 bg-white text-green-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-green-50 active:scale-95 transition-all shadow-md hover:shadow-lg whitespace-nowrap shrink-0"
              >
                <Plus size={18} aria-hidden="true" />
                New Order
              </Link>
            </div>
          </section>

          {/* ==========================================
              STATS CARDS GRID
          ========================================== */}
          <section aria-label="Statistics overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {statsData.map((stat) => (
                <article
                  key={stat.title}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${stat.bgColor} ${stat.textColor} rounded-xl flex items-center justify-center`}
                      aria-hidden="true"
                    >
                      <stat.icon size={24} />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      <TrendingUp size={11} aria-hidden="true" />
                      Active
                    </span>
                  </div>

                  <p className="text-2xl font-bold text-gray-900 mb-0.5">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">
                    {stat.title}
                  </p>
                  <p className="text-xs text-gray-400">{stat.change}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ==========================================
              MAIN 2-COLUMN GRID
          ========================================== */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ---- Recent Orders Table ---- */}
            <section
              className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              aria-label="Recent orders"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    Recent Orders
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your latest 5 orders
                  </p>
                </div>
                <Link
                  href="/dashboard/orders"
                  className="text-sm text-green-600 font-medium hover:underline underline-offset-2 flex items-center gap-1"
                >
                  View All
                  <ChevronRight size={15} aria-hidden="true" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full" aria-label="Orders table">
                  <thead>
                    <tr className="bg-gray-50/80">
                      {[
                        { label: "Order ID" },
                        { label: "Item" },
                        { label: "Buyer" },
                        { label: "Amount" },
                        { label: "Status" },
                        { label: "Date" },
                      ].map((col) => (
                        <th
                          key={col.label}
                          scope="col"
                          className={[
                            "text-left text-xs font-semibold text-gray-500",
                            "uppercase tracking-wide px-5 py-3",
                            col.label === "Buyer"
                              ? "hidden sm:table-cell"
                              : col.label === "Date"
                                ? "hidden md:table-cell"
                                : "",
                          ].join(" ")}
                        >
                          {col.label}
                        </th>
                      ))}
                      <th scope="col" className="px-5 py-3 w-10" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-green-50/40 transition-colors duration-150"
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-green-600">
                            {order.id}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[140px] block">
                            {order.item}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="text-sm text-gray-600">
                            {order.buyer}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-gray-800">
                            {order.amount}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`status-badge ${order.statusColor}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <time className="text-xs text-gray-400">
                            {order.date}
                          </time>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            aria-label={`View order ${order.id}`}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ---- Right Column ---- */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <section
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                aria-label="Quick actions"
              >
                <h3 className="font-bold text-gray-900 text-lg mb-4">
                  Quick Actions
                </h3>

                <div className="space-y-2.5">
                  {/* Create Order */}
                  <Link
                    href="/dashboard/orders/create"
                    className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
                  >
                    <div className="w-9 h-9 bg-green-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <Plus size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Create Order
                      </p>
                      <p className="text-xs text-gray-500">
                        Start a new escrow order
                      </p>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-gray-400 group-hover:text-green-600 shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                  </Link>

                  {/* Track Shipment */}
                  <Link
                    href="/dashboard/shipments"
                    className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                  >
                    <div className="w-9 h-9 bg-blue-500 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <Truck size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Track Shipment
                      </p>
                      <p className="text-xs text-gray-500">
                        8 orders in transit
                      </p>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-gray-400 group-hover:text-blue-600 shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                  </Link>

                  {/* Payments */}
                  <Link
                    href="/dashboard/payments"
                    className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
                  >
                    <div className="w-9 h-9 bg-green-500 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Payments
                      </p>
                      <p className="text-xs text-gray-500">₦450K in escrow</p>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-gray-400 group-hover:text-green-600 shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                  </Link>

                  {/* Messages */}
                  <Link
                    href="/dashboard/messages"
                    className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
                  >
                    <div className="w-9 h-9 bg-purple-500 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <MessageSquare size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Messages
                      </p>
                      <p className="text-xs text-gray-500">2 unread messages</p>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-gray-400 group-hover:text-purple-600 shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </section>

              {/* Order Status Summary Card */}
              <section
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                aria-label="Order status summary"
              >
                <h3 className="font-bold text-gray-900 text-lg mb-4">
                  Order Status
                </h3>

                <div className="space-y-4">
                  {statusBars.map((bar) => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${bar.dotColor}`}
                            aria-hidden="true"
                          />
                          <span className="text-sm text-gray-600">
                            {bar.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {bar.count}
                        </span>
                      </div>
                      <div
                        className="w-full bg-gray-100 rounded-full h-1.5"
                        role="progressbar"
                        aria-valuenow={bar.count}
                        aria-valuemin={0}
                        aria-valuemax={20}
                        aria-label={`${bar.label}: ${bar.count}`}
                      >
                        <div
                          className={`${bar.barColor} h-1.5 rounded-full transition-all duration-700`}
                          style={{ width: bar.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* ==========================================
              PENDING ACTIONS
          ========================================== */}
          <section
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            aria-label="Pending actions"
          >
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle
                size={20}
                className="text-orange-500"
                aria-hidden="true"
              />
              <h3 className="font-bold text-gray-900 text-lg">
                Pending Actions
              </h3>
              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {pendingActions.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${action.bg} ${action.border}`}
                >
                  <action.icon
                    size={20}
                    className={`${action.iconColor} mt-0.5 shrink-0`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {action.description}
                    </p>
                    <button
                      className={`mt-2.5 text-xs font-semibold px-3 py-1 rounded-full transition-colors ${action.btnClass}`}
                    >
                      {action.actionLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-6" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
}
