// // components/dashboard/WelcomeBanner.tsx
// // ================================================================
// // WELCOME BANNER COMPONENT
// // ================================================================
// // Full-width olive-gradient banner displayed at the top of the
// // DESKTOP dashboard. Shows a greeting, pending action count,
// // and a "New Order" CTA button.
// //
// // Props:
// //   userName       — first name for the greeting
// //   pendingCount   — number of pending actions to highlight
// // ================================================================

// import React from "react";
// import Link from "next/link";
// import { Plus } from "lucide-react";

// interface WelcomeBannerProps {
//   /** User's first name shown in the greeting */
//   userName: string;
//   /** Number of pending actions to display */
//   pendingCount: number;
// }

// export default function WelcomeBanner({
//   userName,
//   pendingCount,
// }: WelcomeBannerProps) {
//   return (
//     <section
//       className="clay-card-dark relative overflow-hidden"
//       aria-label="Welcome banner"
//     >
//       {/* ── Decorative Background Circles ──────────────────── */}
//       <div
//         className="absolute -top-10 -right-10 w-40 h-40
//                    bg-white/5 rounded-full"
//         aria-hidden="true"
//       />
//       <div
//         className="absolute -bottom-8 -left-8 w-32 h-32
//                    bg-white/5 rounded-full"
//         aria-hidden="true"
//       />

//       {/* ── Content Row ────────────────────────────────────── */}
//       <div className="flex items-center justify-between gap-4 relative z-10">

//         {/* Greeting text */}
//         <div>
//           <h2 className="text-2xl font-bold text-white mb-1">
//             Good evening, {userName}! 👋
//           </h2>
//           <p className="text-olive-200 text-sm">
//             You have{" "}
//             <strong className="text-white font-semibold">
//               {pendingCount} pending action{pendingCount !== 1 ? "s" : ""}
//             </strong>{" "}
//             today. Let&apos;s get them done!
//           </p>
//         </div>

//         {/* New Order CTA */}
//         <Link
//           href="/dashboard/orders/create"
//           className="clay-btn-ghost px-5 py-2.5 whitespace-nowrap shrink-0
//                      !text-white !border-white/20 !bg-white/10
//                      hover:!bg-white/20 gap-2"
//         >
//           <Plus size={18} aria-hidden="true" />
//           New Order
//         </Link>
//       </div>
//     </section>
//   );
// }
"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

interface WelcomeBannerProps {
  userName: string;
  pendingCount?: number;
}

export default function WelcomeBanner({
  userName,
  pendingCount = 0,
}: WelcomeBannerProps) {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const roleLabel =
    user?.role === "USER"
      ? "User"
        : user?.role === "RIDER"
          ? "Rider"
          : "Admin";

  return (
    <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-green-200" />
            <span className="text-green-200 text-sm font-medium">
              {roleLabel} Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-green-100 text-sm mt-1">
            {pendingCount > 0
              ? `You have ${pendingCount} pending action${pendingCount !== 1 ? "s" : ""} that need attention.`
              : "Everything is up to date. Great work!"}
          </p>
        </div>

        {pendingCount > 0 && (
          <Link
            href="/dashboard/orders"
            className="hidden sm:flex items-center gap-2 bg-white/20
                       hover:bg-white/30 transition-colors px-4 py-2
                       rounded-xl text-sm font-semibold text-white"
          >
            View Orders <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
