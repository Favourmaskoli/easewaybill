// lib/navigation.ts
// ================================================================
// NAVIGATION & ROUTING CONSTANTS
// ================================================================
// Central place for all navigation items used across the layout.
// Changing a route or label here updates sidebar + bottom nav.
// ================================================================

import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  CreditCard,
  MessageSquare,
  Settings,
  Home,
  Plus,
  Receipt,
  User,
  type LucideIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

/** Sidebar navigation item shape */
export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

/** Mobile bottom-nav item shape (extends NavItem with center flag) */
export interface MobileNavItem extends NavItem {
  isCenter: boolean;
}

/** Page title metadata */
export interface PageMeta {
  title: string;
  subtitle: string;
}

// ── Desktop Sidebar Items ─────────────────────────────────────

export const sidebarNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Orders", icon: ShoppingCart, href: "/dashboard/orders" },
  { label: "Shipments", icon: Truck, href: "/dashboard/shipments" },
  { label: "Payments", icon: CreditCard, href: "/dashboard/payments" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// ── Mobile Bottom Navigation Items ────────────────────────────

export const mobileNavItems: MobileNavItem[] = [
  { label: "Home", icon: Home, href: "/dashboard", isCenter: false },
  { label: "Orders", icon: ShoppingCart, href: "/dashboard/orders", isCenter: false },
  { label: "Create", icon: Plus, href: "/dashboard/orders/create", isCenter: true },
  { label: "Transactions", icon: Receipt, href: "/dashboard/payments", isCenter: false },
  { label: "Profile", icon: User, href: "/dashboard/settings", isCenter: false },
];

// ── Page Title Map ────────────────────────────────────────────
// Used by the desktop header to show page-specific titles.

export const pageTitles: Record<string, PageMeta> = {
  "/dashboard": { title: "Dashboard", subtitle: "Monday, April 7, 2026" },
  "/dashboard/orders": { title: "Orders", subtitle: "Manage your escrow orders" },
  "/dashboard/orders/create": { title: "Create Order", subtitle: "Start a new escrow" },
  "/dashboard/shipments": { title: "Shipments", subtitle: "Track your deliveries" },
  "/dashboard/payments": { title: "Payments", subtitle: "Manage payments & escrow" },
  "/dashboard/messages": { title: "Messages", subtitle: "Chat with buyers & sellers" },
  "/dashboard/settings": { title: "Profile", subtitle: "Manage your account" },
};

// ── Route Helpers ─────────────────────────────────────────────

/**
 * Checks if a nav item's href matches the current pathname.
 * Dashboard root uses exact match; all others use prefix match
 * so that nested routes (e.g. /orders/EWB-001) keep parent active.
 */
export function isRouteActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}