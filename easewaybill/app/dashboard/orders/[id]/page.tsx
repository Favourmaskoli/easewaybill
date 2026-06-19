"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";

import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { useOrder, useUpdateOrderStatus } from "@/lib/hooks/useOrders";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getStatusLabel,
  getStatusColor,
  formatNaira,
} from "@/lib/utils/format";
import type { Order } from "@/lib/types/api.types";

// ================================================================
// TYPES
// ================================================================

interface TimelineStep {
  label: string;
  completed: boolean;
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
// HELPERS
// ================================================================

function buildTimeline(order: Order): TimelineStep[] {
  const statuses = [
    "DRAFT",
    "AWAITING_PAYMENT",
    "PAID",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
  ];
  const currentIndex = statuses.indexOf(order.status);

  return [
    {
      label: "Created",
      completed: currentIndex >= 0,
      icon: Package,
    },
    {
      label: "Paid",
      completed: currentIndex >= statuses.indexOf("PAID"),
      icon: CreditCard,
    },
    {
      label: "Shipped",
      completed: currentIndex >= statuses.indexOf("SHIPPED"),
      icon: Truck,
    },
    {
      label: "Delivered",
      completed: currentIndex >= statuses.indexOf("DELIVERED"),
      icon: MapPin,
    },
    {
      label: "Completed",
      completed: order.status === "COMPLETED",
      icon: CheckCircle,
    },
  ];
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "seller",
    message:
      "Hi, I have dispatched the item. Please let me know when it arrives.",
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
  {
    id: 3,
    sender: "seller",
    message: "I will send it shortly once the rider confirms pickup.",
    time: "6:33 PM",
    isMine: false,
  },
];

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { order, isLoading, error, refetch } = useOrder(orderId);
  const { updateStatus, isLoading: isUpdating } = useUpdateOrderStatus();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleUpdateStatus = async (status: string) => {
    if (!order) return;
    await updateStatus(order.id, status);
    refetch();
  };

  // ── Loading ────────────────────────────────────────────────────
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

  // ── Error / Not found ──────────────────────────────────────────
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
            onUpdateStatus={handleUpdateStatus}
            isUpdating={isUpdating}
          />
          <DisputeChat
            messages={messages}
            chatInput={chatInput}
            onInputChange={setChatInput}
            onSend={handleSendMessage}
          />
        </div>
      </div>

      {/* ── DESKTOP VIEW ─────────────────────────────────────────── */}
      <div className="hidden lg:block p-6">
        {/* Breadcrumb */}
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
          {/* Left — 2 cols */}
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
              onUpdateStatus={handleUpdateStatus}
              isUpdating={isUpdating}
              isDesktop
            />
          </div>

          {/* Right — 1 col */}
          <div>
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

