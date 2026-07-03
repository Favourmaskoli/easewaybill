"use client";

import {
  Users,
  ShoppingCart,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  ArrowUpRight,
  Package,
  Scale,
} from "lucide-react";
import { useAdminDashboard } from "@/lib/hooks/useAdmin";
import { formatNaira } from "@/lib/utils/format";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon size={18} className="text-white" />
        </div>
        <ArrowUpRight size={16} className="text-gray-300" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function OrderStatusRow({
  label,
  count,
  color,
  total,
}: {
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">
        {count}
      </span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { dashboard: d, isLoading } = useAdminDashboard();

  if (isLoading || !d) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {new Date(d.generatedAt).toLocaleTimeString("en-NG")}
        </p>
      </div>

      {/* User stats */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Users
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={d.totalUsers}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            label="Sellers"
            value={d.totalSellers}
            icon={Package}
            color="bg-green-500"
          />
          <StatCard
            label="Buyers"
            value={d.totalBuyers}
            icon={ShoppingCart}
            color="bg-purple-500"
          />
          <StatCard
            label="Riders"
            value={d.totalRiders}
            icon={TrendingUp}
            color="bg-amber-500"
          />
        </div>
      </div>

      {/* Revenue stats */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Revenue
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="In Escrow"
            value={formatNaira(d.totalRevenueHeld)}
            icon={Wallet}
            color="bg-amber-500"
            sub="Currently held"
          />
          <StatCard
            label="Released"
            value={formatNaira(d.totalRevenueReleased)}
            icon={CheckCircle}
            color="bg-green-500"
            sub="Paid to sellers"
          />
          <StatCard
            label="Refunded"
            value={formatNaira(d.totalRevenueRefunded)}
            icon={XCircle}
            color="bg-red-500"
            sub="Returned to buyers"
          />
          <StatCard
            label="Platform Fees"
            value={formatNaira(d.totalPlatformFees)}
            icon={DollarSign}
            color="bg-indigo-500"
            sub="5% per transaction"
          />
        </div>
      </div>

      {/* Orders + Disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Order Status Breakdown</h3>
            <span className="text-sm font-bold text-gray-400">
              {d.totalOrders} total
            </span>
          </div>
          <div className="space-y-3">
            <OrderStatusRow
              label="Pending Buyer"
              count={d.ordersPendingBuyer}
              color="bg-purple-400"
              total={d.totalOrders}
            />
            <OrderStatusRow
              label="Awaiting Payment"
              count={d.ordersAwaitingPayment}
              color="bg-yellow-400"
              total={d.totalOrders}
            />
            <OrderStatusRow
              label="Paid"
              count={d.ordersPaid}
              color="bg-blue-400"
              total={d.totalOrders}
            />
            <OrderStatusRow
              label="Shipped"
              count={d.ordersShipped}
              color="bg-amber-400"
              total={d.totalOrders}
            />
            <OrderStatusRow
              label="In Transit"
              count={d.ordersInTransit}
              color="bg-orange-400"
              total={d.totalOrders}
            />
            <OrderStatusRow
              label="Delivered"
              count={d.ordersDelivered}
              color="bg-teal-400"
              total={d.totalOrders}
            />
            <OrderStatusRow
              label="Completed"
              count={d.ordersCompleted}
              color="bg-green-500"
              total={d.totalOrders}
            />
            <OrderStatusRow
              label="Disputed"
              count={d.ordersDisputed}
              color="bg-red-400"
              total={d.totalOrders}
            />
            <OrderStatusRow
              label="Cancelled"
              count={d.ordersCancelled}
              color="bg-gray-400"
              total={d.totalOrders}
            />
          </div>
        </div>

        {/* Disputes summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-5">Disputes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Open Disputes
                  </p>
                  <p className="text-xs text-gray-500">Require attention</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {d.openDisputes}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Resolved Disputes
                  </p>
                  <p className="text-xs text-gray-500">Closed successfully</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {d.resolvedDisputes}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Scale size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Resolution Rate
                  </p>
                  <p className="text-xs text-gray-500">Of all disputes</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-700">
                {d.openDisputes + d.resolvedDisputes > 0
                  ? Math.round(
                      (d.resolvedDisputes /
                        (d.openDisputes + d.resolvedDisputes)) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
