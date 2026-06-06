// // components/dashboard/BalanceCard.tsx
// // ================================================================
// // BALANCE CARD COMPONENT
// // ================================================================
// // Displays the user's total wallet balance with a "Withdraw" CTA.
// // Used on the MOBILE dashboard home view only.
// //
// // Props:
// //   balance      — formatted balance string (e.g. "₦1,200,000.00")
// //   onWithdraw   — callback when the withdraw button is pressed
// // ================================================================

// "use client";

// import React from "react";
// import { Wallet } from "lucide-react";

// interface BalanceCardProps {
//   /** Formatted balance amount to display */
//   balance: string;
//   /** Callback fired when "Withdraw" is clicked */
//   onWithdraw?: () => void;
// }

// export default function BalanceCard({ balance, onWithdraw }: BalanceCardProps) {
//   return (
//     <div className="clay-card-dark">
//       {/* ── Label Row ──────────────────────────────────────── */}
//       <div className="flex items-center gap-2 mb-2">
//         <Wallet size={16} className="text-olive-200" aria-hidden="true" />
//         <p className="text-sm text-olive-200 font-medium">Escrow balance</p>
//       </div>

//       {/* ── Balance Amount ─────────────────────────────────── */}
//       <p className="text-3xl font-bold text-white mb-4">{balance}</p>

//       {/* ── Withdraw Button ────────────────────────────────── */}
//       <button onClick={onWithdraw} className="clay-btn w-full py-3">
//         Withdraw
//       </button>
//     </div>
//   );
// }


// components/dashboard/BalanceCard.tsx
// ================================================================
// BALANCE CARD COMPONENT
// ================================================================
// Displays the user's total wallet balance with a pending-actions
// nudge strip at the bottom.
// Used on the MOBILE dashboard home view only.
//
// Props:
//   balance        — formatted balance string (e.g. "₦1,200,000.00")
//   pendingCount   — number of pending actions today
// ================================================================

"use client";

import React from "react";
import { Wallet, Zap } from "lucide-react";

interface BalanceCardProps {
  /** Formatted balance amount to display */
  balance: string;
  /** Number of pending actions today */
  pendingCount?: number;
}

export default function BalanceCard({
  balance,
  pendingCount = 3,
}: BalanceCardProps) {
  return (
    <div className="clay-card-dark">
      {/* ── Label Row ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={16} className="text-olive-200" aria-hidden="true" />
        <p className="text-sm text-olive-200 font-medium">Escrow balance</p>
      </div>

      {/* ── Balance Amount ─────────────────────────────────── */}
      <p className="text-3xl font-bold text-white mb-5">{balance}</p>

      {/* ── Pending Actions Nudge ──────────────────────────── */}
      <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2.5">
        <Zap size={15} className="text-yellow-300 shrink-0" aria-hidden="true" />
        <p className="text-sm text-white/90 leading-snug">
          You have{" "}
          <span className="font-semibold text-white">
            {pendingCount} pending {pendingCount === 1 ? "action" : "actions"}
          </span>{" "}
          today. Let&apos;s get them done!
        </p>
      </div>
    </div>
  );
}