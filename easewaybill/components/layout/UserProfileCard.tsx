// components/layout/UserProfileCard.tsx
// ================================================================
// USER PROFILE CARD COMPONENT
// ================================================================
// Displays the current user's avatar, name, email, and a logout
// button. Sits at the bottom of the sidebar.
//
// Props:
//   name     — user's display name
//   email    — user's email
//   initials — fallback initials for the avatar
//   onLogout — callback when logout is clicked
// ================================================================

import React from "react";
import { LogOut } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface UserProfileCardProps {
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** Initials shown in the avatar circle */
  initials: string;
  /** Callback fired when the logout button is clicked */
  onLogout?: () => void;
}

export default function UserProfileCard({
  name,
  email,
  initials,
  onLogout,
}: UserProfileCardProps) {
  return (
    <div className="p-4 border-t border-cream-300 shrink-0">
      {/* ── User Info Button ───────────────────────────────── */}
      {/* Clickable row — could open a profile popover in future */}
      <button
        className="w-full flex items-center gap-3 p-3 rounded-xl
                   hover:bg-olive-50 transition-colors mb-2 text-left"
        aria-label="View profile"
      >
        {/* Avatar */}
        <Avatar initials={initials} size="md" />

        {/* Name + Email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-olive-800 truncate">
            {name}
          </p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
      </button>

      {/* ── Logout Button ──────────────────────────────────── */}
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                   text-red-500 hover:bg-red-50 transition-colors
                   text-sm font-medium"
      >
        <LogOut size={18} aria-hidden="true" />
        Logout
      </button>
    </div>
  );
}