"use client";

import { useState } from "react";
import { Scale, AlertTriangle, CheckCircle } from "lucide-react";
import { useAdminDisputes } from "@/lib/hooks/useAdmin";
import { adminApi } from "@/lib/api/admin.api";
import { formatNaira } from "@/lib/utils/format";
import type { AdminDispute } from "@/lib/api/admin.api";
import Link from "next/link";

const statusFilters = [
  "All",
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED_FOR_BUYER",
  "RESOLVED_FOR_SELLER",
  "CLOSED",
];

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  RESOLVED_FOR_BUYER: "bg-blue-100 text-blue-800",
  RESOLVED_FOR_SELLER: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under Review",
  RESOLVED_FOR_BUYER: "Resolved → Buyer",
  RESOLVED_FOR_SELLER: "Resolved → Seller",
  CLOSED: "Closed",
};

function DisputeCard({
  dispute,
  onRefetch,
}: {
  dispute: AdminDispute;
  onRefetch: () => void;
}) {
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const resolve = async (favourOf: "SELLER" | "BUYER") => {
    setIsActing(true);
    setActionError(null);
    try {
      const status = favourOf === "SELLER" ? "COMPLETED" : "REFUNDED";
      await adminApi.updateOrderStatus(dispute.orderId, status);
      onRefetch();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to resolve dispute";
      setActionError(message);
    } finally {
      setIsActing(false);
    }
  };

  const isOpen = ["OPEN", "UNDER_REVIEW"].includes(dispute.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/dashboard/orders/${dispute.orderId}`}
              className="text-sm font-bold text-red-600 hover:underline"
            >
              {dispute.trackingCode}
            </Link>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[dispute.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {statusLabels[dispute.status] ?? dispute.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">{dispute.reason}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Raised by {dispute.raisedByEmail} ({dispute.raisedByRole})
          </p>
        </div>
        <p className="text-sm font-bold text-gray-800 shrink-0">
          {formatNaira(dispute.orderAmount)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">
            Seller
          </p>
          <p className="text-xs text-gray-700 font-medium truncate">
            {dispute.sellerEmail}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">
            Buyer
          </p>
          <p className="text-xs text-gray-700 font-medium truncate">
            {dispute.buyerEmail}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Raised{" "}
        {new Date(dispute.createdAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
          {actionError}
        </div>
      )}

      {isOpen && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => resolve("SELLER")}
            disabled={isActing}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all disabled:opacity-50"
          >
            <CheckCircle size={13} />
            Release to Seller
          </button>
          <button
            onClick={() => resolve("BUYER")}
            disabled={isActing}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-50"
          >
            <CheckCircle size={13} />
            Refund Buyer
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const { disputes, total, isLoading, refetch } = useAdminDisputes({
    status: statusFilter === "All" ? undefined : statusFilter,
    limit: 50,
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total disputes</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={[
              "px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
              statusFilter === s
                ? "bg-red-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-red-300",
            ].join(" ")}
          >
            {s === "All" ? "All" : (statusLabels[s] ?? s)}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading disputes...</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
          <Scale size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No disputes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {disputes.map((d) => (
            <DisputeCard key={d.id} dispute={d} onRefetch={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
