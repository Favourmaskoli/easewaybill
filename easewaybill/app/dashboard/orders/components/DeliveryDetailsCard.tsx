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
