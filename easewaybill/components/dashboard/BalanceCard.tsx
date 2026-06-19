// "use client";

// import React from "react";
// import { Wallet, Zap } from "lucide-react";

// interface BalanceCardProps {
//   /** Formatted balance amount to display */
//   balance: string;
//   /** Number of pending actions today */
//   pendingCount?: number;
// }

// export default function BalanceCard({
//   balance,
//   pendingCount = 3,
// }: BalanceCardProps) {
//   return (
//     <div className="clay-card-dark">
//       {/* ── Label Row ──────────────────────────────────────── */}
//       <div className="flex items-center gap-2 mb-2">
//         <Wallet size={16} className="text-olive-200" aria-hidden="true" />
//         <p className="text-sm text-olive-200 font-medium">Escrow balance</p>
//       </div>

//       {/* ── Balance Amount ─────────────────────────────────── */}
//       <p className="text-3xl font-bold text-white mb-5">{balance}</p>

//       {/* ── Pending Actions Nudge ──────────────────────────── */}
//       <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2.5">
//         <Zap size={15} className="text-yellow-300 shrink-0" aria-hidden="true" />
//         <p className="text-sm text-white/90 leading-snug">
//           You have{" "}
//           <span className="font-semibold text-white">
//             {pendingCount} pending {pendingCount === 1 ? "action" : "actions"}
//           </span>{" "}
//           today. Let&apos;s get them done!
//         </p>
//       </div>
//     </div>
//   );
// }

"use client";

import React from "react";
import { Wallet, Zap } from "lucide-react";

interface BalanceCardProps {
  balance: string;
  pendingCount?: number;
  onWithdraw?: () => void;
}

export default function BalanceCard({
  balance,
  pendingCount = 0,
  onWithdraw,
}: BalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-green-700 to-green-500 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={16} className="text-green-200" />
        <p className="text-sm text-green-200 font-medium">Escrow balance</p>
      </div>

      <p className="text-3xl font-bold text-white mb-5">{balance}</p>

      {pendingCount > 0 ? (
        <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2.5">
          <Zap size={15} className="text-yellow-300 shrink-0" />
          <p className="text-sm text-white/90 leading-snug">
            You have{" "}
            <span className="font-semibold text-white">
              {pendingCount} pending{" "}
              {pendingCount === 1 ? "action" : "actions"}
            </span>{" "}
            today.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2.5">
          <p className="text-sm text-white/90">All caught up! 🎉</p>
        </div>
      )}
    </div>
  );
}