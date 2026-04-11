// lib/mock-data.ts
// ================================================================
// MOCK DATA — Centralised
// ================================================================
// All mock/dummy data lives here so it's easy to:
//   1. Swap out for real API calls later
//   2. Share between desktop + mobile views
//   3. Keep page components clean
// ================================================================

import {
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

export interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}

export interface QuickStat {
  label: string;
  value: string;
}

export interface Order {
  id: string;
  item: string;
  buyer: string;
  amount: string;
  status: string;
  statusColor: string;
  date: string;
}

export interface StatusBar {
  label: string;
  count: number;
  dotColor: string;
  barColor: string;
  /** CSS width string, e.g. "60%" */
  width: string;
}

export interface PendingAction {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
  bg: string;
  border: string;
  iconColor: string;
  btnClass: string;
}

export interface QuickAction {
  label: string;
  desc: string;
  icon: LucideIcon;
  href: string;
  bg: string;
  iconBg: string;
}

// ── Dashboard Stats (Desktop) ─────────────────────────────────

export const statsData: StatItem[] = [
  {
    title: "Total Orders",
    value: "24",
    change: "+3 this week",
    icon: ShoppingCart,
    bgColor: "bg-olive-50",
    textColor: "text-olive-600",
  },
  {
    title: "In Escrow",
    value: "₦450,000",
    change: "6 active orders",
    icon: CreditCard,
    bgColor: "bg-olive-100",
    textColor: "text-olive-700",
  },
  {
    title: "In Transit",
    value: "8",
    change: "Awaiting delivery",
    icon: Truck,
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    title: "Completed",
    value: "16",
    change: "₦1.2M released",
    icon: CheckCircle,
    bgColor: "bg-olive-50",
    textColor: "text-olive-600",
  },
];

// ── Mobile Quick Stats ────────────────────────────────────────

export const mobileQuickStats: QuickStat[] = [
  { label: "Active\nOrders", value: "11" },
  { label: "Completed\nOrders", value: "20" },
  { label: "Pending\nDeliveries", value: "1" },
];

// ── Recent Orders ─────────────────────────────────────────────

export const recentOrders: Order[] = [
  {
    id: "EWB-001",
    item: "iPhone 15 Pro Max",
    buyer: "Adaeze Obi",
    amount: "₦850,000",
    status: "In Transit",
    statusColor: "bg-amber-100 text-amber-700",
    date: "Apr 7, 2026",
  },
  {
    id: "EWB-002",
    item: 'Samsung 65" TV',
    buyer: "Emeka Nwosu",
    amount: "₦320,000",
    status: "Awaiting Payment",
    statusColor: "bg-yellow-100 text-yellow-700",
    date: "Apr 6, 2026",
  },
  {
    id: "EWB-003",
    item: "MacBook Air M2",
    buyer: "Fatima Bello",
    amount: "₦1,100,000",
    status: "Completed",
    statusColor: "bg-olive-100 text-olive-700",
    date: "Apr 5, 2026",
  },
  {
    id: "EWB-004",
    item: "PS5 Console",
    buyer: "Tunde Adeola",
    amount: "₦450,000",
    status: "Disputed",
    statusColor: "bg-red-100 text-red-700",
    date: "Apr 4, 2026",
  },
  {
    id: "EWB-005",
    item: "Laptop Stand + Hub",
    buyer: "Chinyere Uzo",
    amount: "₦45,000",
    status: "Completed",
    statusColor: "bg-olive-100 text-olive-700",
    date: "Apr 3, 2026",
  },
];

// ── Order Status Bars (Desktop Widget) ────────────────────────

export const statusBars: StatusBar[] = [
  { label: "Awaiting Payment", count: 3, dotColor: "bg-yellow-400", barColor: "bg-yellow-400", width: "25%" },
  { label: "In Transit", count: 8, dotColor: "bg-amber-400", barColor: "bg-amber-400", width: "60%" },
  { label: "Completed", count: 16, dotColor: "bg-olive-500", barColor: "bg-olive-500", width: "80%" },
  { label: "Disputed", count: 1, dotColor: "bg-red-500", barColor: "bg-red-500", width: "8%" },
];

// ── Pending Actions ───────────────────────────────────────────

export const pendingActions: PendingAction[] = [
  {
    id: "EWB-002",
    title: "EWB-002 Awaiting Payment",
    description: "Samsung TV — ₦320,000",
    actionLabel: "Pay Now",
    icon: Clock,
    bg: "bg-yellow-50",
    border: "border-yellow-100",
    iconColor: "text-yellow-600",
    btnClass: "text-yellow-700 bg-yellow-100 hover:bg-yellow-200",
  },
  {
    id: "EWB-004",
    title: "EWB-004 Dispute Open",
    description: "PS5 Console — ₦450,000",
    actionLabel: "Resolve",
    icon: AlertTriangle,
    bg: "bg-red-50",
    border: "border-red-100",
    iconColor: "text-red-500",
    btnClass: "text-red-700 bg-red-100 hover:bg-red-200",
  },
  {
    id: "EWB-001",
    title: "EWB-001 Confirm Delivery",
    description: "iPhone 15 Pro — ₦850,000",
    actionLabel: "Confirm",
    icon: CheckCircle,
    bg: "bg-olive-50",
    border: "border-olive-100",
    iconColor: "text-olive-600",
    btnClass: "text-olive-700 bg-olive-100 hover:bg-olive-200",
  },
];

// ── Quick Actions (Desktop Sidebar Widget) ────────────────────

import { Plus, MessageSquare } from "lucide-react";

export const quickActions: QuickAction[] = [
  {
    label: "Create Order",
    desc: "Start a new escrow order",
    icon: Plus,
    href: "/dashboard/orders/create",
    bg: "bg-olive-50",
    iconBg: "bg-olive-600",
  },
  {
    label: "Track Shipment",
    desc: "8 orders in transit",
    icon: Truck,
    href: "/dashboard/shipments",
    bg: "bg-amber-50",
    iconBg: "bg-amber-500",
  },
  {
    label: "Payments",
    desc: "₦450K in escrow",
    icon: CreditCard,
    href: "/dashboard/payments",
    bg: "bg-olive-50",
    iconBg: "bg-olive-500",
  },
  {
    label: "Messages",
    desc: "2 unread messages",
    icon: MessageSquare,
    href: "/dashboard/messages",
    bg: "bg-olive-100/50",
    iconBg: "bg-olive-700",
  },
];