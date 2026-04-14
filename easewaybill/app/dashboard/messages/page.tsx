// app/dashboard/messages/page.tsx
// ================================================================
// MESSAGES PAGE — Deep Olive Claymorphism
// ================================================================
// A full messaging interface for buyer-seller communication
// within escrow orders.
//
// DESKTOP (lg+):
//   Two-column layout — left: conversation list
//                       right: active chat window
//
// MOBILE (<lg):
//   Shows conversation list. Tapping a conversation expands
//   to a full-screen chat view (inline, no routing).
// ================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Search,
  ArrowLeft,
  Package,
  MoreVertical,
  Phone,
  CheckCheck,
  Check,
} from "lucide-react";

// ── Shared components ─────────────────────────────────────────
import MobilePageHeader from "@/components/layout/MobilePageHeader";

// ================================================================
// TYPES
// ================================================================

interface Message {
  id: number;
  text: string;
  time: string;
  isMine: boolean;
  read: boolean;
}

interface Conversation {
  id: string;
  orderId: string;
  contact: string;
  /** Initials for avatar */
  initials: string;
  item: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: Message[];
  online: boolean;
}

// ================================================================
// MOCK DATA
// ================================================================

const conversations: Conversation[] = [
  {
    id: "CONV-001",
    orderId: "EWB-001",
    contact: "Adaeze Obi",
    initials: "AO",
    item: "iPhone 15 Pro Max",
    lastMessage: "GIG-2855567780. Should arrive by Friday.",
    lastTime: "6:33 PM",
    unreadCount: 0,
    online: true,
    messages: [
      {
        id: 1,
        text: "Hi, I have dispatched the item with GIG Logistics.",
        time: "6:30 PM",
        isMine: false,
        read: true,
      },
      {
        id: 2,
        text: "Got it! What is the tracking number?",
        time: "6:32 PM",
        isMine: true,
        read: true,
      },
      {
        id: 3,
        text: "GIG-2855567780. Should arrive by Friday.",
        time: "6:33 PM",
        isMine: false,
        read: true,
      },
    ],
  },
  {
    id: "CONV-002",
    orderId: "EWB-002",
    contact: "Emeka Nwosu",
    initials: "EN",
    item: 'Samsung 65" TV',
    lastMessage: "Please confirm your payment to release the item.",
    lastTime: "2:14 PM",
    unreadCount: 2,
    online: false,
    messages: [
      {
        id: 1,
        text: "Hello, are you ready to make the payment?",
        time: "2:10 PM",
        isMine: false,
        read: true,
      },
      {
        id: 2,
        text: "Yes, I will do it shortly.",
        time: "2:12 PM",
        isMine: true,
        read: true,
      },
      {
        id: 3,
        text: "Please confirm your payment to release the item.",
        time: "2:14 PM",
        isMine: false,
        read: false,
      },
    ],
  },
  {
    id: "CONV-003",
    orderId: "EWB-004",
    contact: "Tunde Adeola",
    initials: "TA",
    item: "PS5 Console",
    lastMessage: "I want to open a dispute on this order.",
    lastTime: "Yesterday",
    unreadCount: 1,
    online: false,
    messages: [
      {
        id: 1,
        text: "The PS5 I received has a cracked disc tray.",
        time: "Yesterday",
        isMine: false,
        read: true,
      },
      {
        id: 2,
        text: "I am sorry to hear that. Can you send photos?",
        time: "Yesterday",
        isMine: true,
        read: true,
      },
      {
        id: 3,
        text: "I want to open a dispute on this order.",
        time: "Yesterday",
        isMine: false,
        read: false,
      },
    ],
  },
  {
    id: "CONV-004",
    orderId: "EWB-005",
    contact: "Chinyere Uzo",
    initials: "CU",
    item: "Laptop Stand + Hub",
    lastMessage: "Thank you! Everything arrived perfectly. ✓",
    lastTime: "Apr 3",
    unreadCount: 0,
    online: true,
    messages: [
      {
        id: 1,
        text: "The package has arrived. Everything is intact!",
        time: "Apr 3",
        isMine: false,
        read: true,
      },
      {
        id: 2,
        text: "Great! Please confirm delivery so funds are released.",
        time: "Apr 3",
        isMine: true,
        read: true,
      },
      {
        id: 3,
        text: "Thank you! Everything arrived perfectly. ✓",
        time: "Apr 3",
        isMine: false,
        read: true,
      },
    ],
  },
];

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function MessagesPage() {
  // ── Active conversation state ────────────────────────────────
  const [activeConvId, setActiveConvId] = useState<string | null>(
    "CONV-001" // Pre-select first on desktop
  );

  // ── Mobile: whether chat window is open ──────────────────────
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // ── Message input value ──────────────────────────────────────
  const [inputValue, setInputValue] = useState("");

  // ── All conversations with live message state ────────────────
  const [convos, setConvos] = useState<Conversation[]>(conversations);

  // ── Search query ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── Ref for auto-scrolling chat to bottom ───────────────────
  const chatEndRef = useRef<HTMLDivElement>(null);

  /** Scrolls the chat area to the latest message */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvId, convos]);

  /** Currently active conversation object */
  const activeConvo = convos.find((c) => c.id === activeConvId) ?? null;

  /** Filtered list based on search query */
  const filteredConvos = convos.filter(
    (c) =>
      c.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Sends a new message in the active conversation.
   */
  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !activeConvId) return;

    const newMsg: Message = {
      id: Date.now(),
      text: trimmed,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMine: true,
      read: false,
    };

    setConvos((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: trimmed,
              lastTime: newMsg.time,
            }
          : c
      )
    );
    setInputValue("");
  };

  /**
   * Opens a conversation on mobile — marks messages as read.
   */
  const handleOpenConvo = (id: string) => {
    setActiveConvId(id);
    setMobileChatOpen(true);
    // Mark unread as read
    setConvos((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  return (
    <>
      {/* ============================================================
          MOBILE VIEW
          ============================================================ */}
      <div className="lg:hidden min-h-screen">
        {mobileChatOpen && activeConvo ? (
          /* ── MOBILE: Full-screen Chat ──────────────────────── */
          <div className="flex flex-col h-screen">
            {/* Chat header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b
                         border-cream-300/50 shrink-0 sticky top-0 z-10"
              style={{
                background:
                  "linear-gradient(145deg, var(--color-cream-100)," +
                  " var(--color-cream-200))",
                boxShadow:
                  "0 2px 8px rgba(42,53,18,0.08)," +
                  " 0 1px 2px rgba(42,53,18,0.04)",
              }}
            >
              {/* Back button */}
              <button
                onClick={() => setMobileChatOpen(false)}
                className="clay-inset p-2 rounded-xl text-olive-700"
                aria-label="Back to conversations"
              >
                <ArrowLeft size={20} />
              </button>

              {/* Contact avatar */}
              <ContactAvatar
                initials={activeConvo.initials}
                online={activeConvo.online}
                size="sm"
              />

              {/* Contact info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-olive-900 truncate">
                  {activeConvo.contact}
                </p>
                <p className="text-[11px] text-olive-400 truncate">
                  {activeConvo.orderId} · {activeConvo.item}
                </p>
              </div>

              {/* More options */}
              <button
                className="clay-inset p-2 rounded-xl text-olive-500"
                aria-label="More options"
              >
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Messages scroll area */}
            <div
              className="flex-1 overflow-y-auto scrollbar-hide
                         px-4 py-4 space-y-3"
              style={{ background: "var(--color-cream-200)" }}
            >
              <DateDivider label="Today" />
              {activeConvo.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <ChatInputBar
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
            />
          </div>
        ) : (
          /* ── MOBILE: Conversation List ─────────────────────── */
          <>
            <MobilePageHeader title="Messages" showBack={false} />

            <div className="px-4 pt-4 pb-6 space-y-3">
              {/* Search */}
              <div className="clay-inset flex items-center gap-2 px-3.5 py-3">
                <Search size={15} className="text-olive-400 shrink-0" />
                <input
                  type="search"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-olive-800
                             outline-none placeholder:text-olive-400 w-full"
                />
              </div>

              {/* Total unread badge */}
              {convos.some((c) => c.unreadCount > 0) && (
                <p className="text-xs text-olive-500 font-medium px-1">
                  {convos.reduce((a, c) => a + c.unreadCount, 0)} unread
                  messages
                </p>
              )}

              {/* Conversation rows */}
              {filteredConvos.map((convo) => (
                <ConversationRow
                  key={convo.id}
                  convo={convo}
                  isActive={false}
                  onClick={() => handleOpenConvo(convo.id)}
                />
              ))}

              {filteredConvos.length === 0 && (
                <div className="clay-card py-10 text-center">
                  <p className="text-sm text-olive-400">
                    No conversations found
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ============================================================
          DESKTOP VIEW — two-column split layout
          ============================================================ */}
      <div className="hidden lg:flex h-[calc(100vh-73px)]">
        {/* ── LEFT: Conversation List ────────────────────────── */}
        <div
          className="w-80 shrink-0 flex flex-col border-r border-cream-300/60"
          style={{
            background:
              "linear-gradient(180deg, var(--color-cream-100)," +
              " var(--color-cream-200))",
          }}
        >
          {/* List header */}
          <div className="p-4 border-b border-cream-300/50 shrink-0">
            <h2 className="text-lg font-bold text-olive-900 mb-3">
              Messages
            </h2>

            {/* Search */}
            <div className="clay-inset flex items-center gap-2 px-3 py-2.5">
              <Search size={14} className="text-olive-400 shrink-0" />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-olive-800
                           outline-none placeholder:text-olive-400 w-full"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
            {filteredConvos.map((convo) => (
              <ConversationRow
                key={convo.id}
                convo={convo}
                isActive={convo.id === activeConvId}
                onClick={() => {
                  setActiveConvId(convo.id);
                  setConvos((prev) =>
                    prev.map((c) =>
                      c.id === convo.id ? { ...c, unreadCount: 0 } : c
                    )
                  );
                }}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT: Active Chat Window ──────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-5 py-4
                           border-b border-cream-300/50 shrink-0"
                style={{
                  background:
                    "linear-gradient(145deg, var(--color-cream-100)," +
                    " var(--color-cream-200))",
                }}
              >
                <div className="flex items-center gap-3">
                  <ContactAvatar
                    initials={activeConvo.initials}
                    online={activeConvo.online}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-bold text-olive-900">
                      {activeConvo.contact}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Package size={11} className="text-olive-400" />
                      <p className="text-xs text-olive-400">
                        {activeConvo.orderId} · {activeConvo.item}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-2">
                  <button
                    className="clay-inset p-2 rounded-xl text-olive-500
                               hover:text-olive-800 transition-colors"
                    aria-label="Call"
                  >
                    <Phone size={17} />
                  </button>
                  <button
                    className="clay-inset p-2 rounded-xl text-olive-500
                               hover:text-olive-800 transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical size={17} />
                  </button>
                </div>
              </div>

              {/* Messages scroll area */}
              <div
                className="flex-1 overflow-y-auto scrollbar-hide
                           px-5 py-4 space-y-3"
                style={{ background: "var(--color-cream-200)" }}
              >
                <DateDivider label="Today" />
                {activeConvo.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input bar */}
              <ChatInputBar
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
              />
            </>
          ) : (
            /* Empty state when no convo selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center
                             justify-center mx-auto mb-4"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-olive-400)," +
                      " var(--color-olive-600))",
                    boxShadow:
                      "6px 6px 14px rgba(23,29,9,0.22)," +
                      " -3px -3px 8px rgba(114,143,50,0.18)",
                  }}
                >
                  <Send size={28} className="text-white" />
                </div>
                <p className="text-base font-bold text-olive-700 mb-1">
                  Select a conversation
                </p>
                <p className="text-sm text-olive-400">
                  Choose a chat from the left to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ================================================================
// SUB-COMPONENT: ContactAvatar
// ================================================================
// Shows contact initials with an online indicator dot.
// ================================================================

interface ContactAvatarProps {
  initials: string;
  online: boolean;
  size?: "sm" | "md" | "lg";
}

function ContactAvatar({
  initials,
  online,
  size = "md",
}: ContactAvatarProps) {
  const dimensions = { sm: "w-9 h-9 text-xs", md: "w-11 h-11 text-sm", lg: "w-14 h-14 text-base" };
  const dotSize = { sm: "w-2.5 h-2.5", md: "w-3 h-3", lg: "w-3.5 h-3.5" };

  return (
    <div className="relative shrink-0">
      {/* Avatar circle */}
      <div
        className={`${dimensions[size]} rounded-full flex items-center
                   justify-center font-bold text-white`}
        style={{
          background:
            "linear-gradient(145deg, var(--color-olive-500)," +
            " var(--color-olive-700))",
          boxShadow:
            "3px 3px 8px rgba(23,29,9,0.20)," +
            " -1px -1px 4px rgba(114,143,50,0.16)",
        }}
      >
        {initials}
      </div>

      {/* Online indicator */}
      {online && (
        <span
          className={`absolute bottom-0 right-0 ${dotSize[size]}
                     bg-green-400 rounded-full
                     ring-2 ring-cream-200`}
        />
      )}
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: ConversationRow
// ================================================================
// A single clickable conversation preview row in the list.
// ================================================================

interface ConversationRowProps {
  convo: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function ConversationRow({
  convo,
  isActive,
  onClick,
}: ConversationRowProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 p-3 rounded-xl text-left",
        "transition-all duration-150",
        isActive
          ? "clay-card shadow-none"
          : "hover:bg-olive-50/50",
      ].join(" ")}
    >
      {/* Avatar */}
      <ContactAvatar
        initials={convo.initials}
        online={convo.online}
        size="md"
      />

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-sm truncate ${
              convo.unreadCount > 0
                ? "font-bold text-olive-900"
                : "font-semibold text-olive-800"
            }`}
          >
            {convo.contact}
          </p>
          <span className="text-[10px] text-olive-400 shrink-0">
            {convo.lastTime}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-olive-500 truncate">
            {convo.lastMessage}
          </p>

          {/* Unread badge */}
          {convo.unreadCount > 0 && (
            <span
              className="shrink-0 w-5 h-5 flex items-center justify-center
                         rounded-full text-[10px] font-bold text-white"
              style={{
                background:
                  "linear-gradient(145deg, var(--color-olive-500)," +
                  " var(--color-olive-700))",
                boxShadow:
                  "2px 2px 5px rgba(23,29,9,0.18)," +
                  " -1px -1px 3px rgba(114,143,50,0.14)",
              }}
            >
              {convo.unreadCount}
            </span>
          )}
        </div>

        {/* Order tag */}
        <p className="text-[10px] text-olive-400 mt-0.5">
          {convo.orderId} · {convo.item}
        </p>
      </div>
    </button>
  );
}

// ================================================================
// SUB-COMPONENT: MessageBubble
// ================================================================
// A single chat message — olive raised for mine,
// cream inset for theirs.
// ================================================================

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${
        message.isMine ? "justify-end" : "justify-start"
      }`}
    >
      <div className={`max-w-[72%]`}>
        {/* Bubble */}
        <div
          className="px-4 py-2.5 text-sm leading-relaxed"
          style={
            message.isMine
              ? {
                  // Sent message — olive raised
                  background:
                    "linear-gradient(145deg, var(--color-olive-500)," +
                    " var(--color-olive-700))",
                  color: "white",
                  borderRadius: "1rem 1rem 0.25rem 1rem",
                  boxShadow:
                    "4px 4px 10px rgba(23,29,9,0.22)," +
                    " -2px -2px 6px rgba(114,143,50,0.16)",
                }
              : {
                  // Received message — cream inset
                  background:
                    "linear-gradient(145deg, var(--color-cream-100)," +
                    " var(--color-cream-300))",
                  color: "var(--color-olive-800)",
                  borderRadius: "1rem 1rem 1rem 0.25rem",
                  boxShadow:
                    "inset 2px 2px 5px rgba(42,53,18,0.07)," +
                    " inset -1px -1px 3px rgba(162,191,114,0.10)",
                  border: "1px solid rgba(162,191,114,0.18)",
                }
          }
        >
          {message.text}
        </div>

        {/* Timestamp + read receipt */}
        <div
          className={`flex items-center gap-1 mt-1 ${
            message.isMine ? "justify-end" : "justify-start"
          }`}
        >
          <time className="text-[10px] text-olive-400">{message.time}</time>
          {message.isMine && (
            message.read ? (
              <CheckCheck size={12} className="text-olive-500" />
            ) : (
              <Check size={12} className="text-olive-400" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: DateDivider
// ================================================================
// A centered date label between message groups.
// ================================================================

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-cream-300/60" />
      <span
        className="text-[11px] font-semibold text-olive-400 px-3 py-1
                   rounded-full clay-inset"
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-cream-300/60" />
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: ChatInputBar
// ================================================================
// The message input row at the bottom of any chat view.
// Shared between mobile and desktop layouts.
// ================================================================

interface ChatInputBarProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
}

function ChatInputBar({ value, onChange, onSend }: ChatInputBarProps) {
  return (
    <div
      className="px-4 py-3 border-t border-cream-300/50 shrink-0"
      style={{
        background:
          "linear-gradient(145deg, var(--color-cream-100)," +
          " var(--color-cream-200))",
      }}
    >
      <div className="flex items-center gap-2">
        {/* Text input */}
        <input
          type="text"
          placeholder="Type a message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          className="clay-input flex-1 !py-2.5"
        />

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="clay-btn p-2.5 shrink-0 disabled:opacity-40
                     transition-all"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}