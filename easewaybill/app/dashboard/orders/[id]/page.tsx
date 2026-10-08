"use client";

import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle,
  Circle,
  Truck,
  Package,
  CreditCard,
  MapPin,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  X,
  Send,
  User,
  RefreshCw,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

import MobilePageHeader from "@/components/layout/MobilePageHeader";
import {
  useOrder,
  useUpdateOrderStatus,
  useConfirmOrder,
} from "@/lib/hooks/useOrders";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDispute } from "@/lib/hooks/useDisputes";
import { paymentsApi } from "@/lib/api/payments.api";
import {
  getStatusLabel,
  getStatusColor,
  formatNaira,
} from "@/lib/utils/format";
import type { Order, Dispute } from "@/lib/types/api.types";
import ConfirmReceiptModal from "@/app/dashboard/orders/components/ConfirmReceiptModal";
import RaiseDisputeModal from "@/app/dashboard/orders/components/RaiseDisputeModal";

import { useMessages } from "@/lib/hooks/useMessages";
import type { OrderMessage } from "@/lib/types/api.types";

// ================================================================
// TYPES
// ================================================================

interface TimelineStep {
  key: string;
  label: string;
  completed: boolean;
  current: boolean;
  icon: React.ElementType;
  timestamp: string | null;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  role: string;
  body: string;
  createdAt: string;
  isMine: boolean;
}

type MessageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; messages: Message[] };

type MessageAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; messages: Message[] }
  | { type: "FETCH_ERROR"; message: string }
  | { type: "ADD_OPTIMISTIC"; message: Message }
  | { type: "SEND_FAILED"; tempId: string };

function messageReducer(
  state: MessageState,
  action: MessageAction,
): MessageState {
  switch (action.type) {
    case "FETCH_START":
      return { status: "loading" };
    case "FETCH_SUCCESS":
      return { status: "success", messages: action.messages };
    case "FETCH_ERROR":
      return { status: "error", message: action.message };
    case "ADD_OPTIMISTIC":
      if (state.status !== "success") return state;
      return {
        status: "success",
        messages: [...state.messages, action.message],
      };
    case "SEND_FAILED":
      if (state.status !== "success") return state;
      return {
        status: "success",
        messages: state.messages.filter((m) => m.id !== action.tempId),
      };
    default:
      return state;
  }
}

// ================================================================
// TIMELINE CONSTANTS
// ================================================================

const TIMELINE_ORDER = [
  "PENDING_BUYER",
  "AWAITING_PAYMENT",
  "PAID",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
] as const;

const TIMELINE_META: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  PENDING_BUYER: { label: "Created", icon: Package },
  AWAITING_PAYMENT: { label: "Confirmed", icon: CheckCircle },
  PAID: { label: "Paid", icon: CreditCard },
  SHIPPED: { label: "Shipped", icon: Truck },
  IN_TRANSIT: { label: "In Transit", icon: Truck },
  DELIVERED: { label: "Delivered", icon: MapPin },
  COMPLETED: { label: "Completed", icon: CheckCircle },
};

function buildTimeline(order: Order): TimelineStep[] {
  const currentIndex = TIMELINE_ORDER.indexOf(
    order.status as (typeof TIMELINE_ORDER)[number],
  );

  const effectiveIndex =
    currentIndex >= 0
      ? currentIndex
      : (() => {
          if (order.completedAt) return TIMELINE_ORDER.indexOf("COMPLETED");
          if (order.deliveredAt) return TIMELINE_ORDER.indexOf("DELIVERED");
          if (order.shippedAt) return TIMELINE_ORDER.indexOf("SHIPPED");
          if (order.paidAt) return TIMELINE_ORDER.indexOf("PAID");
          if (order.buyerConfirmedAt)
            return TIMELINE_ORDER.indexOf("AWAITING_PAYMENT");
          return TIMELINE_ORDER.indexOf("PENDING_BUYER");
        })();

  const TIMESTAMP_MAP: Partial<Record<string, string | null>> = {
    PENDING_BUYER: order.createdAt,
    AWAITING_PAYMENT: order.buyerConfirmedAt ?? null,
    PAID: order.paidAt ?? null,
    SHIPPED: order.shippedAt ?? null,
    IN_TRANSIT: order.pickedUpAt ?? null,
    DELIVERED: order.deliveredAt ?? null,
    COMPLETED: order.completedAt ?? null,
  };

  return TIMELINE_ORDER.map((status, index) => ({
    key: status,
    label: TIMELINE_META[status].label,
    icon: TIMELINE_META[status].icon,
    completed: index <= effectiveIndex,
    current: index === effectiveIndex,
    timestamp: TIMESTAMP_MAP[status] ?? null,
  }));
}

