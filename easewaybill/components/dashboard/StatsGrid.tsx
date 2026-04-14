// components/dashboard/StatsGrid.tsx
// ================================================================
// STATS GRID COMPONENT
// ================================================================
// Renders a responsive grid of KPI stat cards.
// Used on the DESKTOP dashboard view.
//
// Each card shows:
//   • Coloured icon
//   • "Active" trend badge
//   • Large value, title, and change description
//
// Props:
//   stats — array of StatItem objects from mock-data
// ================================================================

import React from "react";
import { TrendingUp } from "lucide-react";
import type { StatItem } from "@/lib/mock-data";

interface StatsGridProps {
  /** Array of stat items to render as cards */
  stats: StatItem[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section aria-label="Statistics overview">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <article
            key={stat.title}
            className="clay-card"
          >
            {/* ── Top Row: Icon + Badge ────────────────────── */}
            <div className="flex items-center justify-between mb-4">
              {/* Stat icon */}
              <div
                className={`w-12 h-12 ${stat.bgColor} ${stat.textColor}
                            rounded-xl flex items-center justify-center`}
                aria-hidden="true"
              >
                <stat.icon size={24} />
              </div>

              {/* Trend badge */}
              <span
                className="clay-badge bg-olive-100 text-olive-600
                           flex items-center gap-1"
              >
                <TrendingUp size={11} aria-hidden="true" />
                Active
              </span>
            </div>

            {/* ── Value ────────────────────────────────────── */}
            <p className="text-2xl font-bold text-olive-900 mb-0.5">
              {stat.value}
            </p>

            {/* ── Title ────────────────────────────────────── */}
            <p className="text-sm font-medium text-olive-600 mb-0.5">
              {stat.title}
            </p>

            {/* ── Change Description ───────────────────────── */}
            <p className="text-xs text-olive-400">{stat.change}</p>
          </article>
        ))}
      </div>
    </section>
  );
}