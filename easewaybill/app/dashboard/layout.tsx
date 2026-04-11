// app/dashboard/layout.tsx
// ================================================================
// SHARED DASHBOARD LAYOUT
// ================================================================
// Now composed from small, focused sub-components:
//   • Sidebar        — desktop nav + tablet drawer
//   • DesktopHeader  — top bar with search/bell/avatar
//   • MobileBottomNav — fixed bottom tab bar
//
// Each child page only renders its own content inside <main>.
// ================================================================

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

// ── Layout Components ─────────────────────────────────────────
import Sidebar from "@/components/layout/Sidebar";
import DesktopHeader from "@/components/layout/DesktopHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

// ── Data ──────────────────────────────────────────────────────
import { pageTitles } from "@/lib/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Sidebar drawer state (mobile/tablet) ────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Current route ───────────────────────────────────────────
  const pathname = usePathname();

  // ── Resolve page title for the desktop header ───────────────
  const currentPage = pageTitles[pathname] || {
    title: "Dashboard",
    subtitle: "",
  };

  return (
    <div className="flex h-screen bg-cream-200 overflow-hidden">
      {/* ── Sidebar (desktop: static, mobile: drawer) ──────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pathname={pathname}
      />

      {/* ── Main Content Area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop top header (hidden on mobile) */}
        <DesktopHeader
          title={currentPage.title}
          subtitle={currentPage.subtitle}
        />

        {/* Scrollable page content */}
        {/* pb-24 on mobile makes room for the fixed bottom nav */}
        <main
          className="flex-1 overflow-y-auto scrollbar-hide pb-24 lg:pb-6"
          id="main-content"
        >
          {children}
        </main>

        {/* Mobile bottom nav bar (hidden on desktop) */}
        <MobileBottomNav pathname={pathname} />
      </div>
    </div>
  );
}