// ================================================================
// MAIN PAGE
// ================================================================

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const searchParams = useSearchParams();
  const disputeRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const { order, isLoading, error, refetch } = useOrder(orderId);
  const { updateStatus, isLoading: isUpdating } = useUpdateOrderStatus();
  const { confirmOrder, isLoading: isConfirming } = useConfirmOrder();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReceiptModal, setReceiptModal] = useState(false);
  const [showDisputeModal, setDisputeModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Derived buyer identity
  const emailMatchesBuyer =
    !!user?.email &&
    !!order?.buyerEmail &&
    user.email.toLowerCase() === order.buyerEmail.toLowerCase();

  const isBuyer =
    (!!user?.id && user.id === order?.buyerId) || emailMatchesBuyer;

  const isSeller = !!user?.id && user.id === order?.sellerId;
  const isRider = !!user?.id && user.id === order?.riderId;

  // Poll for PAID after Paystack redirect
  useEffect(() => {
    if (!order) return;
    if (searchParams.get("callback") !== "true") return;
    if (order.status !== "AWAITING_PAYMENT") return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      void refetch();
      if (attempts >= 12) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [order?.status, searchParams, refetch]);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateStatus = useCallback(
    async (status: string) => {
      if (!order) return;
      setActionError(null);
      await updateStatus(order.id, status);
      await refetch();
    },
    [order, updateStatus, refetch],
  );

  const handleConfirmOrder = useCallback(async () => {
    if (!order) return;
    setActionError(null);
    try {
      const updated = await confirmOrder(order.id);
      if (updated) await refetch();
    } catch (err: unknown) {
      setActionError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to confirm order",
      );
    }
  }, [order, confirmOrder, refetch]);

  const handlePayNow = useCallback(async () => {
    if (!order) return;
    setIsPaying(true);
    setPayError(null);
    try {
      const result = await paymentsApi.initiate(
        order.id,
        `${window.location.origin}/dashboard/orders/${order.id}?callback=true`,
      );
      window.location.href = result.authorizationUrl;
    } catch (err: unknown) {
      setPayError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to start payment.",
      );
      setIsPaying(false);
    }
  }, [order]);

  const handleConfirmReceipt = useCallback(async () => {
    await handleUpdateStatus("COMPLETED");
    setReceiptModal(false);
    setSuccessToast("Payment Released Successfully");
    setTimeout(() => setSuccessToast(null), 5000);
  }, [handleUpdateStatus]);

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="clay-card text-center max-w-sm w-full mx-4 py-10">
          <Package size={44} className="text-olive-300 mx-auto mb-4" />
          <p className="text-olive-700 font-semibold mb-1">Order not found</p>
          <p className="text-olive-400 text-sm mb-5">
            This order may not exist or you may not have access to it.
          </p>
          <Link
            href="/dashboard/orders"
            className="clay-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <ArrowLeft size={15} />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const timeline = buildTimeline(order);
  const waybillNumber = order.waybills?.[0]?.waybillNumber ?? null;

  const props = {
    order,
    user,
    isBuyer,
    isSeller,
    isRider,
    emailMatchesBuyer,
    onUpdateStatus: handleUpdateStatus,
    onConfirmOrder: handleConfirmOrder,
    onPayNow: handlePayNow,
    onOpenReceiptModal: () => setReceiptModal(true),
    onOpenDispute: () => setDisputeModal(true),
    isUpdating,
    isConfirming,
    isPaying,
    payError,
    actionError,
  };

  return (
    <>
      {/* ── MOBILE ───────────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen bg-cream-100">
        <MobilePageHeader title="Order Details" />

        <div className="px-4 pt-4 pb-24 space-y-4">
          <OrderHeader
            order={order}
            waybillNumber={waybillNumber}
            onCopy={handleCopy}
            copied={copied}
          />
          <OrderTimeline steps={timeline} />
          <EscrowCard order={order} />
          <OrderSummary order={order} />
          <OrderActions {...props} />
          <div ref={disputeRef}>
            <DisputeCard
              order={order}
              isBuyer={isBuyer}
              onOpenDispute={() => setDisputeModal(true)}
            />
          </div>
          <div ref={messagesRef}>
            <OrderMessages
              orderId={order.id}
              currentUserId={user?.id ?? ""}
              currentUserName={
                user ? `${user.firstName} ${user.lastName}` : "You"
              }
              currentUserRole={user?.role ?? "USER"}
              currentUser={{
                firstName: user?.firstName ?? "",
                lastName: user?.lastName ?? "",
                role: user?.role ?? "USER",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── DESKTOP ──────────────────────────────────────────────── */}
      <div className="hidden lg:block p-6 bg-cream-100 min-h-screen">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-olive-500 mb-5"
        >
          <Link
            href="/dashboard/orders"
            className="hover:text-olive-700 transition-colors"
          >
            Orders
          </Link>
          <ChevronRight size={14} className="text-olive-400" />
          <span className="text-olive-900 font-semibold" aria-current="page">
            {order.trackingCode}
          </span>
        </nav>

        <div className="grid grid-cols-3 gap-6">
          {/* ── Left column (2/3) ─────────────────────────────────── */}
          <div className="col-span-2 space-y-5">
            <OrderHeader
              order={order}
              waybillNumber={waybillNumber}
              onCopy={handleCopy}
              copied={copied}
              isDesktop
            />
            <OrderTimeline steps={timeline} isDesktop />
            <EscrowCard order={order} isDesktop />
            <OrderSummary order={order} isDesktop />
            <OrderActions {...props} isDesktop />
          </div>

          {/* ── Right column (1/3) ───────────────────────────────── */}
          <div className="space-y-5">
            <div ref={disputeRef}>
              <DisputeCard
                order={order}
                isBuyer={isBuyer}
                onOpenDispute={() => setDisputeModal(true)}
              />
            </div>
            <div ref={messagesRef}>
              {/* <OrderMessages
                orderId={order.id}
                currentUserId={user?.id ?? ""}
                currentUserName={
                  user ? `${user.firstName} ${user.lastName}` : "You"
                }
                currentUserRole={user?.role ?? "USER"}
              /> */}
              <OrderMessages
                orderId={order.id}
                currentUserId={user?.id ?? ""}
                currentUserName={
                  user ? `${user.firstName} ${user.lastName}` : "You"
                }
                currentUserRole={user?.role ?? "USER"}
                currentUser={{
                  firstName: user?.firstName ?? "",
                  lastName: user?.lastName ?? "",
                  role: user?.role ?? "USER",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Success Toast ─────────────────────────────────────────── */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 100,
            background: "#15803d",
            color: "white",
            borderRadius: "14px",
            padding: "16px 20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            maxWidth: "340px",
            animation: "slideIn 0.3s ease",
          }}
        >
          <ShieldCheck
            size={18}
            color="white"
            style={{ flexShrink: 0, marginTop: "1px" }}
          />
          <div>
            <p
              style={{ fontWeight: 700, fontSize: "13px", marginBottom: "3px" }}
            >
              {successToast}
            </p>
            <p style={{ fontSize: "11px", opacity: 0.85, lineHeight: 1.5 }}>
              Your order is complete. Escrow funds have been released to the
              seller and payout has begun.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setSuccessToast(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            <X size={14} color="white" />
          </button>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────── */}
      {showReceiptModal && (
        <ConfirmReceiptModal
          orderTrackingCode={order.trackingCode}
          amount={formatNaira(order.totalAmount)}
          onConfirm={handleConfirmReceipt}
          onDispute={() => {
            setReceiptModal(false);
            setDisputeModal(true);
          }}
          onClose={() => setReceiptModal(false)}
        />
      )}

      {showDisputeModal && (
        <RaiseDisputeModal
          orderId={order.id}
          trackingCode={order.trackingCode}
          onSuccess={() => void refetch()}
          onClose={() => setDisputeModal(false)}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ================================================================
// COMPONENT: OrderHeader
// ================================================================

interface OrderHeaderProps {
  order: Order;
  waybillNumber: string | null;
  onCopy: (val: string) => void;
  copied: boolean;
  isDesktop?: boolean;
}

function OrderHeader({
  order,
  waybillNumber,
  onCopy,
  copied,
  isDesktop = false,
}: OrderHeaderProps) {
  return (
    <div className="clay-card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest mb-1">
            Escrow Order
          </p>
          <h1 className="text-xl font-bold text-olive-900 truncate">
            {order.trackingCode}
          </h1>
          <p className="text-sm text-olive-500 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("en-NG", {
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`clay-badge text-xs ${getStatusColor(order.status)}`}
          >
            {getStatusLabel(order.status)}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background:
                order.escrowStatus === "HOLDING"
                  ? "#fef3c7"
                  : order.escrowStatus === "RELEASED"
                    ? "#dcfce7"
                    : order.escrowStatus === "REFUNDED"
                      ? "#fce7f3"
                      : "#f3f4f6",
              color:
                order.escrowStatus === "HOLDING"
                  ? "#92400e"
                  : order.escrowStatus === "RELEASED"
                    ? "#166534"
                    : order.escrowStatus === "REFUNDED"
                      ? "#9d174d"
                      : "#374151",
            }}
          >
            Escrow: {order.escrowStatus}
          </span>
        </div>
      </div>

      {/* Waybill */}
      {waybillNumber && (
        <div className="clay-inset px-4 py-3 rounded-xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-0.5">
              Waybill Number
            </p>
            <p className="text-sm font-bold text-olive-800 font-mono truncate">
              {waybillNumber}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="Copy waybill number"
              onClick={() => onCopy(waybillNumber)}
              className="clay-btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <Link
              href={`/track/${waybillNumber}`}
              aria-label="Track shipment publicly"
              className="clay-inset p-2 rounded-xl text-olive-500 hover:text-olive-800 transition-colors"
            >
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// COMPONENT: OrderTimeline
// ================================================================

interface OrderTimelineProps {
  steps: TimelineStep[];
  isDesktop?: boolean;
}

function OrderTimeline({ steps, isDesktop = false }: OrderTimelineProps) {
  if (isDesktop) {
    return (
      <div className="clay-card">
        <h2 className="font-bold text-olive-900 text-base mb-6">
          Order Progress
        </h2>
        <div className="flex items-start justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-start flex-1">
              <div className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={
                    step.completed
                      ? {
                          background:
                            "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                          boxShadow: step.current
                            ? "0 0 0 3px var(--color-olive-300)"
                            : "4px 4px 10px rgba(23,29,9,0.22), -2px -2px 6px rgba(114,143,50,0.18)",
                        }
                      : {
                          background: "var(--color-cream-200)",
                          boxShadow:
                            "inset 2px 2px 5px rgba(42,53,18,0.08), inset -1px -1px 3px rgba(255,255,255,0.7)",
                        }
                  }
                  aria-current={step.current ? "step" : undefined}
                >
                  {step.completed ? (
                    <step.icon size={20} className="text-white" />
                  ) : (
                    <Circle size={16} className="text-olive-300" />
                  )}
                </div>

                {/* Label */}
                <p
                  className={`text-[10px] mt-2 font-semibold text-center leading-tight ${
                    step.completed ? "text-olive-700" : "text-olive-300"
                  }`}
                >
                  {step.label}
                </p>
                {step.timestamp && step.completed && (
                  <p className="text-[9px] text-olive-400 mt-0.5 text-center">
                    {new Date(step.timestamp).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-1 mt-5 rounded-full"
                  style={{
                    background: steps[index + 1].completed
                      ? "var(--color-olive-500)"
                      : "var(--color-cream-400)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mobile — horizontal scroll
  return (
    <div className="clay-card">
      <p className="text-xs font-bold text-olive-500 uppercase tracking-wider mb-4">
        Progress
      </p>
      <div className="flex items-center overflow-x-auto pb-1 scrollbar-hide gap-1">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={
                  step.completed
                    ? {
                        background:
                          "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                        boxShadow: step.current
                          ? "0 0 0 2px var(--color-olive-300)"
                          : "3px 3px 7px rgba(23,29,9,0.20)",
                      }
                    : {
                        background: "var(--color-cream-200)",
                        boxShadow:
                          "inset 2px 2px 4px rgba(42,53,18,0.07), inset -1px -1px 2px rgba(255,255,255,0.7)",
                      }
                }
              >
                {step.completed ? (
                  <CheckCircle size={15} className="text-white" />
                ) : (
                  <Circle size={13} className="text-olive-300" />
                )}
              </div>
              <span
                className={`text-[9px] mt-1 font-semibold text-center whitespace-nowrap ${
                  step.completed ? "text-olive-700" : "text-olive-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="h-px w-6 mx-0.5 -mt-4 rounded-full shrink-0"
                style={{
                  background: steps[index + 1].completed
                    ? "var(--color-olive-500)"
                    : "var(--color-cream-400)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// COMPONENT: EscrowCard
// ================================================================

interface EscrowCardProps {
  order: Order;
  isDesktop?: boolean;
}

const ESCROW_COLOR: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  PENDING: { text: "#92400e", bg: "#fef3c7", border: "#fde68a" },
  HOLDING: { text: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
  RELEASED: { text: "#166534", bg: "#dcfce7", border: "#86efac" },
  REFUNDED: { text: "#9d174d", bg: "#fce7f3", border: "#f9a8d4" },
  DISPUTED: { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

function EscrowCard({ order, isDesktop = false }: EscrowCardProps) {
  const escrowColor = ESCROW_COLOR[order.escrowStatus] ?? {
    text: "#374151",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  };
  return (
    <div
      className="clay-card"
      style={{ borderLeft: `4px solid ${escrowColor.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: escrowColor.bg }}
          >
            <ShieldCheck size={18} color={escrowColor.text} />
          </div>
          <div>
            <p className="text-xs font-bold text-olive-400 uppercase tracking-wider">
              Escrow
            </p>
            <p
              className="text-sm font-bold"
              style={{ color: escrowColor.text }}
            >
              {order.escrowStatus === "HOLDING"
                ? "Funds Held in Escrow"
                : order.escrowStatus === "RELEASED"
                  ? "Funds Released to Seller"
                  : order.escrowStatus === "REFUNDED"
                    ? "Funds Refunded to Buyer"
                    : "Awaiting Payment"}
            </p>
          </div>
        </div>
        <p className="text-lg font-bold text-olive-900">
          {formatNaira(order.totalAmount)}
        </p>
      </div>

      <div
        className={`grid gap-3 ${isDesktop ? "grid-cols-3" : "grid-cols-2"}`}
      >
        <div className="clay-inset p-3 rounded-xl">
          <p className="text-[10px] font-semibold text-olive-400 uppercase tracking-wider mb-1">
            Item Price
          </p>
          <p className="text-sm font-bold text-olive-800">
            {formatNaira(order.itemPrice)}
          </p>
        </div>
        <div className="clay-inset p-3 rounded-xl">
          <p className="text-[10px] font-semibold text-olive-400 uppercase tracking-wider mb-1">
            Delivery Fee
          </p>
          <p className="text-sm font-bold text-olive-800">
            {formatNaira(order.deliveryFee ?? "0")}
          </p>
        </div>
        {isDesktop && (
          <div className="clay-inset p-3 rounded-xl">
            <p className="text-[10px] font-semibold text-olive-400 uppercase tracking-wider mb-1">
              Platform Fee
            </p>
            <p className="text-sm font-bold text-olive-800">
              {formatNaira(order.platformFee ?? "0")}
            </p>
          </div>
        )}
      </div>

      {order.paidAt && (
        <p className="text-xs text-olive-400 mt-3">
          Paid on{" "}
          {new Date(order.paidAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      {order.completedAt && (
        <p className="text-xs text-olive-400 mt-1">
          Released on{" "}
          {new Date(order.completedAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

// ================================================================
// COMPONENT: OrderSummary
// ================================================================

interface OrderSummaryProps {
  order: Order;
  isDesktop?: boolean;
}

function OrderSummary({ order, isDesktop = false }: OrderSummaryProps) {
  return (
    <div className="clay-card space-y-4">
      <h2 className="font-bold text-olive-900 text-base">Order Details</h2>

      {/* Description */}
      <div className="clay-inset p-4 rounded-xl">
        <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-1">
          Item
        </p>
        <p className="text-sm text-olive-800 leading-relaxed">
          {order.description}
        </p>
      </div>

      {/* Route */}
      <div className="clay-inset p-4 rounded-xl space-y-3">
        <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider">
          Route
        </p>
        <div className="flex items-start gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "#dcfce7" }}
          >
            <MapPin size={12} color="#16a34a" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-olive-400 uppercase">
              Pickup
            </p>
            <p className="text-sm text-olive-800">{order.pickupAddress}</p>
          </div>
        </div>
        <div
          className="ml-3 w-px h-4 bg-olive-300 rounded-full"
          aria-hidden="true"
        />
        <div className="flex items-start gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "#fef3c7" }}
          >
            <MapPin size={12} color="#d97706" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-olive-400 uppercase">
              Delivery
            </p>
            <p className="text-sm text-olive-800">{order.deliveryAddress}</p>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div
        className={`grid gap-3 ${isDesktop ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Seller */}
        {order.seller && (
          <div className="clay-inset p-4 rounded-xl">
            <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-2">
              Seller
            </p>
            <p className="text-sm font-semibold text-olive-800">
              {order.seller.firstName} {order.seller.lastName}
            </p>
            <p className="text-xs text-olive-500 mt-0.5">
              {order.seller.email}
            </p>
            {order.seller.phone && (
              <p className="text-xs text-olive-500">{order.seller.phone}</p>
            )}
          </div>
        )}

        {/* Buyer */}
        {order.buyer ? (
          <div className="clay-inset p-4 rounded-xl">
            <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-2">
              Buyer
            </p>
            <p className="text-sm font-semibold text-olive-800">
              {order.buyer.firstName} {order.buyer.lastName}
            </p>
            <p className="text-xs text-olive-500 mt-0.5">{order.buyer.email}</p>
            {order.buyer.phone && (
              <p className="text-xs text-olive-500">{order.buyer.phone}</p>
            )}
          </div>
        ) : order.buyerEmail ? (
          <div className="clay-inset p-4 rounded-xl">
            <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-2">
              Buyer (not yet confirmed)
            </p>
            <p className="text-sm font-semibold text-olive-800">
              {order.buyerName ?? "Pending"}
            </p>
            <p className="text-xs text-olive-500 mt-0.5">{order.buyerEmail}</p>
          </div>
        ) : null}

        {/* Rider */}
        {order.rider && (
          <div className="clay-inset p-4 rounded-xl">
            <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-2">
              Rider
            </p>
            <p className="text-sm font-semibold text-olive-800">
              {order.rider.firstName} {order.rider.lastName}
            </p>
            {order.rider.phone && (
              <p className="text-xs text-olive-500 mt-0.5">
                {order.rider.phone}
              </p>
            )}
            {order.rider.vehicleType && (
              <p className="text-xs text-olive-400 mt-0.5">
                {order.rider.vehicleType}
                {order.rider.vehiclePlate
                  ? ` · ${order.rider.vehiclePlate}`
                  : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// COMPONENT: OrderActions
// ================================================================

interface OrderActionsProps {
  order: Order;
  user: { id: string; email?: string; role?: string } | null;
  isBuyer: boolean;
  isSeller: boolean;
  isRider: boolean;
  emailMatchesBuyer: boolean;
  onUpdateStatus: (status: string) => Promise<void>;
  onConfirmOrder: () => Promise<void>;
  onPayNow: () => Promise<void>;
  onOpenReceiptModal: () => void;
  onOpenDispute: () => void;
  isUpdating: boolean;
  isConfirming: boolean;
  isPaying: boolean;
  payError: string | null;
  actionError: string | null;
  isDesktop?: boolean;
}

function OrderActions({
  order,
  isBuyer,
  isSeller,
  isRider,
  emailMatchesBuyer,
  onUpdateStatus,
  onConfirmOrder,
  onPayNow,
  onOpenReceiptModal,
  onOpenDispute,
  isUpdating,
  isConfirming,
  isPaying,
  payError,
  actionError,
}: OrderActionsProps) {
  const isPendingBuyerMatch =
    order.status === "PENDING_BUYER" && emailMatchesBuyer;
  const isAwaitingPaymentMatch = order.status === "AWAITING_PAYMENT" && isBuyer;

  const canShip = isSeller && order.status === "PAID";
  const canPickup = isRider && order.status === "SHIPPED";
  const canMarkDelivered = isRider && order.status === "IN_TRANSIT";
  const canCompleteOrder = isBuyer && order.status === "DELIVERED";

  const shipped = ["SHIPPED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(
    order.status,
  );
  const inTransitOrBeyond = ["IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(
    order.status,
  );
  const delivered = ["DELIVERED", "COMPLETED"].includes(order.status);
  const completed = order.status === "COMPLETED";
  const cancelled = order.status === "CANCELLED";
  const disputed = order.status === "DISPUTED";
  const refunded = order.status === "REFUNDED";

  const hasAnyAction = isSeller || isBuyer || isRider;

  // Terminal states — no actions
  if (completed || cancelled || refunded) {
    return (
      <div className="clay-card">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: completed
                ? "#dcfce7"
                : cancelled
                  ? "#fee2e2"
                  : "#fce7f3",
            }}
          >
            {completed ? (
              <CheckCircle size={20} color="#16a34a" />
            ) : (
              <X size={20} color="#dc2626" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-olive-900">
              {completed
                ? "Order Completed"
                : cancelled
                  ? "Order Cancelled"
                  : "Order Refunded"}
            </p>
            <p className="text-xs text-olive-500 mt-0.5">
              {completed
                ? "Escrow funds have been released to the seller."
                : cancelled
                  ? "This order has been cancelled."
                  : "Payment has been refunded to the buyer."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Disputed — no buyer/seller actions, show info
  if (disputed) {
    return (
      <div className="clay-card">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#fef2f2" }}
          >
            <AlertTriangle size={20} color="#dc2626" />
          </div>
          <div>
            <p className="text-sm font-bold text-olive-900">
              Dispute Active — Escrow Locked
            </p>
            <p className="text-xs text-olive-500 mt-0.5">
              An admin is reviewing this case. No actions are available until
              the dispute is resolved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Confirm order (buyer matched by email)
  if (isPendingBuyerMatch) {
    return (
      <div className="clay-card">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(145deg, #c084fc, #9333ea)",
              boxShadow: "4px 4px 10px rgba(147,51,234,0.25)",
            }}
          >
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-olive-900">
              A seller created this order for you
            </p>
            <p className="text-xs text-olive-500 mt-1">
              Review the details carefully. Confirming links this order to your
              account and enables payment.
            </p>
          </div>
        </div>
        {actionError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
            {actionError}
          </p>
        )}
        <button
          type="button"
          onClick={() => onConfirmOrder()}
          disabled={isConfirming}
          className="clay-btn w-full py-3.5 disabled:opacity-60"
        >
          {isConfirming ? "Confirming…" : "Confirm This Order"}
        </button>
      </div>
    );
  }

  // Pay now (buyer awaiting payment)
  if (isAwaitingPaymentMatch) {
    return (
      <div className="clay-card">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(145deg, #fbbf24, #d97706)",
              boxShadow: "4px 4px 10px rgba(251,191,36,0.25)",
            }}
          >
            <Clock size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-olive-900">Awaiting Payment</p>
            <p className="text-xs text-olive-500 mt-1">
              Pay {formatNaira(order.totalAmount)} into escrow. Funds stay
              secured until you confirm delivery.
            </p>
          </div>
        </div>
        {payError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
            {payError}
          </p>
        )}
        <button
          type="button"
          onClick={() => onPayNow()}
          disabled={isPaying}
          className="clay-btn w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isPaying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Redirecting to Paystack…
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Pay Now — {formatNaira(order.totalAmount)}
            </>
          )}
        </button>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <ShieldCheck size={13} className="text-olive-400" />
          <p className="text-xs text-olive-400">
            Secured by EaseWaybill Escrow
          </p>
        </div>
      </div>
    );
  }

  // Standard role-based actions
  return (
    <div className="clay-card">
      <h2 className="font-bold text-olive-900 text-base mb-4">Actions</h2>

      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
          {actionError}
        </p>
      )}

      <div className="space-y-3">
        {/* Seller — ship */}
        {isSeller && (
          <button
            type="button"
            onClick={() => {
              if (canShip && !isUpdating) void onUpdateStatus("SHIPPED");
            }}
            disabled={!canShip || isUpdating}
            className={[
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all",
              shipped
                ? "clay-inset text-olive-500 cursor-default"
                : canShip
                  ? "clay-btn"
                  : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            {shipped ? (
              <CheckCircle size={18} className="text-olive-500" />
            ) : (
              <Truck size={18} />
            )}
            {shipped ? "Shipped ✓" : "Mark as Shipped"}
            <span className="text-[10px] font-normal opacity-60">Seller</span>
          </button>
        )}

        {isSeller && order.status === "SHIPPED" && !order.riderId && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <Clock size={14} className="text-olive-500 shrink-0" />
            <p className="text-xs text-olive-600">
              Waiting for admin to assign a rider.
            </p>
          </div>
        )}
        {isSeller && order.status === "SHIPPED" && order.riderId && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <Truck size={14} className="text-olive-500 shrink-0" />
            <p className="text-xs text-olive-600">
              Rider assigned — waiting for pickup.
            </p>
          </div>
        )}
        {isSeller && order.status === "IN_TRANSIT" && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <Truck size={14} className="text-olive-500 shrink-0" />
            <p className="text-xs text-olive-600">
              Rider is on the way to the buyer.
            </p>
          </div>
        )}

        {/* Rider — pickup */}
        {isRider && (order.status === "SHIPPED" || inTransitOrBeyond) && (
          <button
            type="button"
            onClick={() => {
              if (canPickup && !isUpdating) void onUpdateStatus("IN_TRANSIT");
            }}
            disabled={!canPickup || isUpdating}
            className={[
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all",
              inTransitOrBeyond
                ? "clay-inset text-olive-500 cursor-default"
                : canPickup
                  ? "clay-btn"
                  : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            {inTransitOrBeyond ? (
              <CheckCircle size={18} className="text-olive-500" />
            ) : (
              <Truck size={18} />
            )}
            {inTransitOrBeyond ? "Picked Up ✓" : "Mark as Picked Up"}
            <span className="text-[10px] font-normal opacity-60">Rider</span>
          </button>
        )}

        {/* Rider — deliver */}
        {isRider && (order.status === "IN_TRANSIT" || delivered) && (
          <button
            type="button"
            onClick={() => {
              if (canMarkDelivered && !isUpdating)
                void onUpdateStatus("DELIVERED");
            }}
            disabled={!canMarkDelivered || isUpdating}
            className={[
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all",
              delivered
                ? "clay-inset text-olive-500 cursor-default"
                : canMarkDelivered
                  ? "clay-btn"
                  : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            {delivered ? (
              <CheckCircle size={18} className="text-olive-500" />
            ) : (
              <MapPin size={18} />
            )}
            {delivered ? "Delivered ✓" : "Mark as Delivered"}
            <span className="text-[10px] font-normal opacity-60">Rider</span>
          </button>
        )}

        {/* Buyer — in transit info */}
        {isBuyer && order.status === "IN_TRANSIT" && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <Truck size={14} className="text-olive-500 shrink-0" />
            <p className="text-xs text-olive-600">
              Your order is on the way. Confirm receipt once it arrives.
            </p>
          </div>
        )}

        {/* Buyer — confirm receipt */}
        {isBuyer && order.status === "DELIVERED" && (
          <button
            type="button"
            onClick={() => {
              if (canCompleteOrder && !isUpdating) onOpenReceiptModal();
            }}
            disabled={!canCompleteOrder || isUpdating}
            className="clay-btn w-full flex items-center justify-center gap-2.5 py-4 text-sm font-semibold"
          >
            <ShieldCheck size={18} />
            Confirm Goods Received
            <span className="text-[10px] font-normal opacity-70">Buyer</span>
          </button>
        )}

        {/* Buyer — raise dispute (on delivered orders) */}
        {isBuyer && order.status === "DELIVERED" && (
          <button
            type="button"
            onClick={onOpenDispute}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-red-600 border border-red-200/60 hover:bg-red-50/60 transition-colors"
          >
            <AlertTriangle size={15} />
            Raise a Dispute
          </button>
        )}

        {!hasAnyAction && (
          <p className="text-xs text-center text-olive-400 py-2">
            Actions are only available to the seller, buyer, and rider of this
            order.
          </p>
        )}
      </div>

      {isUpdating && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-olive-500">Updating…</p>
        </div>
      )}
    </div>
  );
}

// ================================================================
// COMPONENT: DisputeCard
// ================================================================

interface DisputeCardProps {
  order: Order;
  isBuyer: boolean;
  onOpenDispute: () => void;
}

function DisputeCard({ order, isBuyer, onOpenDispute }: DisputeCardProps) {
  const { dispute, isLoading } = useDispute(order.id);

  const isDisputed = order.status === "DISPUTED";
  const isDelivered = order.status === "DELIVERED";
  const hasDispute = !!dispute;

  if (!isBuyer && !hasDispute && !isDisputed) return null;
  if (!isDelivered && !isDisputed && !hasDispute) return null;

  const isOpen =
    !dispute || dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW";

  return (
    <div className="clay-card !p-0 overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-cream-300/50"
        style={{
          background:
            hasDispute && !isOpen
              ? "linear-gradient(145deg, #f0fdf4, #dcfce7)"
              : hasDispute || isDisputed
                ? "linear-gradient(145deg, #fef2f2, #fee2e2)"
                : "linear-gradient(145deg, var(--color-olive-50), var(--color-cream-200))",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background:
                hasDispute && !isOpen
                  ? "#dcfce7"
                  : hasDispute || isDisputed
                    ? "#fee2e2"
                    : "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
            }}
          >
            <AlertTriangle
              size={16}
              color={
                hasDispute && !isOpen
                  ? "#16a34a"
                  : hasDispute || isDisputed
                    ? "#dc2626"
                    : "white"
              }
            />
          </div>
          <div>
            <h3 className="font-bold text-olive-900 text-sm">
              {hasDispute ? "Dispute" : "Dispute & Issues"}
            </h3>
            <p className="text-[10px] text-olive-400">
              {hasDispute && isOpen
                ? "Escrow locked — admin review in progress"
                : hasDispute
                  ? "Dispute resolved"
                  : "Have an issue with this delivery?"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ) : hasDispute && dispute ? (
          <DisputeDetails dispute={dispute} />
        ) : (
          isBuyer &&
          isDelivered && (
            <>
              <div className="clay-inset p-4 rounded-xl">
                <p className="text-xs text-olive-600 leading-relaxed">
                  If you have an issue with the goods or delivery, raise a
                  dispute <strong>before</strong> confirming receipt. Your
                  escrow payment will remain locked while an admin reviews the
                  case.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenDispute}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-red-600 border border-red-200/60 hover:bg-red-50/60 transition-colors"
              >
                <AlertTriangle size={15} />
                Open Dispute
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}

function DisputeDetails({ dispute }: { dispute: Dispute }) {
  const isOpen = ["OPEN", "UNDER_REVIEW"].includes(dispute.status);

  const STATUS_LABEL: Record<string, string> = {
    OPEN: "Open — Escrow Locked",
    UNDER_REVIEW: "Under Admin Review",
    RESOLVED_FOR_BUYER: "Resolved — Refund Issued",
    RESOLVED_FOR_SELLER: "Resolved — Payment Released",
    CLOSED: "Closed",
  };

  const STATUS_SUB: Record<string, string> = {
    OPEN: "Escrow funds are held pending admin resolution",
    UNDER_REVIEW: "An admin is actively reviewing your case",
    RESOLVED_FOR_BUYER: "Your refund has been processed",
    RESOLVED_FOR_SELLER: "Escrow has been released to the seller",
    CLOSED: "This dispute has been closed",
  };

  return (
    <>
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{
          background: isOpen ? "#fef2f2" : "#f0fdf4",
          border: isOpen ? "1px solid #fecaca" : "1px solid #bbf7d0",
        }}
      >
        {isOpen ? (
          <AlertTriangle
            size={15}
            color="#dc2626"
            className="shrink-0 mt-0.5"
          />
        ) : (
          <CheckCircle size={15} color="#16a34a" className="shrink-0 mt-0.5" />
        )}
        <div>
          <p
            className="text-sm font-bold"
            style={{ color: isOpen ? "#991b1b" : "#166534" }}
          >
            {STATUS_LABEL[dispute.status] ?? dispute.status}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: isOpen ? "#dc2626" : "#16a34a" }}
          >
            {STATUS_SUB[dispute.status] ?? ""}
          </p>
        </div>
      </div>

      <div className="clay-inset p-4 rounded-xl space-y-1">
        <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider">
          Reason
        </p>
        <p className="text-sm font-semibold text-olive-800">
          {dispute.reason.replace(/_/g, " ")}
        </p>
        {dispute.description && (
          <p className="text-xs text-olive-500 leading-relaxed mt-1">
            {dispute.description}
          </p>
        )}
      </div>

      {dispute.resolution && (
        <div className="clay-inset p-4 rounded-xl space-y-1">
          <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider">
            Admin Resolution
          </p>
          <p className="text-xs text-olive-600 leading-relaxed">
            {dispute.resolution}
          </p>
          {dispute.resolvedAt && (
            <p className="text-[10px] text-olive-400 mt-1">
              Resolved{" "}
              {new Date(dispute.resolvedAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] text-olive-400">
        Raised{" "}
        {new Date(dispute.createdAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </>
  );
}
// ================================================================
// COMPONENT: OrderMessages — wired to real backend
// ================================================================

interface OrderMessagesProps {
  orderId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  currentUser: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

function OrderMessages({
  orderId,
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUser,
}: OrderMessagesProps) {
  const {
    messages,
    isLoading,
    isError,
    errorMessage,
    sending,
    sendError,
    send,
    refetch,
    clearSendError,
  } = useMessages(orderId, currentUserId, currentUser);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // // Auto-scroll to latest message
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages.length]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    const ok = await send(trimmed);
    if (ok) {
      setInput("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <section
      aria-label="Order messages"
      className="clay-card !p-0 overflow-hidden flex flex-col"
      style={{ minHeight: "340px" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-cream-300/50 shrink-0"
        style={{
          background:
            "linear-gradient(145deg, var(--color-olive-50), var(--color-cream-200))",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
                boxShadow:
                  "3px 3px 7px rgba(23,29,9,0.20), -1px -1px 4px rgba(114,143,50,0.16)",
              }}
            >
              <MessageCircle
                size={15}
                className="text-white"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="font-bold text-olive-900 text-sm">Messages</h3>
              <p className="text-[10px] text-olive-400">
                {messages.length > 0
                  ? `${messages.length} message${messages.length === 1 ? "" : "s"}`
                  : "Order communication thread"}
              </p>
            </div>
          </div>
          {isError && (
            <button
              type="button"
              aria-label="Retry loading messages"
              onClick={() => void refetch()}
              className="clay-inset p-2 rounded-xl text-olive-500 hover:text-olive-800 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Message list */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Message thread"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ minHeight: "180px", maxHeight: "360px" }}
      >
        {isLoading && (
          <div className="space-y-3" aria-label="Loading messages">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : ""}`}
              >
                {i % 2 !== 0 && (
                  <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
                )}
                <div
                  className="h-10 rounded-2xl animate-pulse"
                  style={{
                    background: "#f3f4f6",
                    width: i % 2 === 0 ? "55%" : "65%",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center h-full py-6 text-center">
            <AlertTriangle
              size={28}
              className="text-red-300 mb-2"
              aria-hidden="true"
            />
            <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="clay-btn mt-3 px-4 py-2 text-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{
                background:
                  "linear-gradient(145deg, var(--color-cream-200), var(--color-cream-300))",
                boxShadow:
                  "inset 2px 2px 5px rgba(42,53,18,0.07), inset -1px -1px 3px rgba(255,255,255,0.7)",
              }}
            >
              <MessageCircle
                size={20}
                className="text-olive-300"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm font-semibold text-olive-700 mb-1">
              No messages yet
            </p>
            <p className="text-xs text-olive-400 max-w-[200px] leading-relaxed">
              Send the first message. All parties on this order can read and
              reply.
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender.id === currentUserId}
            />
          ))}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="mx-4 mb-2">
          <div
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs text-red-600"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <span>{sendError}</span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={clearSendError}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={13} color="#dc2626" />
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="px-4 py-3 border-t border-cream-300/40 shrink-0">
        <div className="flex items-end gap-2">
          <div
            aria-hidden="true"
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
            }}
          >
            <User size={13} className="text-white" />
          </div>

          <div className="flex-1 clay-inset rounded-2xl px-3 py-2">
            <label htmlFor={`message-input-${orderId}`} className="sr-only">
              Type a message
            </label>
            <textarea
              id={`message-input-${orderId}`}
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              maxLength={2000}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: "13px",
                color: "var(--color-olive-800)",
                lineHeight: 1.5,
                maxHeight: "80px",
                overflowY: "auto",
              }}
            />
          </div>

          <button
            type="button"
            aria-label={sending ? "Sending message" : "Send message"}
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            className="clay-btn p-2.5 shrink-0 disabled:opacity-40"
          >
            {sending ? (
              <div
                aria-hidden="true"
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
            ) : (
              <Send size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-olive-400 mt-1.5 ml-9">
          Messages are visible to the seller, buyer, rider, and admin.
        </p>
      </div>
    </section>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: OrderMessage;
  isMine: boolean;
}) {
  const roleLabel =
    message.sender.role === "ADMIN"
      ? "Admin"
      : message.sender.role === "RIDER"
        ? "Rider"
        : "";

  return (
    <div
      className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isMine && (
        <div
          aria-hidden="true"
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
          style={{
            background:
              message.sender.role === "ADMIN"
                ? "linear-gradient(145deg, #ef4444, #dc2626)"
                : message.sender.role === "RIDER"
                  ? "linear-gradient(145deg, #f59e0b, #d97706)"
                  : "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
          }}
        >
          {message.sender.firstName.charAt(0).toUpperCase()}
        </div>
      )}

      <div
        className={`max-w-[78%] flex flex-col ${isMine ? "items-end" : "items-start"}`}
      >
        {!isMine && (
          <p className="text-[10px] text-olive-400 mb-1 ml-1 font-medium">
            {message.sender.firstName} {message.sender.lastName}
            {roleLabel && (
              <span className="ml-1 text-olive-300">· {roleLabel}</span>
            )}
          </p>
        )}

        <div
          className="px-3.5 py-2.5 text-sm leading-relaxed"
          style={
            isMine
              ? {
                  background:
                    "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
                  color: "white",
                  borderRadius: "18px 18px 4px 18px",
                  boxShadow:
                    "3px 3px 8px rgba(23,29,9,0.22), -1px -1px 4px rgba(114,143,50,0.16)",
                }
              : {
                  background:
                    "linear-gradient(145deg, var(--color-cream-100), var(--color-cream-200))",
                  color: "var(--color-olive-800)",
                  borderRadius: "18px 18px 18px 4px",
                  boxShadow:
                    "inset 2px 2px 5px rgba(42,53,18,0.06), inset -1px -1px 3px rgba(162,191,114,0.10)",
                  border: "1px solid rgba(162,191,114,0.2)",
                }
          }
        >
          {message.body}
        </div>

        <time
          dateTime={message.createdAt}
          className={`text-[10px] text-olive-400 mt-1 ml-1 ${isMine ? "text-right" : "text-left"}`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}
