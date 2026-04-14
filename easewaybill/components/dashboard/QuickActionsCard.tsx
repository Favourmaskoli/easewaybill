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

// components/dashboard/QuickActionsCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { QuickAction } from "@/lib/mock-data";

interface QuickActionsCardProps {
  actions: QuickAction[];
}

export default function QuickActionsCard({ actions }: QuickActionsCardProps) {
  return (
    <section className="clay-card" aria-label="Quick actions">
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
            className="clay-nav-item group"
          >
            {/* ── Icon Container ───────────────────────────── */}
            <div
              className={`w-9 h-9 ${action.iconBg} text-white rounded-xl
                          flex items-center justify-center shrink-0
                          group-hover:scale-110 transition-transform`}
            >
              <action.icon size={18} aria-hidden="true" />
            </div>

            {/* ── Text Content ─────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-olive-900">
                {action.label}
              </p>
              <p className="text-xs text-olive-500">{action.desc}</p>
            </div>

            {/* ── Chevron ──────────────────────────────────── */}
            <ChevronRight
              size={15}
              className="text-olive-400 shrink-0
                         group-hover:text-olive-700 transition-colors"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}