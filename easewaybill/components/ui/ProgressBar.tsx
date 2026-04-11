// components/ui/ProgressBar.tsx
// ================================================================
// PROGRESS BAR COMPONENT
// ================================================================
// Labeled horizontal progress bar with a dot indicator.
// Used in: Order Status card on the dashboard.
//
// Props:
//   label    — text label (e.g. "In Transit")
//   count    — numeric value displayed on the right
//   dotColor — Tailwind bg class for the dot
//   barColor — Tailwind bg class for the filled portion
//   width    — CSS width string for the fill (e.g. "60%")
//   max      — aria max value (default: 20)
// ================================================================

import React from "react";

interface ProgressBarProps {
  /** Label text shown to the left */
  label: string;
  /** Numeric count shown to the right */
  count: number;
  /** Tailwind bg class for the small dot indicator */
  dotColor: string;
  /** Tailwind bg class for the progress fill */
  barColor: string;
  /** CSS width string controlling fill amount (e.g. "60%") */
  width: string;
  /** Max value for aria (default: 20) */
  max?: number;
}

export default function ProgressBar({
  label,
  count,
  dotColor,
  barColor,
  width,
  max = 20,
}: ProgressBarProps) {
  return (
    <div>
      {/* Label and count row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {/* Colour dot */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${dotColor}`}
            aria-hidden="true"
          />
          <span className="text-sm text-gray-600">{label}</span>
        </div>
        <span className="text-sm font-bold text-olive-800">{count}</span>
      </div>

      {/* Bar track */}
      <div
        className="w-full bg-cream-200 rounded-full h-1.5"
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${count}`}
      >
        {/* Filled portion */}
        <div
          className={`${barColor} h-1.5 rounded-full transition-all duration-700`}
          style={{ width }}
        />
      </div>
    </div>
  );
}