      <div
        className={`grid gap-3 ${isDesktop ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {/* Amount */}
        <div className="clay-inset p-3 rounded-xl">
          <p className="text-[10px] font-semibold text-olive-400 uppercase tracking-wider mb-1">
            Amount
          </p>
          <p className="text-base font-bold text-olive-800">
            {formatNaira(order.totalAmount)}
          </p>
        </div>

        {/* Date */}
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

        {/* Seller — desktop only */}
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

      {/* Escrow status pill */}
      <div className="mt-3 flex items-center gap-2">
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
      </div>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: MobileTimeline
// ================================================================

interface TimelineProps {
  steps: TimelineStep[];
}

function MobileTimeline({ steps }: TimelineProps) {
  return (
    <div className="clay-card">
      <p className="text-xs font-bold text-olive-500 uppercase tracking-wider mb-4">
        Timeline / Progress
      </p>
      <div className="flex items-center justify-between px-1">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center">
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
                className={`text-[9px] mt-1.5 font-semibold text-center leading-tight ${
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

function DesktopTimeline({ steps }: TimelineProps) {
  return (
    <div className="clay-card">
      <h3 className="font-bold text-olive-900 text-base mb-6">
        Order Timeline
      </h3>
      <div className="flex items-center justify-between px-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center flex-1">
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

      {/* Addresses */}
      <div className="clay-inset p-4 rounded-xl space-y-2">
        <p className="text-[10px] font-bold text-olive-400 uppercase tracking-wider mb-2">
          Route
        </p>
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-olive-400 font-semibold uppercase">
              From
            </p>
            <p className="text-sm text-olive-800">{order.pickupAddress}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-olive-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-olive-400 font-semibold uppercase">
              To
            </p>
            <p className="text-sm text-olive-800">{order.deliveryAddress}</p>
          </div>
        </div>
      </div>

      {/* Buyer info */}
      {order.buyer && (
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
      )}

      {/* Waybill / tracking */}
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

function ActionButtons({
  order,
  userId,
  onUpdateStatus,
  isUpdating,
  isDesktop = false,
}: {
  order: Order;
  userId?: string;
  onUpdateStatus: (status: string) => Promise<void>;
  isUpdating: boolean;
  isDesktop?: boolean;
}) {
  const isSeller = userId === order.sellerId;
  const isBuyer = userId === order.buyerId;

  const canShip = isSeller && order.status === "PAID";
  const canComplete = isBuyer && order.status === "DELIVERED";

  const shipped = ["SHIPPED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(
    order.status,
  );
  const completed = order.status === "COMPLETED";

  return (
    <div className="clay-card">
      <h3 className="font-bold text-olive-900 text-base mb-4">Order Actions</h3>
      <div
        className={`grid gap-3 ${isDesktop ? "grid-cols-2" : "grid-cols-2"}`}
      >
        {/* Mark as Shipped */}
        <button
          onClick={() => canShip && !isUpdating && onUpdateStatus("SHIPPED")}
          disabled={!canShip || isUpdating}
          className={[
            "flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl font-semibold text-sm transition-all",
            shipped
              ? "clay-inset text-olive-500 cursor-default"
              : canShip
                ? "clay-btn text-white"
                : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
          ].join(" ")}
        >
          {shipped ? (
            <CheckCircle size={20} className="text-olive-500" />
          ) : (
            <Truck size={20} />
          )}
          <span>{shipped ? "Shipped ✓" : "Mark as Shipped"}</span>
          <span className="text-[10px] font-normal opacity-60">Seller</span>
        </button>

        {/* Confirm Delivery */}
        <button
          onClick={() =>
            canComplete && !isUpdating && onUpdateStatus("COMPLETED")
          }
          disabled={!canComplete || isUpdating}
          className={[
            "flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl font-semibold text-sm transition-all",
            completed
              ? "clay-inset text-olive-500 cursor-default"
              : canComplete
                ? "clay-btn text-white"
                : "clay-inset text-olive-300 cursor-not-allowed opacity-60",
          ].join(" ")}
        >
          {completed ? (
            <CheckCircle size={20} className="text-olive-500" />
          ) : (
            <ShieldCheck size={20} />
          )}
          <span>{completed ? "Confirmed ✓" : "Confirm Delivery"}</span>
          <span className="text-[10px] font-normal opacity-60">Buyer</span>
        </button>
      </div>

      {/* Role hint */}
      {!isSeller && !isBuyer && (
        <p className="text-xs text-center text-olive-400 mt-3">
          Actions are only available to the seller and buyer of this order.
        </p>
      )}

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
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-cream-300/50 shrink-0"
        style={{
          background:
            "linear-gradient(145deg, var(--color-olive-50), var(--color-cream-200))",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
              boxShadow:
                "3px 3px 7px rgba(23,29,9,0.20), -1px -1px 4px rgba(114,143,50,0.16)",
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

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3"
        style={{ minHeight: isDesktop ? 0 : "260px" }}
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
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

      {/* Dispute button */}
      <div className="px-4 pb-4 shrink-0">
        <button
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
              background:
                "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
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
                    background:
                      "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
                    boxShadow:
                      "3px 3px 8px rgba(23,29,9,0.22), -1px -1px 4px rgba(114,143,50,0.16)",
                  }
                : {
                    background:
                      "linear-gradient(145deg, var(--color-cream-200), var(--color-cream-300))",
                    boxShadow:
                      "inset 2px 2px 5px rgba(42,53,18,0.08), inset -1px -1px 3px rgba(162,191,114,0.12)",
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
