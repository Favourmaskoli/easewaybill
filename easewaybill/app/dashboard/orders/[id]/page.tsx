// app/dashboard/orders/[id]/page.tsx
// ================================================================
// ORDER DETAILS PAGE — Deep Olive Claymorphism
// ================================================================
// Shows full detail for a single escrow order including:
//   • Order summary card (ID, item, amount, status)
//   • Timeline / Progress tracker (5 steps)
//   • Delivery details & tracking info
//   • Seller / Buyer action buttons
//   • Dispute & live chat section
//
// DESKTOP (lg+):
//   Two-column layout — left: order info + timeline + delivery
//                       right: dispute & chat panel
//
// MOBILE (<lg):
//   Single-column scrollable matching "Order Details Screen"
// ================================================================

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Clock,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

// ── Shared components ─────────────────────────────────────────
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

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
// MOCK DATA
// ================================================================

/** The 5-step escrow order timeline */
const timelineSteps: TimelineStep[] = [
  { label: "Created", completed: true, icon: Package },
  { label: "Paid", completed: true, icon: CreditCard },
  { label: "Shipped", completed: true, icon: Truck },
  { label: "Delivered", completed: false, icon: MapPin },
  { label: "Completed", completed: false, icon: CheckCircle },
];

/** Mock order details — replace with API fetch by params.id */
const orderData = {
  id: "EWB-001",
  item: "iPhone 15 Pro Max",
  amount: "₦850,000",
  status: "Shipped",
  statusColor: "bg-blue-100 text-blue-700",
  seller: "Adaeze Obi",
  sellerEmail: "adaeze@email.com",
  sellerPhone: "+234 812 345 6789",
  trackingNumber: "GIG-2855567780",
  carrier: "GIG Logistics",
  waybillInfo: "Traybill info: 2855567780",
  date: "Apr 7, 2026",
  buyerConfirmed: false,
  sellerShipped: true,
};

/** Initial chat messages */
const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "seller",
    message: "Hi, I have dispatched the item with GIG Logistics.",
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
    message: "GIG-2855567780. Should arrive by Friday.",
    time: "6:33 PM",
    isMine: false,
  },
];

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  // ── Chat state ───────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");

  // ── Action feedback states ───────────────────────────────────
  const [copied, setCopied] = useState(false);

  /**
   * Appends a new message to the chat.
   */
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

  /**
   * Copies the tracking number to the clipboard.
   */
  const handleCopyTracking = () => {
    navigator.clipboard.writeText(orderData.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ============================================================
          MOBILE VIEW
          ============================================================ */}
      <div className="lg:hidden min-h-screen">
        {/* ── Sticky Page Header ─────────────────────────────── */}
        <MobilePageHeader title="Order Details" />

        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* ── Order Summary Card ─────────────────────────────── */}
          <OrderSummaryCard />

          {/* ── Timeline / Progress ────────────────────────────── */}
          <MobileTimeline steps={timelineSteps} />

          {/* ── Delivery Details ───────────────────────────────── */}
          <DeliveryDetailsCard
            onCopy={handleCopyTracking}
            copied={copied}
          />

          {/* ── Action Buttons ─────────────────────────────────── */}
          <ActionButtons />

          {/* ── Dispute & Chat ─────────────────────────────────── */}
          <DisputeChat
            messages={messages}
            chatInput={chatInput}
            onInputChange={setChatInput}
            onSend={handleSendMessage}
          />
        </div>
      </div>

      {/* ============================================================
          DESKTOP VIEW — two-column layout
          ============================================================ */}
      <div className="hidden lg:block p-6">
        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-sm text-olive-500 mb-5">
          <Link
            href="/dashboard/orders"
            className="hover:text-olive-700 transition-colors"
          >
            Orders
          </Link>
          <ChevronRight size={14} className="text-olive-400" />
          <span className="text-olive-800 font-semibold">
            {orderData.id}
          </span>
        </div>

        {/* ── Two-column layout ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-6">
          {/* ── LEFT: Order Info (spans 2 cols) ────────────────── */}
          <div className="col-span-2 space-y-5">
            {/* Order summary card */}
            <OrderSummaryCard isDesktop />

            {/* Desktop timeline */}
            <DesktopTimeline steps={timelineSteps} />

            {/* Delivery & tracking */}
            <DeliveryDetailsCard
              isDesktop
              onCopy={handleCopyTracking}
              copied={copied}
            />

            {/* Action buttons */}
            <ActionButtons isDesktop />
          </div>

          {/* ── RIGHT: Chat panel (spans 1 col) ────────────────── */}
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
// Top card showing order ID, item name, amount, status and date.
// ================================================================

