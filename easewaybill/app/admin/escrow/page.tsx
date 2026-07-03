"use client";

import { useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAdminEscrow } from "@/lib/hooks/useAdmin";
import { formatNaira } from "@/lib/utils/format";
import Link from "next/link";

const typeFilters = [
  "All",
  "ESCROW_HOLD",
  "FULL_RELEASE",
  "PARTIAL_RELEASE",
  "REFUND",
  "PLATFORM_FEE",
];

const typeColors: Record<string, string> = {
  ESCROW_HOLD: "bg-yellow-100 text-yellow-800",
  FULL_RELEASE: "bg-green-100 text-green-800",
  PARTIAL_RELEASE: "bg-teal-100 text-teal-800",
  REFUND: "bg-red-100 text-red-800",
  PLATFORM_FEE: "bg-indigo-100 text-indigo-800",
};

const typeLabels: Record<string, string> = {
  ESCROW_HOLD: "Escrow Hold",
  FULL_RELEASE: "Full Release",
  PARTIAL_RELEASE: "Partial Release",
  REFUND: "Refund",
  PLATFORM_FEE: "Platform Fee",
};

function isCredit(type: string): boolean {
  return ["FULL_RELEASE", "PARTIAL_RELEASE"].includes(type);
}

export default function AdminEscrowPage() {
  const [typeFilter, setTypeFilter] = useState("All");

  const { entries, total, isLoading } = useAdminEscrow({
    type: typeFilter === "All" ? undefined : typeFilter,
    limit: 50,
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escrow Ledger</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total transactions</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {typeFilters.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={[
              "px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
              typeFilter === t
                ? "bg-red-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-red-300",
            ].join(" ")}
          >
            {t === "All" ? "All" : (typeLabels[t] ?? t)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading ledger...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Order", "Type", "Amount", "Status", "Actor", "Date"].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const credit = isCredit(entry.type);
                  return (
                    <tr
                      key={entry.id}
                      className={[
                        "hover:bg-gray-50/50 transition-colors",
                        idx !== entries.length - 1
                          ? "border-b border-gray-50"
                          : "",
                      ].join(" ")}
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/orders/${entry.orderId}`}
                          className="text-sm font-bold text-red-600 hover:underline"
                        >
                          {entry.trackingCode}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${typeColors[entry.type] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {typeLabels[entry.type] ?? entry.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {credit ? (
                            <ArrowUpRight
                              size={14}
                              className="text-green-500"
                            />
                          ) : (
                            <ArrowDownRight
                              size={14}
                              className="text-red-500"
                            />
                          )}
                          <span
                            className={`text-sm font-bold ${credit ? "text-green-700" : "text-gray-800"}`}
                          >
                            {formatNaira(entry.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${entry.paymentStatus === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {entry.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500">
                          {entry.actorEmail ?? "System"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <time className="text-xs text-gray-400">
                          {new Date(entry.createdAt).toLocaleDateString(
                            "en-NG",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </time>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {entries.length === 0 && (
              <div className="py-16 text-center">
                <Wallet size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  No escrow transactions found
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
