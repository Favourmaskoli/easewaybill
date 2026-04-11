// components/ui/StatusBadge.tsx
// ================================================================
// STATUS BADGE COMPONENT
// ================================================================
// Small colored pill showing order/payment status.
// Uses the `status-badge` utility from globals.css as a base,
// then layers on colour classes.
//
// Props:
//   label      — display text (e.g. "In Transit")
//   colorClass — Tailwind bg + text combo (e.g. "bg-amber-100 text-amber-700")
//   size       — "sm" | "md" (default: "md")
// ================================================================

import React from "react";

type BadgeSize = "sm" | "md";

interface StatusBadgeProps {
  /** Status text displayed inside the badge */
  label: string;
  /** Tailwind colour classes — bg + text (e.g. "bg-olive-100 text-olive-700") */
  colorClass: string;
  /** Size variant */
  size?: BadgeSize;
}

/** Font size per size variant */
const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-0.5",
};

export default function StatusBadge({
  label,
  colorClass,
  size = "md",
}: StatusBadgeProps) {
  return (
    <span
      className={`status-badge ${sizeClasses[size]} ${colorClass}`}
      role="status"
    >
      {label}
    </span>
  );
}