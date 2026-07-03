"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

// Components
import BalanceCard from "@/components/dashboard/BalanceCard";
import QuickStatsRow from "@/components/dashboard/QuickStatsRow";
import TransactionList from "@/components/dashboard/TransactionList";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import StatsGrid from "@/components/dashboard/StatsGrid";
import OrdersTable from "@/components/dashboard/OrdersTable";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import OrderStatusCard from "@/components/dashboard/OrderStatusCard";
import PendingActions from "@/components/dashboard/PendingActions";
import SectionHeader from "@/components/ui/SectionHeader";

// API hooks
import { useAuth } from "@/lib/hooks/useAuth";
import { useOrders } from "@/lib/hooks/useOrders";
import { useNotifications } from "@/lib/hooks/useNotifications";

// Static data (non-API)
import { quickActions } from "@/lib/mock-data";

// Utils
import {
  formatNaira,
  getStatusLabel,
  getStatusColor,
} from "@/lib/utils/format";

import type {
  StatItem,
  QuickStat,
  Order as MockOrder,
  StatusBar,
  PendingAction,
} from "@/lib/mock-data";

import {
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { Order } from "@/lib/types/api.types";

// ── Map real order status → status bar data ────────────────────
function buildStatusBars(orders: Order[]): StatusBar[] {
  const total = orders.length || 1;
  const counts = {
    "Awaiting Payment": orders.filter((o) => o.status === "AWAITING_PAYMENT")
      .length,
    "In Transit": orders.filter((o) => o.status === "IN_TRANSIT").length,
    Completed: orders.filter((o) => o.status === "COMPLETED").length,
    Disputed: orders.filter((o) => o.status === "DISPUTED").length,
  };

  return [
    {
      label: "Awaiting Payment",
      count: counts["Awaiting Payment"],
      dotColor: "bg-yellow-400",
      barColor: "bg-yellow-400",
      width: `${Math.round((counts["Awaiting Payment"] / total) * 100)}%`,
    },
    {
      label: "In Transit",
      count: counts["In Transit"],
      dotColor: "bg-amber-400",
      barColor: "bg-amber-400",
      width: `${Math.round((counts["In Transit"] / total) * 100)}%`,
    },
    {
      label: "Completed",
      count: counts["Completed"],
      dotColor: "bg-green-500",
      barColor: "bg-green-500",
      width: `${Math.round((counts["Completed"] / total) * 100)}%`,
    },
    {
      label: "Disputed",
      count: counts["Disputed"],
      dotColor: "bg-red-500",
      barColor: "bg-red-500",
      width: `${Math.round((counts["Disputed"] / total) * 100)}%`,
    },
  ];
}

// ── Map real orders → stats grid ──────────────────────────────
function buildStatsGrid(orders: Order[]): StatItem[] {
  const inEscrow = orders
    .filter((o) => o.escrowStatus === "HOLDING")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  return [
    {
      title: "Total Orders",
      value: String(orders.length),
      change: `+${
        orders.filter((o) => {
          const d = new Date(o.createdAt);
          const now = new Date();
          const diff = now.getTime() - d.getTime();
          return diff < 7 * 24 * 60 * 60 * 1000;
        }).length
      } this week`,
      icon: ShoppingCart,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "In Escrow",
      value: formatNaira(inEscrow),
      change: `${orders.filter((o) => o.escrowStatus === "HOLDING").length} active orders`,
      icon: CreditCard,
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    },
    {
      title: "In Transit",
      value: String(orders.filter((o) => o.status === "IN_TRANSIT").length),
      change: "Awaiting delivery",
      icon: Truck,
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Completed",
      value: String(orders.filter((o) => o.status === "COMPLETED").length),
      change:
        formatNaira(
          orders
            .filter((o) => o.status === "COMPLETED")
            .reduce((sum, o) => sum + parseFloat(o.sellerPayout), 0),
        ) + " released",
      icon: CheckCircle,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ];
}

// ── Map real orders → mobile quick stats ──────────────────────
function buildMobileStats(orders: Order[]): QuickStat[] {
  return [
    {
      label: "Active\nOrders",
      value: String(
        orders.filter((o) =>
          ["PAID", "SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(o.status),
        ).length,
      ),
    },
    {
      label: "Completed\nOrders",
      value: String(orders.filter((o) => o.status === "COMPLETED").length),
    },
    {
      label: "Pending\nDeliveries",
      value: String(orders.filter((o) => o.status === "DELIVERED").length),
    },
  ];
}

// ── Map real orders → pending actions ─────────────────────────
function buildPendingActions(orders: Order[]): PendingAction[] {
  const pending: PendingAction[] = [];

  orders
    .filter((o) => o.status === "AWAITING_PAYMENT")
    .slice(0, 2)
    .forEach((o) => {
      pending.push({
        id: o.id,
        title: `${o.trackingCode} Awaiting Payment`,
        description: `${o.description} — ${formatNaira(o.totalAmount)}`,
        actionLabel: "Pay Now",
        icon: Clock,
        bg: "bg-yellow-50",
        border: "border-yellow-100",
        iconColor: "text-yellow-600",
        btnClass: "text-yellow-700 bg-yellow-100 hover:bg-yellow-200",
      });
    });

  orders
    .filter((o) => o.status === "DISPUTED")
    .slice(0, 2)
    .forEach((o) => {
      pending.push({
        id: o.id,
        title: `${o.trackingCode} Dispute Open`,
        description: `${o.description} — ${formatNaira(o.totalAmount)}`,
        actionLabel: "Resolve",
        icon: AlertTriangle,
        bg: "bg-red-50",
        border: "border-red-100",
        iconColor: "text-red-500",
        btnClass: "text-red-700 bg-red-100 hover:bg-red-200",
      });
    });

  orders
    .filter((o) => o.status === "DELIVERED")
    .slice(0, 2)
    .forEach((o) => {
      pending.push({
        id: o.id,
        title: `${o.trackingCode} Confirm Delivery`,
        description: `${o.description} — ${formatNaira(o.totalAmount)}`,
        actionLabel: "Confirm",
        icon: CheckCircle,
        bg: "bg-green-50",
        border: "border-green-100",
        iconColor: "text-green-600",
        btnClass: "text-green-700 bg-green-100 hover:bg-green-200",
      });
    });

  return pending;
}

// ── Map real orders → mock Order shape for existing components ─
function toMockOrders(orders: Order[]): MockOrder[] {
  return orders.map((o) => ({
    id: o.trackingCode,
    item: o.description,
    buyer: o.buyer ? `${o.buyer.firstName} ${o.buyer.lastName}` : o.buyerEmail,
    amount: formatNaira(o.totalAmount),
    status: getStatusLabel(o.status),
    statusColor: getStatusColor(o.status),
    date: new Date(o.createdAt).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    buyerConfirmedAt: o.buyerConfirmedAt ?? null,
  }));
}

// ================================================================
// COMPONENT
// ================================================================

// export default function DashboardPage() {
//   const { user } = useAuth();
//   const { orders, isLoading } = useOrders({ limit: 10 });
//   const { unreadCount } = useNotifications();

//   const firstName = user?.firstName ?? "there";

//   // Derive all data from real orders
//   const statsGrid = buildStatsGrid(orders);
//   const mobileStats = buildMobileStats(orders);
//   const statusBars = buildStatusBars(orders);
//   const pendingActions = buildPendingActions(orders);
//   const mockOrders = toMockOrders(orders);

//   // Escrow balance = sum of all HOLDING escrow orders
//   const escrowBalance = orders
//     .filter((o) => o.escrowStatus === "HOLDING")
//     .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="text-center">
//           <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
//           <p className="text-gray-500 text-sm">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       {/* ── MOBILE VIEW ──────────────────────────────────────────── */}
//       <div className="lg:hidden">
//         <MobileGreeting firstName={firstName} unreadCount={unreadCount} />

//         <div className="px-5 mb-5">
//           <BalanceCard
//             balance={formatNaira(escrowBalance)}
//             pendingCount={pendingActions.length}
//           />
//         </div>

//         <div className="px-5 mb-5">
//           <QuickStatsRow stats={mobileStats} />
//         </div>

//         <div className="px-5 mb-4">
//           <div className="mb-3">
//             <SectionHeader
//               title="Recent transactions"
//               linkText="See all"
//               linkHref="/dashboard/orders"
//             />
//           </div>
//           <TransactionList orders={mockOrders} />
//         </div>
//       </div>

//       {/* ── DESKTOP VIEW ─────────────────────────────────────────── */}
//       <div className="hidden lg:block p-6 space-y-6">
//         <WelcomeBanner
//           userName={firstName}
//           pendingCount={pendingActions.length}
//         />

//         <StatsGrid stats={statsGrid} />

//         <div className="grid grid-cols-3 gap-6">
//           <div className="col-span-2">
//             <OrdersTable orders={mockOrders} />
//           </div>
//           <div className="space-y-6">
//             <QuickActionsCard actions={quickActions} />
//             <OrderStatusCard statusBars={statusBars} />
//           </div>
//         </div>

//         <PendingActions actions={pendingActions} />
//         <div className="h-2" aria-hidden="true" />
//       </div>
//     </>
//   );
// }
export default function DashboardPage() {
  const { user } = useAuth();
  const { orders, isLoading } = useOrders({ limit: 50 });
  const { unreadCount } = useNotifications();

  const firstName = user?.firstName ?? "there";

  // ── Context-aware order splitting ─────────────────────────────
  // Same user can be seller on some orders and buyer on others
  const mySellerOrders = orders.filter((o) => o.sellerId === user?.id);
  const myBuyerOrders = orders.filter((o) => o.buyerId === user?.id);

  // For dashboard stats — show all orders the user is involved in
  const allMyOrders = orders;

  const statsGrid = buildStatsGrid(allMyOrders);
  const mobileStats = buildMobileStats(allMyOrders);
  const statusBars = buildStatusBars(allMyOrders);
  const pendingActions = buildPendingActions(allMyOrders);
  const mockOrders = toMockOrders(allMyOrders);

  const escrowBalance = allMyOrders
    .filter((o) => o.escrowStatus === "HOLDING")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── MOBILE VIEW ──────────────────────────────────────────── */}
      <div className="lg:hidden">
        <MobileGreeting firstName={firstName} unreadCount={unreadCount} />

        <div className="px-5 mb-5">
          <BalanceCard
            balance={formatNaira(escrowBalance)}
            pendingCount={pendingActions.length}
          />
        </div>

        {/* Context summary pills */}
        {(mySellerOrders.length > 0 || myBuyerOrders.length > 0) && (
          <div className="px-5 mb-4 flex gap-3">
            {mySellerOrders.length > 0 && (
              <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-700">
                  {mySellerOrders.length}
                </p>
                <p className="text-xs text-green-600">As Seller</p>
              </div>
            )}
            {myBuyerOrders.length > 0 && (
              <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-700">
                  {myBuyerOrders.length}
                </p>
                <p className="text-xs text-blue-600">As Buyer</p>
              </div>
            )}
          </div>
        )}

        <div className="px-5 mb-5">
          <QuickStatsRow stats={mobileStats} />
        </div>

        <div className="px-5 mb-4">
          <div className="mb-3">
            <SectionHeader
              title="Recent transactions"
              linkText="See all"
              linkHref="/dashboard/orders"
            />
          </div>
          <TransactionList orders={mockOrders} />
        </div>
      </div>

      {/* ── DESKTOP VIEW ─────────────────────────────────────────── */}
      <div className="hidden lg:block p-6 space-y-6">
        <WelcomeBanner
          userName={firstName}
          pendingCount={pendingActions.length}
        />

        <StatsGrid stats={statsGrid} />

        {/* Context pills — desktop */}
        {(mySellerOrders.length > 0 || myBuyerOrders.length > 0) && (
          <div className="flex gap-4">
            <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-sm">🏪</span>
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">
                  {mySellerOrders.length} order
                  {mySellerOrders.length !== 1 ? "s" : ""} as Seller
                </p>
                <p className="text-xs text-green-600">
                  You created these orders
                </p>
              </div>
            </div>
            {myBuyerOrders.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🛒</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-800">
                    {myBuyerOrders.length} order
                    {myBuyerOrders.length !== 1 ? "s" : ""} as Buyer
                  </p>
                  <p className="text-xs text-blue-600">You are buying these</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <OrdersTable orders={mockOrders} />
          </div>
          <div className="space-y-6">
            <QuickActionsCard actions={quickActions} />
            <OrderStatusCard statusBars={statusBars} />
          </div>
        </div>

        <PendingActions actions={pendingActions} />
        <div className="h-2" aria-hidden="true" />
      </div>
    </>
  );
}

// ── Mobile Greeting ───────────────────────────────────────────
function MobileGreeting({
  firstName,
  unreadCount,
}: {
  firstName: string;
  unreadCount: number;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="px-5 pt-6 pb-2">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {greeting},
          </h1>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {firstName} 👋
          </h1>
        </div>

        <Link
          href="/dashboard/notifications"
          className="relative p-2.5 text-gray-700 bg-gray-100
                     rounded-xl hover:bg-green-50 transition-colors mt-1"
          aria-label="View notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </Link>
      </div>
    </div>
  );
}
