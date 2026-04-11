// components/layout/Logo.tsx
// ================================================================
// LOGO COMPONENT
// ================================================================
// Renders the EaseWaybill brand logo with the olive-green icon
// and two-tone text. Used in the sidebar header.
//
// Props:
//   collapsed — if true, hides the text (icon-only mode)
//   className — additional Tailwind classes
// ================================================================

import React from "react";
import Link from "next/link";
import { Package } from "lucide-react";

interface LogoProps {
  /** When true, only the icon is shown (useful for collapsed sidebars) */
  collapsed?: boolean;
  /** Additional Tailwind classes on the outer wrapper */
  className?: string;
}

export default function Logo({ collapsed = false, className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 group ${className}`}
      aria-label="EaseWaybill Home"
    >
      {/* ── Icon Container ─────────────────────────────────── */}
      <div
        className="bg-olive-600 text-white p-2 rounded-xl
                   group-hover:bg-olive-700 transition-colors
                   shadow-olive-sm shrink-0"
      >
        <Package size={20} />
      </div>

      {/* ── Brand Text (hidden when collapsed) ─────────────── */}
      {!collapsed && (
        <span className="text-lg font-bold text-olive-900">
          ease<span className="text-olive-600">waybill</span>
        </span>
      )}
    </Link>
  );
}