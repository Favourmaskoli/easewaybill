// components/dashboard/QuickActionsCard.tsx
// ================================================================
// QUICK ACTIONS CARD COMPONENT
// ================================================================
// A card with shortcut links to key actions (Create Order,
// Track Shipment, Payments, Messages). Each row has an icon,
// label, description, and a chevron arrow.
//
// Used on the DESKTOP dashboard right column.
//
// Props:
//   actions — array of QuickAction objects from mock-data
// ================================================================

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { QuickAction } from "@/lib/mock-data";

interface QuickActionsCardProps {
  /** Array of quick action items to render */
  actions: QuickAction[];
}

export default function QuickActionsCard({ actions }: QuickActionsCardProps) {
  return (
    <section
      className="bg-white rounded-2xl shadow-olive-sm
                 border border-cream-300 p-5"
      aria-label="Quick actions"
    >
      {/* ── Card Title ─────────────────────────────────────── */}
      <h3 className="font-bold text-olive-900 text-lg mb-4">
        Quick Actions
      </h3>

      {/* ── Action Links ───────────────────────────────────── */}
      <div className="space-y-2.5">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-3 p-3 ${action.bg}
                       hover:brightness-95 rounded-xl
                       transition-all group`}
          >
            {/* ── Icon Container ───────────────────────────── */}
            <div
              className={`w-9 h-9 ${action.iconBg} text-white rounded-lg
                         flex items-center justify-center
                         group-hover:scale-110 transition-transform
                         shrink-0`}
            >
              <action.icon size={18} />
            </div>

            {/* ── Text Content ─────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-olive-900">
                {action.label}
              </p>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </div>

            {/* ── Chevron Arrow ─────────────────────────────── */}
            <ChevronRight
              size={15}
              className="text-gray-400 shrink-0 group-hover:text-olive-600
                         transition-colors"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}