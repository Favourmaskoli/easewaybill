// // app/dashboard/orders/page.tsx
// // ================================================================
// // ORDERS LIST PAGE — Claymorphism Style
// // ================================================================
// // Desktop: Clay-styled table with filters
// // Mobile:  Clay card list matching "Orders Screen" in mockups
// //
// // Uses:
// //   • clay-card, clay-inset, clay-badge, clay-btn utilities
// //   • MobilePageHeader for the mobile sticky top bar
// //   • StatusBadge for consistent status pills
// // ================================================================

// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import {
//   Search,
//   Plus,
//   Package,
//   ChevronRight,
//   SlidersHorizontal,
// } from "lucide-react";

// // ── Shared Components ─────────────────────────────────────────
// import MobilePageHeader from "@/components/layout/MobilePageHeader";
// import StatusBadge from "@/components/ui/StatusBadge";

// // ── Filter Tabs ───────────────────────────────────────────────
// const filterTabs = [
//   "All",
//   "Pending",
//   "Paid",
//   "Shipped",
//   "Delivered",
//   "Completed",
// ];

// // ── Mock Orders ───────────────────────────────────────────────
// const allOrders = [
//   {
//     id: "EWB-001",
//     item: "iPhone 15 Pro Max",
//     amount: "₦850,000",
//     status: "Pending",
//     statusColor: "bg-yellow-100 text-yellow-700",
//     date: "Apr 7, 2026",
//   },
//   {
//     id: "EWB-002",
//     item: 'Samsung 65" TV',
//     amount: "₦320,000",
//     status: "Paid",
//     statusColor: "bg-olive-100 text-olive-700",
//     date: "Apr 6, 2026",
//   },
//   {
//     id: "EWB-003",
//     item: "MacBook Air M2",
//     amount: "₦1,100,000",
//     status: "Shipped",
//     statusColor: "bg-blue-100 text-blue-700",
//     date: "Apr 5, 2026",
//   },
//   {
//     id: "EWB-004",
//     item: "PS5 Console",
//     amount: "₦450,000",
//     status: "Delivered",
//     statusColor: "bg-amber-100 text-amber-700",
//     date: "Apr 4, 2026",
//   },
//   {
//     id: "EWB-005",
//     item: "Laptop Stand + Hub",
//     amount: "₦45,000",
//     status: "Completed",
//     statusColor: "bg-olive-100 text-olive-700",
//     date: "Apr 3, 2026",
//   },
//   {
//     id: "EWB-006",
//     item: "AirPods Pro 2",
//     amount: "₦150,000",
//     status: "Pending",
//     statusColor: "bg-yellow-100 text-yellow-700",
//     date: "Apr 2, 2026",
//   },
//   {
//     id: "EWB-007",
//     item: "Sony Camera A7IV",
//     amount: "₦2,200,000",
//     status: "Paid",
//     statusColor: "bg-olive-100 text-olive-700",
//     date: "Apr 1, 2026",
//   },
//   {
//     id: "EWB-008",
//     item: "Mechanical Keyboard",
//     amount: "₦75,000",
//     status: "Completed",
//     statusColor: "bg-olive-100 text-olive-700",
//     date: "Mar 30, 2026",
//   },
// ];

// // ================================================================
// // COMPONENT
// // ================================================================

// export default function OrdersPage() {
//   // ── Active filter tab state ─────────────────────────────────
//   const [activeFilter, setActiveFilter] = useState("All");

//   // ── Search query state ──────────────────────────────────────
//   const [searchQuery, setSearchQuery] = useState("");

//   // ── Filtered orders based on tab + search ───────────────────
//   const filteredOrders = allOrders.filter((order) => {
//     // Match filter tab
//     const matchesFilter =
//       activeFilter === "All" || order.status === activeFilter;
//     // Match search query against item name or order ID
//     const matchesSearch =
//       order.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       order.id.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesFilter && matchesSearch;
//   });

//   return (
//     <>
//       {/* ============================================================
//           MOBILE VIEW
//           ============================================================ */}
//       <div className="lg:hidden min-h-screen">
//         {/* ── Sticky Mobile Header ─────────────────────────── */}
//         <MobilePageHeader
//           title="Orders Screen"
//           showBack={false}
//           rightSlot={
//             <button
//               className="p-2.5 text-olive-700 bg-cream-100
//                          rounded-xl hover:bg-olive-50 transition-colors"
//               aria-label="Search orders"
//             >
//               <Search size={20} />
//             </button>
//           }
//         />

