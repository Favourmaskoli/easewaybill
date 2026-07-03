// ================================================================
// SUB-COMPONENT: ActionButtons
// ================================================================

 export function ActionButtons({
  order,
  userId,
  userEmail,
  onUpdateStatus,
  onConfirmOrder,
  onPayNow,
  isUpdating,
  isConfirming,
  isPaying,
  payError,
  isDesktop = false,
}: {
  order: Order;
  userId?: string;
  userEmail?: string;
  onUpdateStatus: (status: string) => Promise<void>;
  onConfirmOrder: () => Promise<void>;
  onPayNow: () => Promise<void>;
  isUpdating: boolean;
  isConfirming: boolean;
  isPaying: boolean;
  payError: string | null;
  isDesktop?: boolean;
}) {
  const isSeller = userId === order.sellerId;
  const isBuyer = userId === order.buyerId;

  // Before buyer confirms, they're matched by email — buyerId is still null
  const isPendingBuyerMatch =
    order.status === "PENDING_BUYER" &&
    userEmail?.toLowerCase() === order.buyerEmail?.toLowerCase();

  // After confirming, buyer must pay
  const isAwaitingPaymentMatch =
    order.status === "AWAITING_PAYMENT" &&
    (isBuyer || userEmail?.toLowerCase() === order.buyerEmail?.toLowerCase());

  const canShip = isSeller && order.status === "PAID";
  const canComplete = isBuyer && order.status === "DELIVERED";

  const shipped = ["SHIPPED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(
    order.status,
  );
  const completed = order.status === "COMPLETED";

  // ── Confirm-order banner (PENDING_BUYER) ────────────────────────
  if (isPendingBuyerMatch) {
    return (
      <div className="clay-card">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(145deg, #c084fc, #9333ea)",
              boxShadow:
                "4px 4px 10px rgba(23,29,9,0.20), -2px -2px 6px rgba(147,51,234,0.18)",
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

  // ── Pay Now banner (AWAITING_PAYMENT) ───────────────────────────
  if (isAwaitingPaymentMatch) {
    return (
      <div className="clay-card">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(145deg, #fbbf24, #d97706)",
              boxShadow:
                "4px 4px 10px rgba(23,29,9,0.20), -2px -2px 6px rgba(251,191,36,0.18)",
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
          <p className="text-xs text-olive-500">
            Secured by EaseWaybill Escrow
          </p>
        </div>
      </div>
    );
  }

  // ── Normal seller/buyer action buttons ─────────────────────────
  return (
    <div className="clay-card">
      <h3 className="font-bold text-olive-900 text-base mb-4">Order Actions</h3>
      <div
        className={`grid gap-3 ${isDesktop ? "grid-cols-2" : "grid-cols-2"}`}
      >
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