interface OrderSummaryCardProps {
  isDesktop?: boolean;
}

function OrderSummaryCard({ isDesktop = false }: OrderSummaryCardProps) {
  return (
    <div className="clay-card">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-olive-400 uppercase
                        tracking-wider mb-0.5">
            Escrow Order
          </p>
          <h2 className="text-lg font-bold text-olive-900">
            {orderData.id}
          </h2>
          <p className="text-sm text-olive-600 mt-0.5">{orderData.item}</p>
        </div>
        <span className={`clay-badge ${orderData.statusColor}`}>
          {orderData.status}
        </span>
      </div>

      {/* Stats row */}
      <div
        className={`grid gap-3 ${
          isDesktop ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        {/* Amount */}
        <div className="clay-inset p-3 rounded-xl">
          <p className="text-[10px] font-semibold text-olive-400
                        uppercase tracking-wider mb-1">
            Amount
          </p>
          <p className="text-base font-bold text-olive-800">
            {orderData.amount}
          </p>
        </div>

        {/* Date */}
        <div className="clay-inset p-3 rounded-xl">
          <p className="text-[10px] font-semibold text-olive-400
                        uppercase tracking-wider mb-1">
            Date
          </p>
          <p className="text-sm font-semibold text-olive-800">
            {orderData.date}
          </p>
        </div>

        {/* Seller (desktop only — takes 3rd column) */}
        {isDesktop && (
          <div className="clay-inset p-3 rounded-xl">
            <p className="text-[10px] font-semibold text-olive-400
                          uppercase tracking-wider mb-1">
              Seller
            </p>
            <p className="text-sm font-semibold text-olive-800 truncate">
              {orderData.seller}
            </p>
            <p className="text-xs text-olive-400 truncate">
              {orderData.sellerEmail}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: MobileTimeline
// ================================================================
// Horizontal step tracker for mobile screens.
// Completed steps are filled olive circles.
// ================================================================

interface TimelineProps {
  steps: TimelineStep[];
}

function MobileTimeline({ steps }: TimelineProps) {
  return (
    <div className="clay-card">
      <p className="text-xs font-bold text-olive-500 uppercase
                    tracking-wider mb-4">
        Timeline / Progress
      </p>

      {/* Horizontal steps */}
      <div className="flex items-center justify-between px-1">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center
                           justify-center transition-all"
                style={
                  step.completed
                    ? {
                        background:
                          "linear-gradient(145deg, var(--color-olive-400)," +
                          " var(--color-olive-600))",
                        boxShadow:
                          "3px 3px 7px rgba(23,29,9,0.22)," +
                          " -1px -1px 4px rgba(114,143,50,0.18)",
                      }
                    : undefined
                }
              >
                {step.completed ? (
                  <CheckCircle size={16} className="text-white" />
                ) : (
                  <div
                    className="clay-inset w-8 h-8 rounded-full
                               flex items-center justify-center"
                  >
                    <Circle
                      size={14}
                      className="text-olive-300"
                    />
                  </div>
                )}
              </div>

              {/* Step label */}
              <span
                className={`text-[9px] mt-1.5 font-semibold text-center
                           leading-tight ${
                             step.completed
                               ? "text-olive-700"
                               : "text-olive-300"
                           }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
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
// Larger, more spacious timeline for desktop screens.
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
            {/* Step node */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className="w-12 h-12 rounded-full flex items-center
                           justify-center transition-all"
                style={
                  step.completed
                    ? {
                        background:
                          "linear-gradient(145deg," +
                          " var(--color-olive-400), var(--color-olive-600))",
                        boxShadow:
                          "5px 5px 12px rgba(23,29,9,0.24)," +
                          " -2px -2px 7px rgba(114,143,50,0.20)",
                      }
                    : undefined
                }
              >
                {step.completed ? (
                  <step.icon size={22} className="text-white" />
                ) : (
                  <div
                    className="clay-inset w-12 h-12 rounded-full
                               flex items-center justify-center"
                  >
                    <step.icon
                      size={20}
                      className="text-olive-300"
                    />
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs mt-2.5 font-semibold text-center ${
                  step.completed ? "text-olive-700" : "text-olive-300"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
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
// Shows seller info, carrier, tracking number with copy button.
// ================================================================

interface DeliveryDetailsCardProps {
  isDesktop?: boolean;
  onCopy: () => void;
  copied: boolean;
}

function DeliveryDetailsCard({
  isDesktop = false,
  onCopy,
  copied,
}: DeliveryDetailsCardProps) {
  return (
    <div className="clay-card space-y-4">
      <h3 className="font-bold text-olive-900 text-base">
        Delivery Details
      </h3>

      {/* Seller info */}
      <div className="clay-inset p-4 rounded-xl">
        <p className="text-[10px] font-bold text-olive-400 uppercase
                      tracking-wider mb-2">
          Seller Info
        </p>
        <p className="text-sm font-semibold text-olive-800">
          {orderData.seller}
        </p>
        <p className="text-xs text-olive-500 mt-0.5">
          {orderData.sellerEmail}
        </p>
        <p className="text-xs text-olive-500">{orderData.sellerPhone}</p>
      </div>

      {/* Tracking info */}
      <div className="clay-inset p-4 rounded-xl">
        <p className="text-[10px] font-bold text-olive-400 uppercase
                      tracking-wider mb-2">
          Tracking Info
        </p>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-olive-800 font-mono">
              {orderData.trackingNumber}
            </p>
            <p className="text-xs text-olive-500 mt-0.5">
              via {orderData.carrier}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Copy button */}
            <button
              onClick={onCopy}
              className="clay-btn-ghost flex items-center gap-1.5
                         px-3 py-1.5 text-xs"
              aria-label="Copy tracking number"
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy"}
            </button>

            {/* Open in new tab */}
            <button
              className="clay-inset p-2 text-olive-500
                         hover:text-olive-800 transition-colors rounded-xl"
              aria-label="Track order externally"
            >
              <ExternalLink size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: ActionButtons
// ================================================================
// Mark as Shipped (seller) and Confirm Delivery (buyer) buttons.
// ================================================================

interface ActionButtonsProps {
  isDesktop?: boolean;
}

function ActionButtons({ isDesktop = false }: ActionButtonsProps) {
  const [shipped, setShipped] = useState(orderData.sellerShipped);
  const [confirmed, setConfirmed] = useState(orderData.buyerConfirmed);

  return (
    <div className="clay-card">
      <h3 className="font-bold text-olive-900 text-base mb-4">
        Order Actions
      </h3>

      <div
        className={`grid gap-3 ${
          isDesktop ? "grid-cols-2" : "grid-cols-2"
        }`}
      >
        {/* Mark as Shipped — Seller action */}
        <button
          onClick={() => setShipped(true)}
          disabled={shipped}
          className={[
            "flex flex-col items-center justify-center gap-1.5",
            "py-4 rounded-xl font-semibold text-sm transition-all",
            shipped
              ? "clay-inset text-olive-500 cursor-default"
              : "clay-btn text-white",
          ].join(" ")}
        >
          {shipped ? (
            <CheckCircle size={20} className="text-olive-500" />
          ) : (
            <Truck size={20} />
          )}
          <span>{shipped ? "Shipped ✓" : "Mark as Shipped"}</span>
          <span
            className={`text-[10px] font-normal ${
              shipped ? "text-olive-400" : "text-white/70"
            }`}
          >
            Seller
          </span>
        </button>

        {/* Confirm Delivery — Buyer action */}
        <button
          onClick={() => setConfirmed(true)}
          disabled={confirmed}
          className={[
            "flex flex-col items-center justify-center gap-1.5",
            "py-4 rounded-xl font-semibold text-sm transition-all",
            confirmed
              ? "clay-inset text-olive-500 cursor-default"
              : "clay-btn text-white",
          ].join(" ")}
        >
          {confirmed ? (
            <CheckCircle size={20} className="text-olive-500" />
          ) : (
            <ShieldCheck size={20} />
          )}
          <span>{confirmed ? "Confirmed ✓" : "Confirm Delivery"}</span>
          <span
            className={`text-[10px] font-normal ${
              confirmed ? "text-olive-400" : "text-white/70"
            }`}
          >
            Buyer
          </span>
        </button>
      </div>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: DisputeChat
// ================================================================
// Live chat panel between buyer and seller.
// Includes an "Open Dispute" CTA at the bottom.
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
      {/* ── Chat Header ──────────────────────────────────────── */}
      <div
        className="px-5 py-4 border-b border-cream-300/50 shrink-0"
        style={{
          background:
            "linear-gradient(145deg, var(--color-olive-50)," +
            " var(--color-cream-200))",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-500)," +
                " var(--color-olive-700))",
              boxShadow:
                "3px 3px 7px rgba(23,29,9,0.20)," +
                " -1px -1px 4px rgba(114,143,50,0.16)",
            }}
          >
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-olive-900 text-sm">
              Dispute & Chat
            </h3>
            <p className="text-[10px] text-olive-400">
              {orderData.id} · {orderData.item}
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages Area ───────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4
                   space-y-3"
        style={{ minHeight: isDesktop ? 0 : "260px" }}
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* ── Chat Input Row ──────────────────────────────────── */}
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

      {/* ── Open Dispute Button ─────────────────────────────── */}
      <div className="px-4 pb-4 shrink-0">
        <button
          className="w-full flex items-center justify-center gap-2
                     py-3 rounded-xl font-semibold text-sm transition-all
                     text-red-600 border border-red-200/60
                     hover:bg-red-50/60"
          style={{
            boxShadow:
              "3px 3px 8px rgba(180,30,30,0.08)," +
              " -1px -1px 4px rgba(255,200,200,0.12)",
          }}
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
// A single chat message bubble, left-aligned for received
// messages and right-aligned for sent messages.
// ================================================================

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  return (
    <div
      className={`flex ${
        message.isMine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex items-end gap-2 max-w-[78%] ${
          message.isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* ── Sender Avatar ────────────────────────────────── */}
        {!message.isMine && (
          <div
            className="w-7 h-7 rounded-full flex items-center
                       justify-center shrink-0 mb-4 text-[10px]
                       font-bold text-white"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-500)," +
                " var(--color-olive-700))",
              boxShadow:
                "2px 2px 5px rgba(23,29,9,0.18)," +
                " -1px -1px 3px rgba(114,143,50,0.14)",
            }}
          >
            S
          </div>
        )}

        <div>
          {/* ── Message Bubble ─────────────────────────────── */}
          <div
            className={[
              "px-3.5 py-2.5 text-sm leading-relaxed",
              message.isMine
                ? // My message — olive raised bubble
                  "text-white rounded-2xl rounded-br-md"
                : // Their message — cream inset bubble
                  "text-olive-800 rounded-2xl rounded-bl-md",
            ].join(" ")}
            style={
              message.isMine
                ? {
                    background:
                      "linear-gradient(145deg, var(--color-olive-500)," +
                      " var(--color-olive-700))",
                    boxShadow:
                      "3px 3px 8px rgba(23,29,9,0.22)," +
                      " -1px -1px 4px rgba(114,143,50,0.16)",
                  }
                : {
                    background:
                      "linear-gradient(145deg, var(--color-cream-200)," +
                      " var(--color-cream-300))",
                    boxShadow:
                      "inset 2px 2px 5px rgba(42,53,18,0.08)," +
                      " inset -1px -1px 3px rgba(162,191,114,0.12)",
                    border: "1px solid rgba(162,191,114,0.2)",
                  }
            }
          >
            {message.message}
          </div>

          {/* ── Timestamp ──────────────────────────────────── */}
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