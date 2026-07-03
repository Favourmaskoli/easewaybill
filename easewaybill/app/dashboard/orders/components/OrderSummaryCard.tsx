// ================================================================
// SUB-COMPONENT: OrderSummaryCard
// ================================================================

import { Order } from "@/lib/types/api.types";

export function OrderSummaryCard({
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
      </div>
    </div>
  );
}
