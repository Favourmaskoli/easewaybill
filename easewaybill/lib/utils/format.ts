// ── Currency ──────────────────────────────────────────────────

export function formatNaira(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₦0";
  return `₦${num.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// ── Date ──────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

// ── Order Status ──────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_BUYER: "Pending Buyer",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAID: "Paid",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_BUYER: "bg-blue-100 text-blue-700",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  IN_TRANSIT: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-green-100 text-green-700",
  DISPUTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  REFUNDED: "bg-purple-100 text-purple-700",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600";
}
