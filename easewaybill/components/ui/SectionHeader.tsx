// components/ui/SectionHeader.tsx
// ================================================================
// SECTION HEADER COMPONENT
// ================================================================
// Title row with optional subtitle and "See all" / action link.
// Used across mobile and desktop for consistent section headings.
//
// Props:
//   title     — main heading text
//   subtitle  — optional smaller text below
//   linkText  — optional right-aligned link text
//   linkHref  — URL for the link
// ================================================================

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  /** Main section title */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Text for the optional right-aligned link */
  linkText?: string;
  /** URL the link points to */
  linkHref?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  linkText,
  linkHref,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Left side: title + optional subtitle */}
      <div>
        <h3 className="font-bold text-olive-900 text-lg leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right side: optional link */}
      {linkText && linkHref && (
        <Link
          href={linkHref}
          className="text-sm text-olive-600 font-medium hover:underline
                     underline-offset-2 flex items-center gap-1
                     transition-colors hover:text-olive-700"
        >
          {linkText}
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}