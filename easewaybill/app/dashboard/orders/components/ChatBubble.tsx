// ================================================================
// SUB-COMPONENT: ChatBubble
// ================================================================

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end gap-2 max-w-[78%] ${message.isMine ? "flex-row-reverse" : "flex-row"}`}
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
            className={`text-[10px] text-olive-400 mt-1 ${message.isMine ? "text-right" : "text-left"}`}
          >
            {message.time}
          </p>
        </div>
      </div>
    </div>
  );
}
