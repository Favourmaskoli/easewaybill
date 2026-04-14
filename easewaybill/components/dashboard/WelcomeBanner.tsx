// components/dashboard/WelcomeBanner.tsx
// ================================================================
// WELCOME BANNER COMPONENT
// ================================================================
// Full-width olive-gradient banner displayed at the top of the
// DESKTOP dashboard. Shows a greeting, pending action count,
// and a "New Order" CTA button.
//
// Props:
//   userName       — first name for the greeting
//   pendingCount   — number of pending actions to highlight
// ================================================================

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

interface WelcomeBannerProps {
  /** User's first name shown in the greeting */
  userName: string;
  /** Number of pending actions to display */
  pendingCount: number;
}

export default function WelcomeBanner({
  userName,
  pendingCount,
}: WelcomeBannerProps) {
  return (
    <section
      className="clay-card-dark relative overflow-hidden"
      aria-label="Welcome banner"
    >
      {/* ── Decorative Background Circles ──────────────────── */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40
                   bg-white/5 rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32
                   bg-white/5 rounded-full"
        aria-hidden="true"
      />

      {/* ── Content Row ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 relative z-10">

        {/* Greeting text */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Good evening, {userName}! 👋
          </h2>
          <p className="text-olive-200 text-sm">
            You have{" "}
            <strong className="text-white font-semibold">
              {pendingCount} pending action{pendingCount !== 1 ? "s" : ""}
            </strong>{" "}
            today. Let&apos;s get them done!
          </p>
        </div>

        {/* New Order CTA */}
        <Link
          href="/dashboard/orders/create"
          className="clay-btn-ghost px-5 py-2.5 whitespace-nowrap shrink-0
                     !text-white !border-white/20 !bg-white/10
                     hover:!bg-white/20 gap-2"
        >
          <Plus size={18} aria-hidden="true" />
          New Order
        </Link>
      </div>
    </section>
  );
}