// components/dashboard/OrderStatusCard.tsx
// ================================================================
// ORDER STATUS CARD COMPONENT
// ================================================================
// Displays a summary of order statuses as labeled progress bars.
// Each bar shows a coloured dot, label, count, and fill percentage.
//
// Used on the DESKTOP dashboard right column.
//
// Props:
//   statusBars — array of StatusBar objects from mock-data
// ================================================================

// components/dashboard/OrderStatusCard.tsx
"use client";

import React from "react";
import ProgressBar from "@/components/ui/ProgressBar";
import type { StatusBar } from "@/lib/mock-data";

interface OrderStatusCardProps {
  statusBars: StatusBar[];
}

export default function OrderStatusCard({ statusBars }: OrderStatusCardProps) {
  return (
    <section className="clay-card" aria-label="Order status summary">
      {/* ── Card Title ─────────────────────────────────────── */}
      <h3 className="font-bold text-olive-900 text-lg mb-4">
        Order Status
      </h3>

      {/* ── Progress Bars ──────────────────────────────────── */}
      <div className="space-y-4">
        {statusBars.map((bar) => (
          <ProgressBar
            key={bar.label}
            label={bar.label}
            count={bar.count}
            dotColor={bar.dotColor}
            barColor={bar.barColor}
            width={bar.width}
          />
        ))}
      </div>
    </section>
  );
}