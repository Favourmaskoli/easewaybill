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
    <div className="clay-card-dark">
      {/* ── Label Row ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={16} className="text-olive-200" aria-hidden="true" />
        <p className="text-sm text-olive-200 font-medium">Total balance</p>
      </div>

      {/* ── Balance Amount ─────────────────────────────────── */}
      <p className="text-3xl font-bold text-white mb-4">{balance}</p>

      {/* ── Withdraw Button ────────────────────────────────── */}
      <button
        onClick={onWithdraw}
        className="clay-btn w-full py-3"
      >
        Withdraw
      </button>
    </div>
  );
}