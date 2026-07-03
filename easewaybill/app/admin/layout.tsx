"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Scale,
  Wallet,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Package,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import Logo from "@/components/layout/Logo";

const adminNav = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { label: "Orders", icon: Package, href: "/admin/orders" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Disputes", icon: Scale, href: "/admin/disputes" },
  { label: "Escrow Ledger", icon: Wallet, href: "/admin/escrow" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-olive-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* ── Admin Sidebar ───────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700">
        {/* Logo */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="bg-red-500 text-white p-1.5 rounded-lg">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">EaseWaybill</p>
              <p className="text-red-400 text-[10px] font-semibold uppercase tracking-wider">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "flex items-center gap-3 px-4 py-3 rounded-xl",
                  "text-sm font-semibold transition-all",
                  active
                    ? "bg-red-500 text-white shadow-lg"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white",
                ].join(" ")}
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        {/* Back to dashboard */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
          >
            <LayoutDashboard size={16} />
            Back to Dashboard
          </Link>

          {/* User */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-700/50">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-red-400 text-[10px] truncate">Administrator</p>
            </div>
            <button
              onClick={() => logout()}
              className="text-gray-400 hover:text-red-400 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
