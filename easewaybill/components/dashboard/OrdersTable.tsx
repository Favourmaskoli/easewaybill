// import React from "react";
// import Link from "next/link";
// import { Eye } from "lucide-react";
// import SectionHeader from "@/components/ui/SectionHeader";
// import StatusBadge from "@/components/ui/StatusBadge";
// import type { Order } from "@/lib/mock-data";
// import { useOrders } from "@/lib/hooks/useOrders";

// interface OrdersTableProps {
//   showHeader?: boolean;
//   title?: string;
//   subtitle?: string;
//   viewAllHref?: string;
// }

// const columns = [
//   { key: "id", label: "Order ID" },
//   { key: "item", label: "Item" },
//   { key: "buyer", label: "Buyer" },
//   { key: "amount", label: "Amount" },
//   { key: "status", label: "Status" },
//   { key: "date", label: "Date" },
// ] as const;

// export default function OrdersTable({
//   showHeader = true,
//   title = "Recent Orders",
//   subtitle = "Your latest orders",
//   viewAllHref = "/dashboard/orders",
// }: OrdersTableProps) {
//   const { orders, total, isLoading } = useOrders({
//     limit: 50,
//   });
//   return (
//     <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
//       {showHeader && (
//         <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
//           <SectionHeader
//             title={title}
//             subtitle={subtitle}
//             linkText="View All"
//             linkHref={viewAllHref}
//           />
//         </div>
//       )}

//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="bg-gray-50">
//               {columns.map((col) => (
//                 <th
//                   key={col.key}
//                   className="text-left text-[11px] font-bold text-gray-500
//                              uppercase tracking-wider px-5 py-3.5"
//                 >
//                   {col.label}
//                 </th>
//               ))}
//               <th className="px-5 py-3.5 w-10" />
//             </tr>
//           </thead>

//           <tbody className="divide-y divide-gray-50">
//             {orders.map((order) => (
//               <tr
//                 key={order.id}
//                 className="hover:bg-green-50/30 transition-colors cursor-pointer"
//               >
//                 <td className="px-5 py-4">
//                   <span className="text-sm font-bold text-green-600">
//                     {order.id}
//                   </span>
//                 </td>
//                 <td className="px-5 py-4">
//                   <span className="text-sm font-medium text-gray-800 truncate max-w-[160px] block">
//                     {order.items.map((item) => item.name).join(", ")}
//                   </span>
//                 </td>
//                 <td className="px-5 py-4">
//                   <span className="text-sm text-gray-600">{order.buyerName}</span>
//                 </td>
//                 <td className="px-5 py-4">
//                   <span className="text-sm font-semibold text-gray-800">
//                     {order.itemPrice}
//                   </span>
//                 </td>
//                 <td className="px-5 py-4">
//                   <StatusBadge
//                     label={order.status}
//                     colorClass={order.status}
//                   />
//                 </td>
//                 <td className="px-5 py-4">
//                   <time className="text-xs text-gray-400">{order.createdAt}</time>
//                 </td>
//                 <td className="px-5 py-4">
//                   <Link
//                     href={`/dashboard/orders/${order.id}`}
//                     className="p-1.5 text-gray-400 hover:text-green-600
//                                rounded-lg transition-colors inline-flex"
//                     aria-label={`View order ${order.id}`}
//                   >
//                     <Eye size={15} />
//                   </Link>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {orders.length === 0 && (
//           <div className="py-16 text-center">
//             <p className="text-sm text-gray-400 mb-2">No orders yet</p>
//             <Link
//               href="/dashboard/orders/create"
//               className="text-sm text-green-600 font-semibold hover:underline"
//             >
//               Create your first order →
//             </Link>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import type { Order } from "@/lib/types/api.types";
import { useOrders } from "@/lib/hooks/useOrders";

interface OrdersTableProps {
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
}

const columns = [
  { key: "id", label: "Order ID" },
  { key: "item", label: "Item" },
  { key: "buyer", label: "Buyer" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
] as const;

const SKELETON_ROWS = 5;

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso; // fallback if ever malformed
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersTable({
  showHeader = true,
  title = "Recent Orders",
  subtitle = "Your latest orders",
  viewAllHref = "/dashboard/orders",
}: OrdersTableProps) {
  const router = useRouter();
  const { orders, total, isLoading, error } = useOrders({
    limit: 50,
  });

  const handleRowClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  const handleRowKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    orderId: string,
  ) => {
    // Table rows aren't natively focusable/actionable, so Enter/Space need
    // to be wired manually to match the click behavior for keyboard users.
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRowClick(orderId);
    }
  };

  const showEmptyState = !isLoading && !error && orders.length === 0;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {showHeader && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <SectionHeader
            title={title}
            subtitle={subtitle}
            linkText="View All"
            linkHref={viewAllHref}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="text-left text-[11px] font-bold text-gray-500
                             uppercase tracking-wider px-5 py-3.5"
                >
                  {col.label}
                </th>
              ))}
              <th scope="col" className="px-5 py-3.5 w-10">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {isLoading &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={`skeleton-${i}`} aria-hidden="true">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <div className="h-3.5 w-3.5 bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {!isLoading &&
              !error &&
              orders.map((order: Order) => (
                <tr
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(order.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, order.id)}
                  className="hover:bg-green-50/30 transition-colors cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:ring-inset"
                >
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-green-600">
                      {order.trackingCode}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[160px] block">
                      {order.items?.length
                        ? order.items.map((item) => item.name).join(", ")
                        : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-600">
                      {order.buyerName ?? order.buyerEmail ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-gray-800">
                      {order.totalAmount}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={order.status}
                      colorClass={order.status}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <time
                      dateTime={order.createdAt}
                      className="text-xs text-gray-400"
                    >
                      {formatOrderDate(order.createdAt)}
                    </time>
                  </td>
                  <td className="px-5 py-4">
                    {/* stopPropagation so the icon's own navigation doesn't
                        double-fire the row's onClick as well */}
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-gray-400 hover:text-green-600
                                 rounded-lg transition-colors inline-flex"
                      aria-label={`View order ${order.id}`}
                    >
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {error && (
          <div className="py-16 text-center">
            <p className="text-sm text-red-500 mb-1">Couldn't load orders</p>
            <p className="text-xs text-gray-400">{error}</p>
          </div>
        )}

        {showEmptyState && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400 mb-2">No orders yet</p>
            <Link
              href="/dashboard/orders/create"
              className="text-sm text-green-600 font-semibold hover:underline"
            >
              Create your first order →
            </Link>
          </div>
        )}
      </div>

      {!isLoading && !error && total > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {orders.length} of {total} order{total === 1 ? "" : "s"}
        </div>
      )}
    </section>
  );
}
