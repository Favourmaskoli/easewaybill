// app/dashboard/payments/page.tsx
// ================================================================
// PAYMENTS PAGE — Deep Olive Claymorphism
// ================================================================
// Desktop: Three summary cards + full payment history table
// Mobile:  Payment screen matching the "Payment Screen" mockup
//          with order summary card, Pay Now CTA, history list
// ================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  Receipt,
} from "lucide-react";

// ── Shared Components ─────────────────────────────────────────
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

// ================================================================
// TYPES
// ================================================================

interface PaymentRecord {
  id: string;
  order: string;
  item: string;
  type: string;
  amount: string;
  status: string;
  statusColor: string;
  date: string;
  isCredit: boolean;
}

// ================================================================
// MOCK DATA
// ================================================================

/** Summary figures for the three desktop stat cards */
const paymentSummary = {
  escrow: "₦450,000",
  released: "₦1,200,000",
  wallet: "₦750,000",
  pendingCount: 3,
};

/** Active payment pending user action */
const activePayment = {
  orderId: "EWB-002",
  item: 'Samsung 65" TV',
  orderSummary: "₦320,000",
  amount: "₦320,000",
};

/** Full payment transaction history */
const paymentHistory: PaymentRecord[] = [
  {
    id: "PAY-001",
    order: "EWB-001",
    item: "iPhone 15 Pro Max",
    type: "Escrow Deposit",
    amount: "₦850,000",
    status: "Held",
    statusColor: "bg-amber-100 text-amber-800",
    date: "Apr 7, 2026",
    isCredit: false,
  },
  {
    id: "PAY-002",
    order: "EWB-003",
    item: "MacBook Air M2",
    type: "Released",
    amount: "₦1,100,000",
    status: "Completed",
    statusColor: "bg-olive-100 text-olive-800",
    date: "Apr 5, 2026",
    isCredit: true,
  },
  {
    id: "PAY-003",
    order: "EWB-005",
    item: "Laptop Stand + Hub",
    type: "Released",
    amount: "₦45,000",
    status: "Completed",
    statusColor: "bg-olive-100 text-olive-800",
    date: "Apr 3, 2026",
    isCredit: true,
  },
  {
    id: "PAY-004",
    order: "EWB-002",
    item: 'Samsung 65" TV',
    type: "Awaiting Payment",
    amount: "₦320,000",
    status: "Pending",
    statusColor: "bg-yellow-100 text-yellow-800",
    date: "Apr 6, 2026",
    isCredit: false,
  },
  {
    id: "PAY-005",
    order: "EWB-004",
    item: "PS5 Console",
    type: "Escrow Deposit",
    amount: "₦450,000",
    status: "Disputed",
    statusColor: "bg-red-100 text-red-800",
    date: "Apr 4, 2026",
    isCredit: false,
  },
];

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function PaymentsPage() {
  const router = useRouter();

  // ── Payment state ─────────────────────────────────────────────
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  /**
   * Simulates the Pay Now action for the active payment.
   */
  const handlePayNow = async () => {
    setIsPaying(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsPaying(false);
    setPaymentDone(true);
  };

  return (
    <>
      {/* ============================================================
          MOBILE VIEW — "Payment Screen"
          ============================================================ */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader title="Payments" showBack={false} />

        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* ── Order Summary Card ─────────────────────────────── */}
          <div className="clay-card">
            {/* Label + amount row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-olive-400 uppercase
                              tracking-wider mb-0.5">
                  Order summary
                </p>
                <p className="text-sm font-semibold text-olive-800">
                  {activePayment.orderId} · {activePayment.item}
                </p>
              </div>
              <span className="text-sm font-bold text-olive-700">
                {activePayment.orderSummary}
              </span>
            </div>

            {/* Big amount display */}
            <div className="clay-inset p-4 rounded-xl mb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-olive-700">
                  Amount
                </p>
                <p className="text-2xl font-bold text-olive-900">
                  {activePayment.amount}
                </p>
              </div>
            </div>

            {/* Pay Now button */}
            <button
              onClick={handlePayNow}
              disabled={isPaying || paymentDone}
              className="clay-btn w-full py-4 text-base disabled:opacity-60"
            >
              {paymentDone
                ? "✓ Payment Successful"
                : isPaying
                ? "Processing..."
                : "Pay Now"}
            </button>

            {/* Security notice */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <ShieldCheck size={14} className="text-olive-500" />
              <p className="text-xs text-olive-500">
                Secure / payment trust
              </p>
            </div>
          </div>

          {/* ── Wallet Balance Card ────────────────────────────── */}
          <div className="clay-card-dark text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-olive-200" />
                <p className="text-sm font-semibold text-olive-100">
                  Wallet Balance
                </p>
              </div>
              <TrendingUp size={16} className="text-olive-300" />
            </div>
            <p className="text-3xl font-bold text-white mb-3">
              {paymentSummary.wallet}
            </p>
            <button
              className="clay-btn-ghost text-white border-white/20
                         bg-white/10 text-xs px-4 py-2 hover:bg-white/20"
            >
              Withdraw Funds
            </button>
          </div>

          {/* ── Payment History ───────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-olive-800">
                Payment history
              </h3>
              <span className="text-xs text-olive-500">
                {paymentHistory.length} transactions
              </span>
            </div>

            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <MobilePaymentRow key={payment.id} payment={payment} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          DESKTOP VIEW
          ============================================================ */}
      <div className="hidden lg:block p-6 space-y-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold text-olive-900">Payments</h2>
          <p className="text-sm text-olive-500 mt-1">
            Manage your escrow payments and transaction history
          </p>
        </div>

        {/* ── Summary Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">
          {/* Escrow card */}
          <SummaryCard
            icon={CreditCard}
            label="Total in Escrow"
            value={paymentSummary.escrow}
            sub={`${paymentSummary.pendingCount} pending payments`}
            iconBg="from-amber-400 to-amber-600"
          />

          {/* Released card */}
          <SummaryCard
            icon={CheckCircle}
            label="Total Released"
            value={paymentSummary.released}
            sub="Successfully completed"
            iconBg="from-olive-400 to-olive-600"
          />

          {/* Wallet card — dark */}
          <div className="clay-card-dark text-white relative overflow-hidden">
            {/* Decorative circle */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24
                         bg-white/5 rounded-full"
              aria-hidden="true"
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={18} className="text-olive-200" />
                <p className="text-xs font-semibold text-olive-200
                              uppercase tracking-wider">
                  Wallet Balance
                </p>
              </div>
              <p className="text-2xl font-bold text-white mb-3">
                {paymentSummary.wallet}
              </p>
              <button className="clay-btn-ghost text-white border-white/20
                               bg-white/10 text-xs px-4 py-2
                               hover:bg-white/20">
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        {/* ── Active Payment CTA ─────────────────────────────── */}
        {!paymentDone && (
          <div className="clay-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center
                             justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-olive-400)," +
                      " var(--color-olive-600))",
                    boxShadow:
                      "4px 4px 10px rgba(23,29,9,0.20)," +
                      " -2px -2px 6px rgba(114,143,50,0.16)",
                  }}
                >
                  <Clock size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-olive-900">
                    {activePayment.orderId} — Awaiting Payment
                  </p>
                  <p className="text-xs text-olive-500 mt-0.5">
                    {activePayment.item} · {activePayment.amount}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePayNow}
                disabled={isPaying}
                className="clay-btn px-6 py-2.5 text-sm
                           whitespace-nowrap disabled:opacity-60"
              >
                {isPaying ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        )}

        {/* ── Payment History Table ──────────────────────────── */}
        <div className="clay-card !p-0 overflow-hidden">
          {/* Table header */}
          <div
            className="flex items-center justify-between px-5 py-4
                       border-b border-cream-300/50"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-50)," +
                " var(--color-cream-200))",
            }}
          >
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-olive-600" />
              <h3 className="font-bold text-olive-900">
                Payment History
              </h3>
              <span className="clay-badge bg-olive-100 text-olive-700 ml-1">
                {paymentHistory.length} records
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-cream-100)," +
                      " var(--color-cream-200))",
                  }}
                >
                  {[
                    "Payment ID",
                    "Order",
                    "Item",
                    "Type",
                    "Amount",
                    "Status",
                    "Date",
                  ].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="text-left text-[11px] font-bold text-olive-500
                                 uppercase tracking-wider px-5 py-3.5"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment, idx) => (
                  <tr
                    key={payment.id}
                    className={[
                      "hover:bg-olive-50/30 transition-colors",
                      idx !== paymentHistory.length - 1
                        ? "border-b border-cream-300/50"
                        : "",
                    ].join(" ")}
                  >
                    {/* Payment ID */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-olive-600">
                        {payment.id}
                      </span>
                    </td>

                    {/* Order ID */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-olive-700">
                        {payment.order}
                      </span>
                    </td>

                    {/* Item name */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-olive-600 truncate
                                       max-w-[140px] block">
                        {payment.item}
                      </span>
                    </td>

                    {/* Transaction type with icon */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {payment.isCredit ? (
                          <ArrowUpRight
                            size={15}
                            className="text-olive-500"
                          />
                        ) : (
                          <ArrowDownRight
                            size={15}
                            className="text-amber-500"
                          />
                        )}
                        <span className="text-xs text-olive-600">
                          {payment.type}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4">
                      <span
                        className={`text-sm font-bold ${
                          payment.isCredit
                            ? "text-olive-600"
                            : "text-olive-800"
                        }`}
                      >
                        {payment.isCredit ? "+" : ""}
                        {payment.amount}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4">
                      <span className={`clay-badge ${payment.statusColor}`}>
                        {payment.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">
                      <time className="text-xs text-olive-400">
                        {payment.date}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ================================================================
// SUB-COMPONENT: SummaryCard
// ================================================================
// A KPI stat card used in the desktop payments summary row.
// ================================================================

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
}: SummaryCardProps) {
  return (
    <div className="clay-card">
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(145deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
            backgroundImage: `linear-gradient(145deg, ${
              iconBg.includes("amber")
                ? "#fbbf24, #d97706"
                : "var(--color-olive-400), var(--color-olive-600)"
            })`,
            boxShadow:
              "5px 5px 12px rgba(23,29,9,0.22)," +
              " -2px -2px 7px rgba(114,143,50,0.18)",
          }}
        >
          <Icon size={22} className="text-white" />
        </div>

        {/* Label */}
        <p className="text-xs font-bold text-olive-500 uppercase
                      tracking-wider">
          {label}
        </p>
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-olive-900 mb-1">{value}</p>

      {/* Sub text */}
      <p className="text-xs text-olive-400">{sub}</p>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: MobilePaymentRow
// ================================================================
// A single transaction row in the mobile payment history list.
// ================================================================

interface MobilePaymentRowProps {
  payment: PaymentRecord;
}

function MobilePaymentRow({ payment }: MobilePaymentRowProps) {
  return (
    <div className="clay-card flex items-center gap-3 !p-4">
      {/* Direction icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center
                   justify-center shrink-0"
        style={{
          background: payment.isCredit
            ? "linear-gradient(145deg, var(--color-olive-400)," +
              " var(--color-olive-600))"
            : "linear-gradient(145deg, #fbbf24, #d97706)",
          boxShadow:
            "3px 3px 8px rgba(23,29,9,0.18)," +
            " -1px -1px 4px rgba(114,143,50,0.14)",
        }}
      >
        {payment.isCredit ? (
          <ArrowUpRight size={18} className="text-white" />
        ) : (
          <ArrowDownRight size={18} className="text-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-olive-900 truncate">
          {payment.order} · {payment.type}
        </p>
        <p className="text-xs text-olive-400 mt-0.5">{payment.date}</p>
      </div>

      {/* Right side — amount + status */}
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-bold ${
            payment.isCredit ? "text-olive-600" : "text-olive-800"
          }`}
        >
          {payment.isCredit ? "+" : ""}
          {payment.amount}
        </p>
        <span
          className={`clay-badge text-[9px] mt-1 ${payment.statusColor}`}
        >
          {payment.status}
        </span>
      </div>
    </div>
  );
}