"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Send,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  Clock,
  X,
} from "lucide-react";

import MobilePageHeader from "@/components/layout/MobilePageHeader";
import {
  useOrder,
  useUpdateOrderStatus,
  useConfirmOrder,
} from "@/lib/hooks/useOrders";
import { useAuth } from "@/lib/hooks/useAuth";
import { paymentsApi } from "@/lib/api/payments.api";
import {
  getStatusLabel,
  getStatusColor,
  formatNaira,
} from "@/lib/utils/format";
import type { Order } from "@/lib/types/api.types";
import ConfirmReceiptModal from "@/app/dashboard/orders/components/ConfirmReceiptModal";

// ================================================================
// TYPES
// ================================================================

interface TimelineStep {
  key: string;
  label: string;
  completed: boolean;
  current: boolean;
  icon: React.ElementType;
}

interface ChatMessage {
  id: number;
  sender: "buyer" | "seller";
  message: string;
  time: string;
  isMine: boolean;
}

// ================================================================
// TIMELINE LOGIC
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

const TIMELINE_META: Record<string, { label: string; icon: React.ElementType }> = {
  PENDING_BUYER:    { label: "Created",   icon: Package },
  AWAITING_PAYMENT: { label: "Confirmed", icon: CheckCircle },
  PAID:             { label: "Paid",      icon: CreditCard },
  SHIPPED:          { label: "Shipped",   icon: Truck },
  IN_TRANSIT:       { label: "In Transit",icon: Truck },
  DELIVERED:        { label: "Delivered", icon: MapPin },
  COMPLETED:        { label: "Completed", icon: CheckCircle },
};

