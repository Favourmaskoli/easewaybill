// components/layout/Sidebar.tsx
// ================================================================
// SIDEBAR NAVIGATION COMPONENT
// ================================================================
// The main desktop navigation panel. On tablet (<lg) it works as
// a slide-in drawer controlled by the `isOpen` / `onClose` props.
//
// Renders:
//   • Logo header with close button (tablet only)
//   • Navigation links with active highlighting
//   • User profile card at the bottom
//
// Props:
//   isOpen    — whether the drawer is visible (mobile/tablet)
//   onClose   — callback to close the drawer
//   pathname  — current route path for active state
// ================================================================

"use client";

import React from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";

// ── Data imports ──────────────────────────────────────────────
import { sidebarNavItems, isRouteActive } from "@/lib/navigation";

// ── Sub-component imports ─────────────────────────────────────
import Logo from "@/components/layout/Logo";
import UserProfileCard from "@/components/layout/UserProfileCard";

interface SidebarProps {
  /** Whether the mobile/tablet drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer overlay */
  onClose: () => void;
  /** Current route pathname (from usePathname) */
  pathname: string;
}

export default function Sidebar({ isOpen, onClose, pathname }: SidebarProps) {
  return (
    <>
      {/* ── Overlay Backdrop ───────────────────────────────── */}
      {/* Shown only on mobile/tablet when the drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Panel ──────────────────────────────────── */}
      <aside
        className={[
          // Position: fixed on mobile, static (in-flow) on desktop
          "fixed lg:static inset-y-0 left-0 z-30",
          // Dimensions
          "w-72 flex flex-col",
          // Styling
          "bg-white border-r border-cream-300",
          // Slide animation for mobile drawer
          "transition-transform duration-300 ease-in-out",
          // Visibility control
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        aria-label="Sidebar navigation"
      >
        {/* ── Logo Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between p-5 border-b border-cream-300 shrink-0">
          <Logo />

          {/* Close button — only visible on tablet/mobile */}
          <button
            className="lg:hidden p-2 text-gray-400 hover:text-olive-600
                       hover:bg-olive-50 rounded-xl transition-colors"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation Links ───────────────────────────────── */}
        <nav
          className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide"
          aria-label="Main navigation"
        >
          {sidebarNavItems.map((item) => {
            const active = isRouteActive(item.href, pathname);

            return (
              <Link
                key={item.label}
                href={item.href}
                // Close drawer on navigate (mobile)
                onClick={onClose}
                className={[
                  "flex items-center gap-3 px-4 py-3 rounded-xl",
                  "font-medium text-sm transition-all duration-200",
                  active
                    ? // Active: olive background, white text
                      "bg-olive-600 text-white shadow-olive-md"
                    : // Default: subtle hover
                      "text-gray-600 hover:bg-olive-50 hover:text-olive-700",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                {/* Icon */}
                <item.icon size={20} aria-hidden="true" />

                {/* Label */}
                <span>{item.label}</span>

                {/* Active chevron indicator */}
                {active && (
                  <ChevronRight
                    size={16}
                    className="ml-auto opacity-70"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── User Profile (bottom) ──────────────────────────── */}
        <UserProfileCard
          name="John Doe"
          email="john@example.com"
          initials="JD"
          onLogout={() => {
            // TODO: implement real logout logic
            console.log("Logout clicked");
          }}
        />
      </aside>
    </>
  );
}