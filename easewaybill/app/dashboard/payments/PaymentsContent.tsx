"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
  Clock,
  Receipt,
  ExternalLink,
} from "lucide-react";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOrders } from "@/lib/hooks/useOrders";
import { paymentsApi } from "@/lib/api/payments.api";
import { formatNaira, formatDate } from "@/lib/utils/format";
import type { PaymentRecord, Order } from "@/lib/types/api.types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

// ================================================================
// HELPERS
// ================================================================

function getPaymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    FAILED: "bg-red-100 text-red-800",
    ABANDONED: "bg-gray-100 text-gray-600",
    REFUNDED: "bg-purple-100 text-purple-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function getPaymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: "Paid",
    PENDING: "Pending",
    FAILED: "Failed",
    ABANDONED: "Abandoned",
    REFUNDED: "Refunded",
  };
  return map[status] ?? status;
}

function isCredit(type: string): boolean {
  return ["FULL_RELEASE", "REFUND"].includes(type);
}

// ================================================================
// SUB-COMPONENTS
// ================================================================

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  amber?: boolean;
}

function SummaryCard({ icon: Icon, label, value, sub, amber }: SummaryCardProps) {
  return (
    <div className="clay-card">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: amber
              ? "linear-gradient(145deg, #fbbf24, #d97706)"
              : "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
            boxShadow:
              "5px 5px 12px rgba(23,29,9,0.22), -2px -2px 7px rgba(114,143,50,0.18)",
          }}
        >
          <Icon size={22} className="text-white" />
        </div>
        <p className="text-xs font-bold text-olive-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold text-olive-900 mb-1">{value}</p>
      <p className="text-xs text-olive-400">{sub}</p>
    </div>
  );
}

interface MobilePaymentRowProps {
  payment: PaymentRecord;
  order?: Order;
}