//         <div className="px-5 pt-4 pb-6 space-y-4">
//           {/* ── Search Input (Clay inset) ──────────────────── */}
//           <div className="clay-inset flex items-center gap-2 px-3.5 py-2.5">
//             <Search size={16} className="text-gray-400 shrink-0" />
//             <input
//               type="search"
//               placeholder="Search orders..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="bg-transparent text-sm text-gray-600
//                          outline-none placeholder:text-gray-400 w-full"
//               aria-label="Search orders"
//             />
//           </div>

//           {/* ── Filter Tabs (horizontally scrollable) ──────── */}
//           <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
//             {filterTabs.map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveFilter(tab)}
//                 className={[
//                   "px-4 py-2 rounded-full text-xs font-semibold",
//                   "whitespace-nowrap transition-all duration-200",
//                   activeFilter === tab
//                     ? // Active tab — raised clay button style
//                       "clay-btn text-white"
//                     : // Inactive tab — sunken clay surface
//                       "clay-inset text-gray-600 hover:text-olive-700",
//                 ].join(" ")}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>

//           {/* ── Section Title ──────────────────────────────── */}
//           <h2 className="text-base font-bold text-olive-900 pt-1">
//             All escrow orders
//           </h2>

//           {/* ── Order Cards List ───────────────────────────── */}
//           <div className="space-y-3">
//             {filteredOrders.length === 0 ? (
//               /* Empty state */
//               <div className="clay-card p-8 text-center">
//                 <Package
//                   size={40}
//                   className="text-gray-300 mx-auto mb-3"
//                 />
//                 <p className="text-sm text-gray-500">No orders found</p>
//               </div>
//             ) : (
//               filteredOrders.map((order) => (
//                 <Link
//                   key={order.id}
//                   href={`/dashboard/orders/${order.id}`}
//                   className="clay-card flex items-center gap-3 p-4
//                              active:scale-[0.98] transition-transform"
//                 >
//                   {/* Product thumbnail placeholder */}
//                   <div
//                     className="clay-inset w-12 h-12 flex items-center
//                                justify-center shrink-0"
//                   >
//                     <Package
//                       size={20}
//                       className="text-olive-500"
//                       aria-hidden="true"
//                     />
//                   </div>

//                   {/* Order details */}
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between gap-2">
//                       <p className="text-sm font-semibold text-olive-900 truncate">
//                         {order.item}
//                       </p>
//                       <StatusBadge
//                         label={order.status}
//                         colorClass={order.statusColor}
//                         size="sm"
//                       />
//                     </div>
//                     <div className="flex items-center gap-2 mt-1">
//                       <p className="text-xs text-gray-500">Amount</p>
//                       <p className="text-xs font-semibold text-olive-800">
//                         {order.amount}
//                       </p>
//                     </div>
//                   </div>
//                 </Link>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ============================================================
//           DESKTOP VIEW
//           ============================================================ */}
//       <div className="hidden lg:block p-6 space-y-6">
//         {/* ── Header: Title + Create Button ────────────────── */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-2xl font-bold text-olive-900">
//               All Orders
//             </h2>
//             <p className="text-sm text-gray-500 mt-1">
//               {allOrders.length} total orders ·{" "}
//               {filteredOrders.length} shown
//             </p>
//           </div>

//           <Link
//             href="/dashboard/orders/create"
//             className="clay-btn flex items-center gap-2 px-5 py-2.5"
//           >
//             <Plus size={18} />
//             New Order
//           </Link>
//         </div>

//         {/* ── Search + Filter Row ──────────────────────────── */}
//         <div className="flex items-center gap-4">
//           {/* Search box */}
//           <div className="clay-inset flex items-center gap-2 px-3.5 py-2.5 w-72">
//             <Search size={16} className="text-gray-400 shrink-0" />
//             <input
//               type="search"
//               placeholder="Search orders..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="bg-transparent text-sm text-gray-600
//                          outline-none placeholder:text-gray-400 w-full"
//               aria-label="Search orders"
//             />
//           </div>

//           {/* Filter pills */}
//           <div className="flex gap-2 overflow-x-auto scrollbar-hide">
//             {filterTabs.map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveFilter(tab)}
//                 className={[
//                   "px-4 py-2 rounded-full text-xs font-semibold",
//                   "whitespace-nowrap transition-all duration-200",
//                   activeFilter === tab
//                     ? "clay-btn text-white"
//                     : "clay-inset text-gray-600 hover:text-olive-700",
//                 ].join(" ")}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>

