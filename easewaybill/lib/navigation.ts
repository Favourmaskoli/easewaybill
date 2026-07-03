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
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export interface MobileNavItem extends NavItem {
  isCenter: boolean;
}

export interface PageMeta {
  title: string;
  subtitle: string;
}

export const sidebarNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Orders", icon: ShoppingCart, href: "/dashboard/orders" },
  { label: "Shipments", icon: Truck, href: "/dashboard/shipments" },
  { label: "Payments", icon: CreditCard, href: "/dashboard/payments" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// ── Admin-only nav items ──────────────────────────────────────────
export const adminNavItems: NavItem[] = [
  { label: "Admin Panel", icon: ShieldCheck, href: "/admin" },
];

export const mobileNavItems: MobileNavItem[] = [
  { label: "Home", icon: Home, href: "/dashboard", isCenter: false },
  {
    label: "Orders",
    icon: ShoppingCart,
    href: "/dashboard/orders",
    isCenter: false,
  },
  {
    label: "Create",
    icon: Plus,
    href: "/dashboard/orders/create",
    isCenter: true,
  },
  {
    label: "Payments",
    icon: CreditCard,
    href: "/dashboard/payments",
    isCenter: false,
  },
  {
    label: "Profile",
    icon: User,
    href: "/dashboard/settings",
    isCenter: false,
  },
];

export const pageTitles: Record<string, PageMeta> = {
  "/dashboard": { title: "Dashboard", subtitle: "Welcome back" },
  "/dashboard/orders": {
    title: "Orders",
    subtitle: "Manage your escrow orders",
  },
  "/dashboard/orders/create": {
    title: "Create Order",
    subtitle: "Start a new escrow",
  },
  "/dashboard/shipments": {
    title: "Shipments",
    subtitle: "Track your deliveries",
  },
  "/dashboard/payments": {
    title: "Payments",
    subtitle: "Manage payments & escrow",
  },
  "/dashboard/messages": {
    title: "Messages",
    subtitle: "Chat with buyers & sellers",
  },
  "/dashboard/settings": { title: "Profile", subtitle: "Manage your account" },
};
export const riderNavItems: NavItem[] = [
  { label: "My Deliveries", icon: Truck, href: "/rider/orders" },
];

export function isRouteActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/admin") return pathname === "/admin";
  if (href === "/rider/orders") return pathname === "/rider/orders";
  return pathname.startsWith(href);
}
