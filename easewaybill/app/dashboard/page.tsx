// app/dashboard/page.tsx
// ================================================================
// DASHBOARD HOME PAGE (Refactored)
// ================================================================
// Now composed entirely from small, reusable components.
// No inline mock data — everything comes from lib/mock-data.ts.
//
// DESKTOP (lg+):
//   WelcomeBanner → StatsGrid → OrdersTable + QuickActionsCard
//   + OrderStatusCard → PendingActions
//
// MOBILE (<lg):
//   Greeting → BalanceCard → QuickStatsRow → TransactionList
//
// ================================================================

"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

// ── Dashboard Widget Components ───────────────────────────────
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

// ── Centralised Mock Data ─────────────────────────────────────
import {
  statsData,
  mobileQuickStats,
  recentOrders,
  statusBars,
  pendingActions,
  quickActions,
} from "@/lib/mock-data";

// ================================================================
// COMPONENT
// ================================================================

export default function DashboardPage() {
  return (
    <>
      {/* ============================================================
          MOBILE VIEW — Visible below lg breakpoint only
          ============================================================ */}
      <div className="lg:hidden">
        {/* ── Greeting Header ────────────────────────────────── */}
        <MobileGreeting />

        {/* ── Balance Card ───────────────────────────────────── */}
        <div className="px-5 mb-5">
          <BalanceCard
            balance="₦1,200,000.00"
            onWithdraw={() => {
              // TODO: open withdrawal flow
              console.log("Withdraw tapped");
            }}
          />
        </div>

        {/* ── Quick Stats ────────────────────────────────────── */}
        <div className="px-5 mb-5">
          <QuickStatsRow stats={mobileQuickStats} />
        </div>

        {/* ── Recent Transactions ────────────────────────────── */}
        <div className="px-5 mb-4">
          {/* Section header with "See all" link */}
          <div className="mb-3">
            <SectionHeader
              title="Recent transactions"
              linkText="See all"
              linkHref="/dashboard/orders"
            />
          </div>

          {/* Transaction card list */}
          <TransactionList orders={recentOrders} />
        </div>
      </div>

      {/* ============================================================
          DESKTOP VIEW — Visible at lg breakpoint and above
          ============================================================ */}
      <div className="hidden lg:block p-6 space-y-6">
        {/* ── Welcome Banner ─────────────────────────────────── */}
        <WelcomeBanner
          userName="John"
          pendingCount={pendingActions.length}
        />

        {/* ── Stats Grid (4 KPI cards) ───────────────────────── */}
        <StatsGrid stats={statsData} />

        {/* ── Two-Column Layout: Table + Sidebar Widgets ─────── */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Orders Table (spans 2 columns) */}
          <div className="col-span-2">
            <OrdersTable orders={recentOrders} />
          </div>

          {/* Right: Quick Actions + Order Status (spans 1 column) */}
          <div className="space-y-6">
            <QuickActionsCard actions={quickActions} />
            <OrderStatusCard statusBars={statusBars} />
          </div>
        </div>

        {/* ── Pending Actions ────────────────────────────────── */}
        <PendingActions actions={pendingActions} />

        {/* Bottom spacer */}
        <div className="h-2" aria-hidden="true" />
      </div>
    </>
  );
}

// ================================================================
// SUB-COMPONENT: Mobile Greeting
// ================================================================
// The mobile greeting header with the user's name and a
// notification bell. Extracted here to keep the main component
// focused on composition rather than markup details.
// ================================================================

function MobileGreeting() {
  return (
    <div className="px-5 pt-6 pb-2">
      <div className="flex items-start justify-between">
        {/* ── Greeting Text ────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-olive-900 leading-tight">
            Good evening,
          </h1>
          <h1 className="text-2xl font-bold text-olive-900 leading-tight">
            John 👋
          </h1>
        </div>

        {/* ── Notification Bell ────────────────────────────── */}
        <button
          className="relative p-2.5 text-olive-700 bg-cream-100
                     rounded-xl hover:bg-olive-50 transition-colors mt-1"
          aria-label="View notifications"
        >
          <Bell size={20} />
          {/* Unread indicator */}
          <span
            className="absolute top-2 right-2 w-2 h-2 bg-red-500
                       rounded-full ring-2 ring-cream-200"
          />
        </button>
      </div>
    </div>
  );
}