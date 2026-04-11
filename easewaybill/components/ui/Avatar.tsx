// components/ui/Avatar.tsx
// ================================================================
// AVATAR COMPONENT
// ================================================================
// Reusable circular avatar with initials or optional image.
// Used in: sidebar user profile, desktop header, chat messages,
//          mobile greeting, profile page.
//
// Props:
//   initials  — fallback text (e.g. "JD")
//   src       — optional image URL
//   size      — "sm" | "md" | "lg" | "xl" (default: "md")
//   className — additional Tailwind classes
// ================================================================

import React from "react";

/** Available avatar size presets */
type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  /** Fallback initials when no image is provided */
  initials: string;
  /** Optional profile image URL */
  src?: string;
  /** Size preset — controls width, height, and font size */
  size?: AvatarSize;
  /** Additional Tailwind classes for customisation */
  className?: string;
}

/** Maps size presets to Tailwind dimension + font classes */
const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

export default function Avatar({
  initials,
  src,
  size = "md",
  className = "",
}: AvatarProps) {
  const base = sizeClasses[size];

  // ── If an image URL is provided, render <img> ───────────────
  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        className={`${base} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  // ── Otherwise render initials on olive gradient ─────────────
  return (
    <div
      className={`${base} bg-gradient-to-br from-olive-500 to-olive-400
                  rounded-full flex items-center justify-center
                  text-white font-bold shrink-0 shadow-olive-sm ${className}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}