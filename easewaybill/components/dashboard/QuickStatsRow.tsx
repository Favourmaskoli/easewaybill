// components/dashboard/QuickStatsRow.tsx
// ================================================================
// QUICK STATS ROW COMPONENT
// ================================================================
// A 3-column grid of small stat boxes. Used on the MOBILE
// dashboard home view to show Active Orders, Completed, Pending.
//
// Props:
//   stats — array of { label, value } objects
// ================================================================

import React from "react";
import type { QuickStat } from "@/lib/mock-data";

interface QuickStatsRowProps {
  /** Array of quick stat items to render */
  stats: QuickStat[];
}

export default function QuickStatsRow({ stats }: QuickStatsRowProps) {
  return (
    <div>
      {/* ── Section Title ──────────────────────────────────── */}
      <h3 className="text-sm font-semibold text-olive-600 mb-3">
        Quick stats
      </h3>

      {/* ── Stats Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="clay-card !p-3.5 text-center"
          >
            {/* Numeric value */}
            <p className="text-2xl font-bold text-olive-800">
              {stat.value}
            </p>

            {/* Label — whitespace-pre-line preserves \n in data */}
            <p
              className="text-[11px] text-olive-500 mt-1 leading-tight
                         whitespace-pre-line"
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}