// components/layout/MobilePageHeader.tsx
// ================================================================
// MOBILE PAGE HEADER COMPONENT
// ================================================================
// Sticky header bar for inner mobile pages (Orders, Create Order,
// Payments, Settings, etc.). Includes a back button and page title.
//
// NOT used on the Dashboard home page — that page has a custom
// greeting section instead.
//
// Props:
//   title     — page title text
//   onBack    — callback for the back button (defaults to router.back)
//   showBack  — whether to show the back arrow (default: true)
//   rightSlot — optional ReactNode rendered on the right side
// ================================================================

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface MobilePageHeaderProps {
  /** Title text displayed in the center */
  title: string;
  /** Callback for the back button. Defaults to router.back() */
  onBack?: () => void;
  /** Whether to show the back arrow button (default: true) */
  showBack?: boolean;
  /** Optional content rendered on the right side of the header */
  rightSlot?: React.ReactNode;
}

export default function MobilePageHeader({
  title,
  onBack,
  showBack = true,
  rightSlot,
}: MobilePageHeaderProps) {
  const router = useRouter();

  /** Handles back navigation */
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div
      className="lg:hidden sticky top-0 z-10 bg-white/80 backdrop-blur-md
                 border-b border-cream-300 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        {/* ── Back Button ──────────────────────────────────── */}
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 text-olive-700 hover:bg-olive-50
                       rounded-xl transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* ── Page Title ───────────────────────────────────── */}
        <h1 className="text-lg font-bold text-olive-900 flex-1 truncate">
          {title}
        </h1>

        {/* ── Right Slot (optional) ────────────────────────── */}
        {rightSlot && (
          <div className="shrink-0">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}