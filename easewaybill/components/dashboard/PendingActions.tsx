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

// components/dashboard/PendingActions.tsx
"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { PendingAction } from "@/lib/mock-data";

interface PendingActionsProps {
  actions: PendingAction[];
}

export default function PendingActions({ actions }: PendingActionsProps) {
  return (
    <section className="clay-card" aria-label="Pending actions">
      {/* ── Section Heading with Badge ─────────────────────── */}
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle size={20} className="text-amber-500" aria-hidden="true" />
        <h3 className="font-bold text-olive-900 text-lg">Pending Actions</h3>
        <span className="clay-badge bg-amber-100 text-amber-700">
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
          <p className="text-sm text-olive-400">
            No pending actions — you&apos;re all caught up! 🎉
          </p>
        </div>
      )}
    </section>
  );
}

function PendingActionCard({ action }: { action: PendingAction }) {
  return (
    <div
      className={`clay-card flex items-start gap-3 !p-4
                  ${action.bg} ${action.border}`}
    >
      {/* ── Action Icon ────────────────────────────────────── */}
      <action.icon
        size={20}
        className={`${action.iconColor} mt-0.5 shrink-0`}
        aria-hidden="true"
      />

      {/* ── Text + Button ──────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold text-olive-800">{action.title}</p>
        <p className="text-xs text-olive-500 mt-0.5">{action.description}</p>
        <button
          className={`mt-2.5 text-xs font-semibold px-3 py-1
                      rounded-full transition-all duration-200
                      hover:scale-105 hover:shadow-md
                      ${action.btnClass}`}
        >
          {action.actionLabel}
        </button>
      </div>
    </div>
  );
}