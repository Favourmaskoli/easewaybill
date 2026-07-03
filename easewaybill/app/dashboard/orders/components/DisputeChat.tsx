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
