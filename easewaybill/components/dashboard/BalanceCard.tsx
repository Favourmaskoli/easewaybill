// components/dashboard/BalanceCard.tsx
// ================================================================
// BALANCE CARD COMPONENT
// ================================================================
// Displays the user's total wallet balance with a "Withdraw" CTA.
// Used on the MOBILE dashboard home view only.
//
// Props:
//   balance      — formatted balance string (e.g. "₦1,200,000.00")
//   onWithdraw   — callback when the withdraw button is pressed
// ================================================================

"use client";

import React from "react";
import { Wallet } from "lucide-react";

interface BalanceCardProps {
  /** Formatted balance amount to display */
  balance: string;
  /** Callback fired when "Withdraw" is clicked */
  onWithdraw?: () => void;
}

export default function BalanceCard({
  balance,
  onWithdraw,
}: BalanceCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-olive-sm border border-cream-300">
      {/* ── Label Row ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={16} className="text-gray-400" aria-hidden="true" />
        <p className="text-sm text-gray-500 font-medium">Total balance</p>
      </div>

      {/* ── Balance Amount ─────────────────────────────────── */}
      <p className="text-3xl font-bold text-olive-900 mb-4">{balance}</p>

      {/* ── Withdraw Button ────────────────────────────────── */}
      <button
        onClick={onWithdraw}
        className="w-full bg-olive-600 hover:bg-olive-700
                   active:bg-olive-800 text-white font-semibold
                   py-3 rounded-xl transition-colors shadow-olive-sm
                   active:scale-[0.98]"
      >
        Withdraw
      </button>
    </div>
  );
}