function MobilePaymentRow({ payment, order }: MobilePaymentRowProps) {
  const credit = isCredit(payment.channel);
  return (
    <div className="clay-card flex items-center gap-3 !p-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: credit
            ? "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))"
            : "linear-gradient(145deg, #fbbf24, #d97706)",
          boxShadow:
            "3px 3px 8px rgba(23,29,9,0.18), -1px -1px 4px rgba(114,143,50,0.14)",
        }}
      >
        {credit ? (
          <ArrowUpRight size={18} className="text-white" />
        ) : (
          <ArrowDownRight size={18} className="text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-olive-900 truncate">
          {order?.trackingCode ?? payment.orderId} · {payment.channelLabel}
        </p>
        <p className="text-xs text-olive-400 mt-0.5">{formatDate(payment.createdAt)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${credit ? "text-olive-600" : "text-olive-800"}`}>
          {credit ? "+" : ""}
          {formatNaira(payment.amount)}
        </p>
        <span
          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${getPaymentStatusColor(payment.status)}`}
        >
          {getPaymentStatusLabel(payment.status)}
        </span>
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function PaymentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // ── Orders ────────────────────────────────────────────────────
  const { orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders({ limit: 50 });

  // ── Payment history ───────────────────────────────────────────
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsFetched, setPaymentsFetched] = useState(false);

  const fetchPayments = async () => {
    if (paymentsFetched) return;
    setPaymentsLoading(true);
    try {
      const result = await paymentsApi.history(50);
      const list = Array.isArray(result)
        ? result
        : (result as unknown as { data: PaymentRecord[] }).data ?? [];
      setPayments(list);
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
      setPaymentsFetched(true);
    }
  };

  if (!paymentsFetched && !paymentsLoading) {
    void fetchPayments();
  }

  // ── Paystack callback verification ───────────────────────────
  // When Paystack redirects back, the URL contains ?reference=xxx
  // We call verify immediately so the order updates to PAID without
  // waiting for the webhook (which can be delayed or misconfigured).
  type VerifyStatus =
  | "idle"
  | "verifying"
  | "success"
  | "failed";

const [verifyStatus, setVerifyStatus] =
  useState<VerifyStatus>("idle");
  const verifyAttempted = useRef(false);

  useEffect(() => {
    const reference =
      searchParams.get("reference") ?? searchParams.get("trxref");

    if (!reference) return;
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    const verify = async () => {
      setVerifyStatus("verifying");
      try {
        await paymentsApi.verify(reference);
        setVerifyStatus("success");

        // Refetch orders so PAID status is reflected immediately
        await refetchOrders();

        // Also refresh payment history
        setPaymentsFetched(false);
        setPayments([]);
      } catch (err) {
        console.error("Payment verification failed:", err);
        setVerifyStatus("failed");
      }
    };

    void verify();
  }, [searchParams]);

  // Auto-dismiss success banner after 5 seconds
  useEffect(() => {
    if (verifyStatus !== "success") return;
    const t = setTimeout(() => setVerifyStatus("idle"), 5000);
    return () => clearTimeout(t);
  }, [verifyStatus]);

  // ── Derive stats ──────────────────────────────────────────────
  const myOrders = orders.filter(
    (o) => o.sellerId === user?.id || o.buyerId === user?.id,
  );

  const totalInEscrow = myOrders
    .filter((o) => o.escrowStatus === "HOLDING")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  const totalReleased = myOrders
    .filter((o) => o.escrowStatus === "RELEASED")
    .reduce((sum, o) => sum + parseFloat(o.sellerPayout), 0);

  const pendingPaymentOrders = myOrders.filter(
    (o) =>
      o.status === "AWAITING_PAYMENT" &&
      (o.buyerId === user?.id ||
        o.buyerEmail?.toLowerCase() === user?.email?.toLowerCase()),
  );

  const orderMap = Object.fromEntries(orders.map((o) => [o.id, o]));

  // ── Initiate payment ──────────────────────────────────────────
  const [initiatingOrderId, setInitiatingOrderId] = useState<string | null>(null);

  const handlePayNow = async (orderId: string) => {
    setInitiatingOrderId(orderId);
    try {
      const result = await paymentsApi.initiate(
        orderId,
        // Return to THIS page with the reference so we can verify
        `${window.location.origin}/dashboard/payments?callback=true`,
      );
      window.location.href = result.authorizationUrl;
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setInitiatingOrderId(null);
    }
  };

  const isLoading = ordersLoading || paymentsLoading;

  if (isLoading && !paymentsFetched) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Verification status banner ─────────────────────────── */}
      {verifyStatus === "verifying" && (
        <div className="fixed top-0 inset-x-0 z-50 bg-yellow-500 text-white text-sm font-semibold text-center py-3 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Verifying your payment with Paystack...
        </div>
      )}
      {verifyStatus === "success" && (
        <div className="fixed top-0 inset-x-0 z-50 bg-green-600 text-white text-sm font-semibold text-center py-3">
          ✓ Payment confirmed — your order is now PAID
        </div>
      )}
      {verifyStatus === "failed" && (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-500 text-white text-sm font-semibold text-center py-3">
          Payment verification failed — please contact support or try again
        </div>
      )}

      {/* ── MOBILE VIEW ──────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader title="Payments" showBack={false} />

        <div
          className={`px-4 pt-4 pb-6 space-y-4 ${
            verifyStatus !== "idle" ? "mt-10" : ""
          }`}
        >
          {/* Pending payments */}
          {pendingPaymentOrders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-olive-800">
                Awaiting Payment
              </h3>
              {pendingPaymentOrders.map((order) => (
                <div key={order.id} className="clay-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold text-olive-400 uppercase tracking-wider mb-0.5">
                        Order summary
                      </p>
                      <p className="text-sm font-semibold text-olive-800">
                        {order.trackingCode} · {order.description}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-olive-700">
                      {formatNaira(order.totalAmount)}
                    </span>
                  </div>

                  <div className="clay-inset p-4 rounded-xl mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-olive-700">Amount</p>
                      <p className="text-2xl font-bold text-olive-900">
                        {formatNaira(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePayNow(order.id)}
                    disabled={initiatingOrderId === order.id}
                    className="clay-btn w-full py-4 text-base disabled:opacity-60"
                  >
                    {initiatingOrderId === order.id
                      ? "Redirecting to Paystack..."
                      : "Pay Now"}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <ShieldCheck size={14} className="text-olive-500" />
                    <p className="text-xs text-olive-500">
                      Secured by EaseWaybill Escrow
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Escrow balance */}
          <div className="clay-card-dark text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-olive-200" />
                <p className="text-sm font-semibold text-olive-100">
                  Total in Escrow
                </p>
              </div>
              <TrendingUp size={16} className="text-olive-300" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {formatNaira(totalInEscrow)}
            </p>
            <p className="text-xs text-olive-300">
              {myOrders.filter((o) => o.escrowStatus === "HOLDING").length}{" "}
              active orders
            </p>
          </div>

          {/* Payment history */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-olive-800">
                Payment history
              </h3>
              <span className="text-xs text-olive-500">
                {payments.length} transactions
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="clay-card py-10 text-center">
                <Receipt size={36} className="text-olive-300 mx-auto mb-3" />
                <p className="text-sm text-olive-400">No payments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <MobilePaymentRow
                    key={payment.id}
                    payment={payment}
                    order={orderMap[payment.orderId]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP VIEW ─────────────────────────────────────────── */}
      <div
        className={`hidden lg:block p-6 space-y-6 ${
          verifyStatus !== "idle" ? "mt-10" : ""
        }`}
      >
        <div>
          <h2 className="text-2xl font-bold text-olive-900">Payments</h2>
          <p className="text-sm text-olive-500 mt-1">
            Manage your escrow payments and transaction history
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-5">
          <SummaryCard
            icon={CreditCard}
            label="Total in Escrow"
            value={formatNaira(totalInEscrow)}
            sub={`${myOrders.filter((o) => o.escrowStatus === "HOLDING").length} active orders`}
            amber
          />
          <SummaryCard
            icon={CheckCircle}
            label="Total Released"
            value={formatNaira(totalReleased)}
            sub={`${myOrders.filter((o) => o.escrowStatus === "RELEASED").length} completed orders`}
          />
          <div className="clay-card-dark text-white relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={18} className="text-olive-200" />
                <p className="text-xs font-semibold text-olive-200 uppercase tracking-wider">
                  Pending Payments
                </p>
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {pendingPaymentOrders.length}
              </p>
              <p className="text-xs text-olive-300">
                orders awaiting your payment
              </p>
            </div>
          </div>
        </div>

        {/* Pending payment CTAs */}
        {pendingPaymentOrders.length > 0 && (
          <div className="space-y-3">
            {pendingPaymentOrders.map((order) => (
              <div key={order.id} className="clay-card">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background:
                          "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                        boxShadow:
                          "4px 4px 10px rgba(23,29,9,0.20), -2px -2px 6px rgba(114,143,50,0.16)",
                      }}
                    >
                      <Clock size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-olive-900">
                        {order.trackingCode} — Awaiting Payment
                      </p>
                      <p className="text-xs text-olive-500 mt-0.5">
                        {order.description} · {formatNaira(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="clay-inset px-3 py-2 text-xs text-olive-600 hover:text-olive-800 transition-colors rounded-xl"
                    >
                      View Order
                    </Link>
                    <button
                      onClick={() => handlePayNow(order.id)}
                      disabled={initiatingOrderId === order.id}
                      className="clay-btn px-6 py-2.5 text-sm whitespace-nowrap disabled:opacity-60"
                    >
                      {initiatingOrderId === order.id
                        ? "Redirecting..."
                        : "Pay Now"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment history table */}
        <div className="clay-card !p-0 overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-cream-300/50"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-50), var(--color-cream-200))",
            }}
          >
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-olive-600" />
              <h3 className="font-bold text-olive-900">Payment History</h3>
              <span className="clay-badge bg-olive-100 text-olive-700 ml-1">
                {payments.length} records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <div className="py-16 text-center">
                <Receipt size={44} className="text-olive-300 mx-auto mb-3" />
                <p className="text-sm text-olive-400 mb-2">
                  No payment records yet
                </p>
                <p className="text-xs text-olive-300">
                  Payments will appear here after you initiate a transaction
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background:
                        "linear-gradient(145deg, var(--color-cream-100), var(--color-cream-200))",
                    }}
                  >
                    {[
                      "Reference",
                      "Order",
                      "Channel",
                      "Type",
                      "Amount",
                      "Status",
                      "Date",
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
                  {payments.map((payment, idx) => {
                    const order = orderMap[payment.orderId];
                    const credit = isCredit(payment.channel);
                    return (
                      <tr
                        key={payment.id}
                        className={[
                          "hover:bg-olive-50/30 transition-colors",
                          idx !== payments.length - 1
                            ? "border-b border-cream-300/50"
                            : "",
                        ].join(" ")}
                      >
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono text-olive-600">
                            {payment.reference.slice(0, 16)}...
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-olive-700">
                            {order?.trackingCode ??
                              payment.orderId.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-olive-600">
                            {payment.channelLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {credit ? (
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
                              {credit ? "Credit" : "Debit"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-sm font-bold ${
                              credit ? "text-olive-600" : "text-olive-800"
                            }`}
                          >
                            {credit ? "+" : ""}
                            {formatNaira(payment.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getPaymentStatusColor(payment.status)}`}
                          >
                            {getPaymentStatusLabel(payment.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <time className="text-xs text-olive-400">
                            {formatDate(payment.createdAt)}
                          </time>
                        </td>
                        <td className="px-5 py-4">
                          {order && (
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="clay-inset inline-flex p-2 rounded-xl text-olive-500 hover:text-olive-800 transition-colors"
                              aria-label="View order"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}