//           {/* Filter icon button */}
//           <button
//             className="clay-inset p-2.5 text-gray-500
//                        hover:text-olive-600 transition-colors"
//             aria-label="Advanced filters"
//           >
//             <SlidersHorizontal size={18} />
//           </button>
//         </div>

//         {/* ── Orders Table (Clay Card) ─────────────────────── */}
//         <div className="clay-card !p-0 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               {/* Table Head */}
//               <thead>
//                 <tr className="bg-cream-100/40">
//                   {["Order ID", "Item", "Amount", "Status", "Date", ""].map(
//                     (col) => (
//                       <th
//                         key={col || "action"}
//                         scope="col"
//                         className={[
//                           "text-left text-xs font-semibold text-gray-500",
//                           "uppercase tracking-wide px-5 py-3.5",
//                           col === "" ? "w-10" : "",
//                         ].join(" ")}
//                       >
//                         {col}
//                       </th>
//                     )
//                   )}
//                 </tr>
//               </thead>

//               {/* Table Body */}
//               <tbody className="divide-y divide-cream-200/60">
//                 {filteredOrders.map((order) => (
//                   <tr
//                     key={order.id}
//                     className="hover:bg-olive-50/30 transition-colors"
//                   >
//                     {/* Order ID */}
//                     <td className="px-5 py-4">
//                       <span className="text-sm font-bold text-olive-600">
//                         {order.id}
//                       </span>
//                     </td>

//                     {/* Item */}
//                     <td className="px-5 py-4">
//                       <span className="text-sm font-medium text-olive-800">
//                         {order.item}
//                       </span>
//                     </td>

//                     {/* Amount */}
//                     <td className="px-5 py-4">
//                       <span className="text-sm font-semibold text-olive-800">
//                         {order.amount}
//                       </span>
//                     </td>

//                     {/* Status */}
//                     <td className="px-5 py-4">
//                       <span
//                         className={`clay-badge ${order.statusColor}`}
//                       >
//                         {order.status}
//                       </span>
//                     </td>

//                     {/* Date */}
//                     <td className="px-5 py-4">
//                       <time className="text-xs text-gray-400">
//                         {order.date}
//                       </time>
//                     </td>

//                     {/* Action */}
//                     <td className="px-5 py-4">
//                       <Link
//                         href={`/dashboard/orders/${order.id}`}
//                         className="p-2 text-gray-400 hover:text-olive-600
//                                    clay-inset inline-flex
//                                    hover:shadow-olive-sm transition-all"
//                         aria-label={`View order ${order.id}`}
//                       >
//                         <ChevronRight size={16} />
//                       </Link>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             {/* Empty state */}
//             {filteredOrders.length === 0 && (
//               <div className="py-16 text-center">
//                 <Package
//                   size={48}
//                   className="text-gray-300 mx-auto mb-3"
//                 />
//                 <p className="text-sm text-gray-400">
//                   No orders match your search
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }


// app/dashboard/orders/page.tsx
// ================================================================
// ORDERS LIST PAGE — Deep Olive Claymorphism
// ================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Package,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

const filterTabs = ["All","Pending","Paid","Shipped","Delivered","Completed"];

