// components/dashboard/PendingActions.tsx
// ================================================================
// PENDING ACTIONS COMPONENT
// ================================================================
// Highlights orders that need user attention (awaiting payment,
// open disputes, delivery confirmations). Each card has a coloured
// background, icon, description, and action button.
//
// Used on the DESKTOP dashboard at the bottom.
//
// Props:
//   actions — array of PendingAction objects from mock-data
// ================================================================

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { PendingAction } from "@/lib/mock-data";

interface PendingActionsProps {
  /** Array of pending action items */
  actions: PendingAction[];
}

export default function PendingActions({ actions }: PendingActionsProps) {
  return (
    <section
      className="bg-white rounded-2xl shadow-olive-sm
                 border border-cream-300 p-5"
      aria-label="Pending actions"
    >
      {/* ── Section Heading with Badge ─────────────────────── */}
      <div className="flex items-center gap-2 mb-5">
        {/* Warning icon */}
        <AlertTriangle
          size={20}
          className="text-amber-500"
          aria-hidden="true"
        />

        {/* Title */}
        <h3 className="font-bold text-olive-900 text-lg">
          Pending Actions
        </h3>

        {/* Count badge */}
        <span
          className="bg-amber-100 text-amber-600 text-xs font-bold
                     px-2.5 py-0.5 rounded-full"
        >
          {actions.length} item{actions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Action Cards Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {actions.map((action) => (
          <PendingActionCard key={action.id} action={action} />
        ))}
      </div>

      {/* ── Empty State ────────────────────────────────────── */}
      {actions.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">
            No pending actions — you&apos;re all caught up! 🎉
          </p>
        </div>
      )}
    </section>
  );
}

// ================================================================
// SUB-COMPONENT: Single Pending Action Card
// ================================================================
// Extracted to keep the parent component clean. Not exported —
// only used internally by PendingActions.
// ================================================================

interface PendingActionCardProps {
  action: PendingAction;
}

function PendingActionCard({ action }: PendingActionCardProps) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border
                 ${action.bg} ${action.border} card-hover`}
    >
      {/* ── Action Icon ────────────────────────────────────── */}
      <action.icon
        size={20}
        className={`${action.iconColor} mt-0.5 shrink-0`}
        aria-hidden="true"
      />

      {/* ── Text + Button ──────────────────────────────────── */}
      <div>
        {/* Title */}
        <p className="text-sm font-semibold text-olive-800">
          {action.title}
        </p>

        {/* Description */}
        <p className="text-xs text-gray-500 mt-0.5">
          {action.description}
        </p>

        {/* Action button */}
        <button
          className={`mt-2.5 text-xs font-semibold px-3 py-1
                     rounded-full transition-colors ${action.btnClass}`}
        >
          {action.actionLabel}
        </button>
      </div>
    </div>
  );
}