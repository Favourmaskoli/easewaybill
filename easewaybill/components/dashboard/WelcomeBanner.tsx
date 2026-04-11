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
      className="olive-gradient rounded-2xl p-6 text-white
                 shadow-olive-lg relative overflow-hidden"
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
      <div
        className="flex items-center justify-between gap-4
                   relative z-10"
      >
        {/* Greeting text */}
        <div>
          <h2 className="text-2xl font-bold mb-1">
            Good evening, {userName}! 👋
          </h2>
          <p className="text-olive-100 text-sm">
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
          className="flex items-center gap-2 bg-white text-olive-700
                     font-semibold px-5 py-2.5 rounded-xl
                     hover:bg-olive-50 active:scale-95 transition-all
                     shadow-md whitespace-nowrap shrink-0"
        >
          <Plus size={18} aria-hidden="true" />
          New Order
        </Link>
      </div>
    </section>
  );
}