const allOrders = [
  { id: "EWB-001", item: "iPhone 15 Pro Max", amount: "₦850,000", status: "Pending", statusColor: "bg-yellow-100 text-yellow-800", date: "Apr 7, 2026" },
  { id: "EWB-002", item: 'Samsung 65" TV', amount: "₦320,000", status: "Paid", statusColor: "bg-olive-100 text-olive-800", date: "Apr 6, 2026" },
  { id: "EWB-003", item: "MacBook Air M2", amount: "₦1,100,000", status: "Shipped", statusColor: "bg-blue-100 text-blue-800", date: "Apr 5, 2026" },
  { id: "EWB-004", item: "PS5 Console", amount: "₦450,000", status: "Delivered", statusColor: "bg-amber-100 text-amber-800", date: "Apr 4, 2026" },
  { id: "EWB-005", item: "Laptop Stand + Hub", amount: "₦45,000", status: "Completed", statusColor: "bg-olive-100 text-olive-800", date: "Apr 3, 2026" },
  { id: "EWB-006", item: "AirPods Pro 2", amount: "₦150,000", status: "Pending", statusColor: "bg-yellow-100 text-yellow-800", date: "Apr 2, 2026" },
  { id: "EWB-007", item: "Sony Camera A7IV", amount: "₦2,200,000", status: "Paid", statusColor: "bg-olive-100 text-olive-800", date: "Apr 1, 2026" },
  { id: "EWB-008", item: "Mechanical Keyboard", amount: "₦75,000", status: "Completed", statusColor: "bg-olive-100 text-olive-800", date: "Mar 30, 2026" },
];

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = allOrders.filter((o) => {
    const matchFilter = activeFilter === "All" || o.status === activeFilter;
    const matchSearch =
      o.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      {/* ============================================================
          MOBILE VIEW
          ============================================================ */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader
          title="Orders"
          showBack={false}
          rightSlot={
            <button
              className="p-2.5 rounded-xl transition-colors clay-inset
                         text-olive-700"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          }
        />

        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* Search */}
          <div className="clay-inset flex items-center gap-2 px-3.5 py-3">
            <Search size={15} className="text-olive-400 shrink-0" />
            <input
              type="search"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-olive-800
                         outline-none placeholder:text-olive-400 w-full"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={[
                  "px-4 py-2 rounded-full text-xs font-semibold",
                  "whitespace-nowrap transition-all duration-200",
                  activeFilter === tab
                    ? "clay-btn text-white"
                    : "clay-inset text-olive-600",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>

          <h2 className="text-sm font-bold text-olive-800">
            All escrow orders
          </h2>

          {/* Cards */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="clay-card py-10 text-center">
                <Package size={38} className="text-olive-300 mx-auto mb-3" />
                <p className="text-sm text-olive-500">No orders found</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="clay-card flex items-center gap-3 !p-4
                             active:scale-[0.98] transition-transform"
                >
                  {/* Thumbnail */}
                  <div
                    className="clay-inset w-12 h-12 flex items-center
                               justify-center shrink-0"
                  >
                    <Package size={20} className="text-olive-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-olive-900 truncate">
                        {order.item}
                      </p>
                      <span className={`clay-badge ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-xs text-olive-500">Amount</p>
                      <p className="text-xs font-bold text-olive-700">
                        {order.amount}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          DESKTOP VIEW
          ============================================================ */}
      <div className="hidden lg:block p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-olive-900">
              All Orders
            </h2>
            <p className="text-sm text-olive-500 mt-1">
              {allOrders.length} total · {filteredOrders.length} shown
            </p>
          </div>
          <Link
            href="/dashboard/orders/create"
            className="clay-btn flex items-center gap-2 px-5 py-2.5"
          >
            <Plus size={18} />
            New Order
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="clay-inset flex items-center gap-2 px-3.5 py-2.5 w-64">
            <Search size={15} className="text-olive-400 shrink-0" />
            <input
              type="search"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-olive-800
                         outline-none placeholder:text-olive-400 w-full"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={[
                  "px-4 py-2 rounded-full text-xs font-semibold",
                  "whitespace-nowrap transition-all",
                  activeFilter === tab
                    ? "clay-btn text-white"
                    : "clay-inset text-olive-600",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            className="clay-inset p-2.5 text-olive-600
                       hover:text-olive-800 transition-colors ml-auto"
            aria-label="Advanced filters"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="clay-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-olive-50), var(--color-cream-200))",
                  }}
                >
                  {["Order ID","Item","Amount","Status","Date",""].map((col) => (
                    <th
                      key={col || "action"}
                      scope="col"
                      className="text-left text-[11px] font-bold text-olive-600
                                 uppercase tracking-wider px-5 py-3.5"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={[
                      "hover:bg-olive-50/40 transition-colors",
                      idx !== filteredOrders.length - 1
                        ? "border-b border-cream-300/60"
                        : "",
                    ].join(" ")}
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-olive-600">
                        {order.id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-olive-800">
                        {order.item}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-olive-700">
                        {order.amount}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`clay-badge ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <time className="text-xs text-olive-500">
                        {order.date}
                      </time>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="clay-inset inline-flex p-2 text-olive-500
                                   hover:text-olive-800 transition-colors"
                        aria-label={`View ${order.id}`}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="py-16 text-center">
                <Package size={44} className="text-olive-300 mx-auto mb-3" />
                <p className="text-sm text-olive-400">
                  No orders match your search
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}