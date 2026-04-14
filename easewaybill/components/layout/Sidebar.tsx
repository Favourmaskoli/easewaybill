// components/layout/Sidebar.tsx
// ================================================================
// SIDEBAR — Deep Olive Claymorphism
// ================================================================
// The sidebar background uses the darkest olive tones so that
// the nav items, logo, and user card all read as raised/lit
// elements against the deep olive base.
// ================================================================

// components/layout/Sidebar.tsx
// ================================================================
// SIDEBAR — Deep Olive Claymorphism
// ================================================================


"use client";

import React from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { sidebarNavItems, isRouteActive } from "@/lib/navigation";
import Logo from "@/components/layout/Logo";
import UserProfileCard from "@/components/layout/UserProfileCard";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

export default function Sidebar({ isOpen, onClose, pathname }: SidebarProps) {
  return (
    <>
      {/* ── Backdrop Overlay ───────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-olive-950/40 backdrop-blur-sm
                     z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Panel ──────────────────────────────────── */}
      <aside
        className={[
          "fixed lg:static inset-y-0 left-0 z-30",
          "w-72 flex flex-col",
          "bg-gradient-to-b from-olive-600 via-olive-700 to-olive-800",
          "border-r border-olive-500/30",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        aria-label="Sidebar navigation"
      >
        {/* ── Logo Header ────────────────────────────────────── */}
        <div
          className="flex items-center justify-between p-5
                     border-b border-olive-500/25 shrink-0"
        >
          <Logo />
          <button
            className="lg:hidden p-2 rounded-xl transition-all duration-200
                       text-cream-200 hover:text-cream-50
                       hover:bg-olive-500/40"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation Links ───────────────────────────────── */}
        <nav
          className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hide"
          aria-label="Main navigation"
        >
          {sidebarNavItems.map((item) => {
            const active = isRouteActive(item.href, pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={[
                  // Shared base styles
                  "flex items-center gap-3 px-4 py-3 rounded-2xl",
                  "font-semibold text-sm transition-all duration-200",
                  active
                    ? // Active — raised cream-tinted pill
                      "bg-cream-100 text-olive-800 shadow-[var(--shadow-clay-md)]"
                    : // Inactive — cream text, subtle hover
                      "text-cream-200 hover:bg-olive-500/40 hover:text-cream-50",
                ].join(" ")}
              >
                {/* Icon */}
                <item.icon
                  size={20}
                  aria-hidden="true"
                  className={active ? "text-olive-600" : "text-cream-300"}
                />

                {/* Label */}
                <span className="flex-1">{item.label}</span>

                {/* Active chevron */}
                {active && (
                  <ChevronRight
                    size={15}
                    className="text-olive-400"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Section hint above user card ───────────────────── */}
        <div className="px-4 pb-2">
          <p className="text-[10px] text-olive-300 uppercase tracking-widest
                        font-semibold px-3">
            Account
          </p>
        </div>

        {/* ── User Profile ───────────────────────────────────── */}
        <UserProfileCard
          name="John Doe"
          email="john@example.com"
          initials="JD"
          onLogout={() => console.log("Logout")}
        />
      </aside>
    </>
  );
}