function buildTimeline(order: Order): TimelineStep[] {
  const currentIndex = TIMELINE_ORDER.indexOf(
    order.status as (typeof TIMELINE_ORDER)[number],
  );

  const effectiveIndex =
    currentIndex >= 0
      ? currentIndex
      : (() => {
          if (order.completedAt)      return TIMELINE_ORDER.indexOf("COMPLETED");
          if (order.deliveredAt)      return TIMELINE_ORDER.indexOf("DELIVERED");
          if (order.shippedAt)        return TIMELINE_ORDER.indexOf("SHIPPED");
          if (order.paidAt)           return TIMELINE_ORDER.indexOf("PAID");
          if (order.buyerConfirmedAt) return TIMELINE_ORDER.indexOf("AWAITING_PAYMENT");
          return TIMELINE_ORDER.indexOf("PENDING_BUYER");
        })();

  return TIMELINE_ORDER.map((status, index) => ({
    key: status,
    label: TIMELINE_META[status].label,
    icon: TIMELINE_META[status].icon,
    completed: index <= effectiveIndex,
    current: index === effectiveIndex,
  }));
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "seller",
    message: "Hi, I have dispatched the item. Please let me know when it arrives.",
    time: "6:30 PM",
    isMine: false,
  },
  {
    id: 2,
    sender: "buyer",
    message: "Got it! What is the tracking number?",
    time: "6:32 PM",
    isMine: true,
  },
];

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const searchParams = useSearchParams();
  const disputeChatRef = useRef<HTMLDivElement>(null);

  const { order, isLoading, error, refetch } = useOrder(orderId);
  const { updateStatus, isLoading: isUpdating } = useUpdateOrderStatus();
  const { confirmOrder, isLoading: isConfirming } = useConfirmOrder();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // ── Poll for status changes after returning from Paystack ───────
  useEffect(() => {
    if (!order) return;
    const isCallback = searchParams.get("callback") === "true";
    if (!isCallback) return;
    if (order.status !== "AWAITING_PAYMENT") return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      void refetch();
      if (attempts >= 12) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [order?.status, searchParams, refetch]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleSendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: "buyer",
        message: trimmed,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMine: true,
      },
    ]);
    setChatInput("");
  };

  const handleCopyTracking = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
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
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to confirm order",
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
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to start payment. Please try again.";
      setPayError(message);
      setIsPaying(false);
    }
  }, [order]);

  const handleOpenReceiptModal = useCallback(() => {
    setShowReceiptModal(true);
  }, []);

  // ✅ FIX: propagate errors so modal stays open and shows the error
  // instead of closing on failure
  const handleConfirmReceipt = useCallback(async () => {
    // This throws if the API fails — ConfirmReceiptModal catches it
    // and keeps itself open with the error message
    await handleUpdateStatus("COMPLETED");
    // Only reached if updateStatus succeeded
    setShowReceiptModal(false);
    setSuccessToast("Payment Released Successfully");
    setTimeout(() => setSuccessToast(null), 5000);
  }, [handleUpdateStatus]);

  const handleScrollToDispute = useCallback(() => {
    disputeChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading order...</p>
        </div>
      </div>
    );
  }

  // ── Error / Not found ────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Package size={44} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-3">Order not found</p>
          <Link
            href="/dashboard/orders"
            className="text-green-600 text-sm font-semibold hover:underline"
          >
            ← Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const timeline = buildTimeline(order);
  const waybillNumber = order.waybills?.[0]?.waybillNumber ?? null;

  return (
    <>
      {/* ── MOBILE VIEW ──────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader title="Order Details" />
        <div className="px-4 pt-4 pb-6 space-y-4">
          <OrderSummaryCard order={order} />
          <MobileTimeline steps={timeline} />
          <DeliveryDetailsCard
            order={order}
            waybillNumber={waybillNumber}
            onCopy={handleCopyTracking}
            copied={copied}
          />
          <ActionButtons
            order={order}
            userId={user?.id}
            userEmail={user?.email}
            onUpdateStatus={handleUpdateStatus}
            onConfirmOrder={handleConfirmOrder}
            onPayNow={handlePayNow}
            onOpenReceiptModal={handleOpenReceiptModal}
            isUpdating={isUpdating}
            isConfirming={isConfirming}
            isPaying={isPaying}
            payError={payError}
            actionError={actionError}
          />
          {/* ✅ ref attached so dispute scroll works */}
          <div ref={disputeChatRef}>
            <DisputeChat
              messages={messages}
              chatInput={chatInput}
              onInputChange={setChatInput}
              onSend={handleSendMessage}
            />
          </div>
        </div>
      </div>

      {/* ── DESKTOP VIEW ─────────────────────────────────────────── */}
      <div className="hidden lg:block p-6">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
          <Link
            href="/dashboard/orders"
            className="hover:text-gray-700 transition-colors"
          >
            Orders
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-800 font-semibold">
            {order.trackingCode}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <OrderSummaryCard order={order} isDesktop />
            <DesktopTimeline steps={timeline} />
            <DeliveryDetailsCard
              order={order}
              waybillNumber={waybillNumber}
              onCopy={handleCopyTracking}
              copied={copied}
              isDesktop
            />
            <ActionButtons
              order={order}
              userId={user?.id}
              userEmail={user?.email}
              onUpdateStatus={handleUpdateStatus}
              onConfirmOrder={handleConfirmOrder}
              onPayNow={handlePayNow}
              onOpenReceiptModal={handleOpenReceiptModal}
              isUpdating={isUpdating}
              isConfirming={isConfirming}
              isPaying={isPaying}
              payError={payError}
              actionError={actionError}
              isDesktop
            />
          </div>

          <div ref={disputeChatRef}>
            <DisputeChat
              messages={messages}
              chatInput={chatInput}
              onInputChange={setChatInput}
              onSend={handleSendMessage}
              isDesktop
            />
          </div>
        </div>
      </div>

      {/* ── Success Toast ─────────────────────────────────────────── */}
      {successToast && (
        <div
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
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={17} color="white" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "3px" }}>
              {successToast}
            </p>
            <p style={{ fontSize: "11px", opacity: 0.85, lineHeight: 1.5 }}>
              Your order is complete. Escrow funds have been released to the
              seller and payout has begun.
            </p>
          </div>
          <button
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

      {/* ── Confirm Receipt Modal ─────────────────────────────────── */}
      {showReceiptModal && (
        <ConfirmReceiptModal
          orderTrackingCode={order.trackingCode}
          amount={formatNaira(order.totalAmount)}
          onConfirm={handleConfirmReceipt}
          onDispute={() => {
            setShowReceiptModal(false);
            // ✅ FIX: scroll to dispute chat using ref instead of getElementById
            setTimeout(() => handleScrollToDispute(), 100);
          }}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* ✅ FIX: style tag inside JSX return, not floating outside */}
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
// SUB-COMPONENT: OrderSummaryCard
// ================================================================

function OrderSummaryCard({
  order,
  isDesktop = false,
}: {
  order: Order;
  isDesktop?: boolean;
}) {
  return (
    <div className="clay-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-olive-400 uppercase tracking-wider mb-0.5">
            Escrow Order
          </p>
          <h2 className="text-lg font-bold text-olive-900">
            {order.trackingCode}
          </h2>
          <p className="text-sm text-olive-600 mt-0.5">{order.description}</p>
        </div>
        <span className={`clay-badge ${getStatusColor(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className={`grid gap-3 ${isDesktop ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="clay-inset p-3 rounded-xl">
          <p className="text-[10px] font-semibold text-olive-400 uppercase tracking-wider mb-1">
            Amount
          </p>
          <p className="text-base font-bold text-olive-800">
            {formatNaira(order.totalAmount)}
          </p>
        </div>
        <div className="clay-inset p-3 rounded-xl">
          <p className="text-[10px] font-semibold text-olive-400 uppercase tracking-wider mb-1">
            Date
          </p>
          <p className="text-sm font-semibold text-olive-800">
            {new Date(order.createdAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        {isDesktop && order.seller && (
          <div className="clay-inset p-3 rounded-xl">
            <p className="text-[10px] font-semibold text-olive-400 uppercase tracking-wider mb-1">
              Seller
            </p>
            <p className="text-sm font-semibold text-olive-800 truncate">
              {order.seller.firstName} {order.seller.lastName}
            </p>
            <p className="text-xs text-olive-400 truncate">
              {order.seller.email}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <ShieldCheck size={14} className="text-green-600" />
        <span className="text-xs font-semibold text-green-700">
          Escrow: {order.escrowStatus}
        </span>
        {order.paidAt && (
          <span className="text-xs text-gray-400">
            · Paid{" "}
            {new Date(order.paidAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
        {order.completedAt && (
          <span className="text-xs text-gray-400">
            · Completed{" "}
            {new Date(order.completedAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: MobileTimeline
// ================================================================

function MobileTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="clay-card">
      <p className="text-xs font-bold text-olive-500 uppercase tracking-wider mb-4">
        Timeline / Progress
      </p>
      <div className="flex items-center justify-between px-1 overflow-x-auto">
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
                        boxShadow:
                          "3px 3px 7px rgba(23,29,9,0.22), -1px -1px 4px rgba(114,143,50,0.18)",
                        outline: step.current
                          ? "2px solid var(--color-olive-600)"
                          : undefined,
                        outlineOffset: step.current ? "2px" : undefined,
                      }
                    : undefined
                }
              >
                {step.completed ? (
                  <CheckCircle size={16} className="text-white" />
                ) : (
                  <div className="clay-inset w-8 h-8 rounded-full flex items-center justify-center">
                    <Circle size={14} className="text-olive-300" />
                  </div>
                )}
              </div>
              <span
                className={`text-[9px] mt-1.5 font-semibold text-center leading-tight whitespace-nowrap ${
                  step.completed ? "text-olive-700" : "text-olive-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="h-0.5 w-5 mx-1 -mt-5 rounded-full"
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
// SUB-COMPONENT: DesktopTimeline
// ================================================================

function DesktopTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="clay-card">
      <h3 className="font-bold text-olive-900 text-base mb-6">
        Order Timeline
      </h3>
      <div className="flex items-center justify-between px-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={
                  step.completed
                    ? {
                        background:
                          "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                        boxShadow:
                          "5px 5px 12px rgba(23,29,9,0.24), -2px -2px 7px rgba(114,143,50,0.20)",
                        outline: step.current
                          ? "3px solid var(--color-olive-600)"
                          : undefined,
                        outlineOffset: step.current ? "2px" : undefined,
                      }
                    : undefined
                }
              >
                {step.completed ? (
                  <step.icon size={22} className="text-white" />
                ) : (
                  <div className="clay-inset w-12 h-12 rounded-full flex items-center justify-center">
                    <step.icon size={20} className="text-olive-300" />
                  </div>
                )}
              </div>
              <span
                className={`text-xs mt-2.5 font-semibold text-center ${
                  step.completed ? "text-olive-700" : "text-olive-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="h-0.5 flex-1 mx-2 -mt-6 rounded-full"
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
// SUB-COMPONENT: DeliveryDetailsCard
// ================================================================

function DeliveryDetailsCard({
  order,
  waybillNumber,
  isDesktop = false,
  onCopy,
  copied,
}: {
  order: Order;
  waybillNumber: string | null;
  isDesktop?: boolean;
  onCopy: (val: string) => void;
  copied: boolean;
}) {
  return (
    <div className="clay-card space-y-4">
      <h3 className="font-bold text-olive-900 text-base">Delivery Details</h3>
      <div className="clay-inset p-4 rounded-xl space-y-2">
        <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-2">
          Route
        </p>
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-olive-400 font-semibold uppercase">From</p>
            <p className="text-sm text-olive-800">{order.pickupAddress}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-olive-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-olive-400 font-semibold uppercase">To</p>
            <p className="text-sm text-olive-800">{order.deliveryAddress}</p>
          </div>
        </div>
      </div>

      {order.buyer ? (
        <div className="clay-inset p-4 rounded-xl">
          <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-2">
            Buyer Info
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
            Buyer Info (not yet confirmed)
          </p>
          <p className="text-sm font-semibold text-olive-800">
            {order.buyerName ?? "Pending confirmation"}
          </p>
          <p className="text-xs text-olive-500 mt-0.5">{order.buyerEmail}</p>
        </div>
      ) : null}

      {waybillNumber && (
        <div className="clay-inset p-4 rounded-xl">
          <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-2">
            Waybill Tracking
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-olive-800 font-mono">
              {waybillNumber}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCopy(waybillNumber)}
                className="clay-btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
                aria-label="Copy waybill number"
              >
                <Copy size={13} />
                {copied ? "Copied!" : "Copy"}
              </button>
              <Link
                href={`/track/${waybillNumber}`}
                className="clay-inset p-2 text-olive-500 hover:text-olive-800 transition-colors rounded-xl"
                aria-label="Track publicly"
              >
                <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: ActionButtons
// ================================================================

interface ActionButtonsProps {
  order: Order;
  userId?: string;
  userEmail?: string;
  onUpdateStatus: (status: string) => Promise<void>;
  onConfirmOrder: () => Promise<void>;
  onPayNow: () => Promise<void>;
  onOpenReceiptModal: () => void;
  isUpdating: boolean;
  isConfirming: boolean;
  isPaying: boolean;
  payError: string | null;
  actionError: string | null;
  isDesktop?: boolean;
}

function ActionButtons({
  order,
  userId,
  userEmail,
  onUpdateStatus,
  onConfirmOrder,
  onPayNow,
  onOpenReceiptModal,
  isUpdating,
  isConfirming,
  isPaying,
  payError,
  actionError,
  isDesktop = false,
}: ActionButtonsProps) {
  const isSeller = !!userId && userId === order.sellerId;
  const isRider  = !!userId && userId === order.riderId;

  const emailMatchesBuyer =
    !!userEmail &&
    !!order.buyerEmail &&
    userEmail.toLowerCase() === order.buyerEmail.toLowerCase();
  const isBuyer =
    (!!userId && userId === order.buyerId) || emailMatchesBuyer;

  const isPendingBuyerMatch =
    order.status === "PENDING_BUYER" && emailMatchesBuyer;
  const isAwaitingPaymentMatch =
    order.status === "AWAITING_PAYMENT" && isBuyer;

  const canShip          = isSeller && order.status === "PAID";
  const canPickup        = isRider  && order.status === "SHIPPED";
  const canMarkDelivered = isRider  && order.status === "IN_TRANSIT";
  const canCompleteOrder = isBuyer  && order.status === "DELIVERED";

  const shipped          = ["SHIPPED","IN_TRANSIT","DELIVERED","COMPLETED"].includes(order.status);
  const inTransitOrBeyond = ["IN_TRANSIT","DELIVERED","COMPLETED"].includes(order.status);
  const delivered        = ["DELIVERED","COMPLETED"].includes(order.status);
  const completed        = order.status === "COMPLETED";

  // ── 1. Confirm-order banner ──────────────────────────────────────
  if (isPendingBuyerMatch) {
    return (
      <div className="clay-card">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(145deg, #c084fc, #9333ea)",
              boxShadow: "4px 4px 10px rgba(23,29,9,0.20), -2px -2px 6px rgba(147,51,234,0.18)",
            }}
          >
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-olive-900">
              A seller created this order for you
            </p>
            <p className="text-xs text-olive-500 mt-1">
              Review the details above. Confirming links this order to your
              account and lets you pay into escrow.
            </p>
          </div>
        </div>
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 mb-3">
            {actionError}
          </div>
        )}
        <button
          onClick={() => onConfirmOrder()}
          disabled={isConfirming}
          className="clay-btn w-full py-3.5 disabled:opacity-60"
        >
          {isConfirming ? "Confirming..." : "Confirm This Order"}
        </button>
      </div>
    );
  }

  // ── 2. Pay Now banner ────────────────────────────────────────────
  if (isAwaitingPaymentMatch) {
    return (
      <div className="clay-card">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(145deg, #fbbf24, #d97706)",
              boxShadow: "4px 4px 10px rgba(23,29,9,0.20), -2px -2px 6px rgba(251,191,36,0.18)",
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
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 mb-3">
            {payError}
          </div>
        )}
        <button
          onClick={() => onPayNow()}
          disabled={isPaying}
          className="clay-btn w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isPaying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Redirecting to Paystack...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Pay Now — {formatNaira(order.totalAmount)}
            </>
          )}
        </button>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <ShieldCheck size={14} className="text-olive-500" />
          <p className="text-xs text-olive-500">Secured by EaseWaybill Escrow</p>
        </div>
      </div>
    );
  }

  // ── 3. Standard role-based action buttons ────────────────────────
  const hasAnyVisibleAction = isSeller || isBuyer || isRider;

  return (
    <div className="clay-card">
      <h3 className="font-bold text-olive-900 text-base mb-4">Order Actions</h3>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 mb-3">
          {actionError}
        </div>
      )}

      <div className="space-y-3">
        {/* Seller — Mark as Shipped */}
        {isSeller && (
          <button
            onClick={() => canShip && !isUpdating && onUpdateStatus("SHIPPED")}
            disabled={!canShip || isUpdating}
            className={[
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all",
              shipped
                ? "clay-inset text-olive-500 cursor-default"
                : canShip
                  ? "clay-btn text-white"
                  : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            {shipped ? <CheckCircle size={20} className="text-olive-500" /> : <Truck size={20} />}
            <span>{shipped ? "Shipped ✓" : "Mark as Shipped"}</span>
            <span className="text-[10px] font-normal opacity-60 ml-1">Seller</span>
          </button>
        )}

        {isSeller && order.status === "SHIPPED" && !order.riderId && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <Clock size={15} className="text-olive-500 shrink-0" />
            <p className="text-xs text-olive-600">Waiting for admin to assign a rider.</p>
          </div>
        )}
        {isSeller && order.status === "SHIPPED" && order.riderId && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <Truck size={15} className="text-olive-500 shrink-0" />
            <p className="text-xs text-olive-600">Rider assigned — waiting for pickup.</p>
          </div>
        )}
        {isSeller && order.status === "IN_TRANSIT" && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <Truck size={15} className="text-olive-500 shrink-0" />
            <p className="text-xs text-olive-600">Rider is on the way to the buyer.</p>
          </div>
        )}

        {/* Rider — Mark as Picked Up */}
        {isRider && (order.status === "SHIPPED" || inTransitOrBeyond) && (
          <button
            onClick={() => canPickup && !isUpdating && onUpdateStatus("IN_TRANSIT")}
            disabled={!canPickup || isUpdating}
            className={[
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all",
              inTransitOrBeyond
                ? "clay-inset text-olive-500 cursor-default"
                : canPickup
                  ? "clay-btn text-white"
                  : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            {inTransitOrBeyond ? <CheckCircle size={20} className="text-olive-500" /> : <Truck size={20} />}
            <span>{inTransitOrBeyond ? "Picked Up ✓" : "Mark as Picked Up"}</span>
            <span className="text-[10px] font-normal opacity-60 ml-1">Rider</span>
          </button>
        )}

        {/* Rider — Mark as Delivered */}
        {isRider && (order.status === "IN_TRANSIT" || delivered) && (
          <button
            onClick={() => canMarkDelivered && !isUpdating && onUpdateStatus("DELIVERED")}
            disabled={!canMarkDelivered || isUpdating}
            className={[
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all",
              delivered
                ? "clay-inset text-olive-500 cursor-default"
                : canMarkDelivered
                  ? "clay-btn text-white"
                  : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            {delivered ? <CheckCircle size={20} className="text-olive-500" /> : <MapPin size={20} />}
            <span>{delivered ? "Delivered ✓" : "Mark as Delivered"}</span>
            <span className="text-[10px] font-normal opacity-60 ml-1">Rider</span>
          </button>
        )}

        {/* Buyer — In Transit info */}
        {isBuyer && order.status === "IN_TRANSIT" && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <Truck size={15} className="text-olive-500 shrink-0" />
            <p className="text-xs text-olive-600">
              Your order is on the way. Confirm receipt once it arrives.
            </p>
          </div>
        )}

        {/* Buyer — Confirm Goods Received */}
        {isBuyer && (order.status === "DELIVERED" || completed) && (
          <button
            onClick={() => { if (canCompleteOrder && !isUpdating) onOpenReceiptModal(); }}
            disabled={!canCompleteOrder || isUpdating}
            className={[
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all",
              completed
                ? "clay-inset text-olive-500 cursor-default"
                : canCompleteOrder
                  ? "clay-btn text-white"
                  : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            {completed
              ? <CheckCircle size={20} className="text-olive-500" />
              : <ShieldCheck size={20} />
            }
            <span>{completed ? "Confirmed ✓" : "Confirm Goods Received"}</span>
            <span className="text-[10px] font-normal opacity-60 ml-1">Buyer</span>
          </button>
        )}

        {/* ✅ Escrow released confirmation — shown after COMPLETED */}
        {completed && (
          <div className="clay-inset px-4 py-3 rounded-xl flex items-center gap-2">
            <ShieldCheck size={15} className="text-green-600 shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Order complete — escrow funds released to seller.
            </p>
          </div>
        )}

        {!hasAnyVisibleAction && (
          <p className="text-xs text-center text-olive-400">
            Actions are only available to the seller, buyer, and rider of this order.
          </p>
        )}
      </div>

      {isUpdating && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-olive-500">Updating...</p>
        </div>
      )}
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: DisputeChat
// ================================================================

interface DisputeChatProps {
  messages: ChatMessage[];
  chatInput: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  isDesktop?: boolean;
}

function DisputeChat({
  messages,
  chatInput,
  onInputChange,
  onSend,
  isDesktop = false,
}: DisputeChatProps) {
  return (
    <div
      className={[
        "clay-card !p-0 overflow-hidden flex flex-col",
        isDesktop ? "h-[580px]" : "",
      ].join(" ")}
    >
      <div
        className="px-5 py-4 border-b border-cream-300/50 shrink-0"
        style={{
          background: "linear-gradient(145deg, var(--color-olive-50), var(--color-cream-200))",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
              boxShadow: "3px 3px 7px rgba(23,29,9,0.20), -1px -1px 4px rgba(114,143,50,0.16)",
            }}
          >
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-olive-900 text-sm">Dispute & Chat</h3>
            <p className="text-[10px] text-olive-400">
              Messages between buyer and seller
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3"
        style={{ minHeight: isDesktop ? 0 : "260px" }}
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
      </div>

      <div className="px-4 py-3 border-t border-cream-300/40 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            className="clay-input flex-1 !py-2.5"
          />
          <button
            onClick={onSend}
            disabled={!chatInput.trim()}
            className="clay-btn p-2.5 shrink-0 disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 shrink-0">
        <button
          id="open-dispute-btn"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     font-semibold text-sm text-red-600 border border-red-200/60
                     hover:bg-red-50/60 transition-colors"
        >
          <AlertTriangle size={16} />
          Open Dispute
        </button>
      </div>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: ChatBubble
// ================================================================

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end gap-2 max-w-[78%] ${
          message.isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!message.isMine && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-4 text-[10px] font-bold text-white"
            style={{
              background: "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
            }}
          >
            S
          </div>
        )}
        <div>
          <div
            className={[
              "px-3.5 py-2.5 text-sm leading-relaxed",
              message.isMine
                ? "text-white rounded-2xl rounded-br-md"
                : "text-olive-800 rounded-2xl rounded-bl-md",
            ].join(" ")}
            style={
              message.isMine
                ? {
                    background: "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
                    boxShadow: "3px 3px 8px rgba(23,29,9,0.22), -1px -1px 4px rgba(114,143,50,0.16)",
                  }
                : {
                    background: "linear-gradient(145deg, var(--color-cream-200), var(--color-cream-300))",
                    boxShadow: "inset 2px 2px 5px rgba(42,53,18,0.08), inset -1px -1px 3px rgba(162,191,114,0.12)",
                    border: "1px solid rgba(162,191,114,0.2)",
                  }
            }
          >
            {message.message}
          </div>
          <p
            className={`text-[10px] text-olive-400 mt-1 ${
              message.isMine ? "text-right" : "text-left"
            }`}
          >
            {message.time}
          </p>
        </div>
      </div>
    </div>
  );
}