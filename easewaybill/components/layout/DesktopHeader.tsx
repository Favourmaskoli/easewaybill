// components/layout/DesktopHeader.tsx
// ================================================================
// DESKTOP TOP HEADER BAR
// ================================================================
// Sticky bar at the top of the main content area on desktop (lg+).
// Contains: page title, search input, notification bell, user avatar.
//
// Hidden on mobile — mobile pages use their own headers
// (MobilePageHeader or custom greeting sections).
//
// Props:
//   title    — current page title
//   subtitle — optional subtitle text
// ================================================================

"use client";

import React from "react";
import { Search, Bell } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface DesktopHeaderProps {
  /** Page title displayed on the left */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
}

export default function DesktopHeader({
  title,
  subtitle,
}: DesktopHeaderProps) {
  return (
    <header
      className="hidden lg:flex items-center justify-between
                 bg-white/80 backdrop-blur-md border-b border-cream-300
                 px-6 py-4 shrink-0 sticky top-0 z-10"
    >
      {/* ── Left: Page Title ───────────────────────────────── */}
      <div className="flex items-center gap-4 min-w-0">
        <div>
          <h1 className="text-xl font-bold text-olive-900 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* ── Right: Search + Bell + Avatar ──────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div
          className="flex items-center gap-2 bg-cream-100 border border-cream-300
                     rounded-xl px-3.5 py-2.5 w-56
                     focus-within:border-olive-400 focus-within:ring-2
                     focus-within:ring-olive-100 transition-all"
        >
          <Search
            size={15}
            className="text-gray-400 shrink-0"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search..."
            className="bg-transparent text-sm text-gray-600 outline-none
                       placeholder:text-gray-400 w-full"
            aria-label="Search"
          />
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2.5 text-gray-500 hover:text-olive-600
                     hover:bg-olive-50 rounded-xl transition-colors"
          aria-label="View notifications"
        >
          <Bell size={20} />
          {/* Unread indicator dot */}
          <span
            className="absolute top-2 right-2 w-2 h-2 bg-red-500
                       rounded-full ring-2 ring-white"
          />
        </button>

        {/* User Avatar */}
        <Avatar
          initials="JD"
          size="md"
          className="cursor-pointer hover:ring-2 hover:ring-olive-300
                     transition-all"
        />
      </div>
    </header>
  );
}