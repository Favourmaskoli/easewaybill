// // "use client";

// // import { useState } from "react";
// // import { Search, Bell, X } from "lucide-react";
// // import Avatar from "@/components/ui/Avatar";

// // interface DesktopHeaderProps {
// //   /** Page title displayed on the left */
// //   title: string;
// //   /** Optional subtitle below the title */
// //   subtitle?: string;
// // }

// // export default function DesktopHeader({ title, subtitle }: DesktopHeaderProps) {
// //   const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

// //   const openNotificationModal = () => setIsNotificationModalOpen(true);
// //   const closeNotificationModal = () => setIsNotificationModalOpen(false);

// //   return (
// //     <>
// //       <header
// //         className="hidden lg:flex items-center justify-between
// //                    bg-white/80 backdrop-blur-md border-b border-cream-300
// //                    px-6 py-4 shrink-0 sticky top-0 z-10"
// //       >
// //         {/* ── Left: Page Title ───────────────────────────────── */}
// //         <div className="flex items-center gap-4 min-w-0">
// //           <div>
// //             <h1 className="text-xl font-bold text-olive-900 leading-tight">
// //               {title}
// //             </h1>
// //             {subtitle && (
// //               <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
// //             )}
// //           </div>
// //         </div>

// //         {/* ── Right: Search + Bell + Avatar ──────────────────── */}
// //         <div className="flex items-center gap-3">
// //           {/* Search Input */}
// //           <div
// //             className="flex items-center gap-2 bg-cream-100 border border-cream-300
// //                        rounded-xl px-3.5 py-2.5 w-56
// //                        focus-within:border-olive-400 focus-within:ring-2
// //                        focus-within:ring-olive-100 transition-all"
// //           >
// //             <Search
// //               size={15}
// //               className="text-gray-400 shrink-0"
// //               aria-hidden="true"
// //             />
// //             <input
// //               type="search"
// //               placeholder="Search..."
// //               className="bg-transparent text-sm text-gray-600 outline-none
// //                          placeholder:text-gray-400 w-full"
// //               aria-label="Search"
// //             />
// //           </div>

// //           {/* Notification Bell */}
// //           <button
// //             type="button"
// //             onClick={openNotificationModal}
// //             className="relative p-2.5 text-gray-500 hover:text-olive-600
// //                        hover:bg-olive-50 rounded-xl transition-colors"
// //             aria-label="View notifications"
// //             aria-haspopup="dialog"
// //             aria-expanded={isNotificationModalOpen}
// //           >
// //             <Bell size={20} />
// //             {/* Unread indicator dot */}
// //             <span
// //               className="absolute top-2 right-2 w-2 h-2 bg-red-500
// //                          rounded-full ring-2 ring-white"
// //               aria-hidden="true"
// //             />
// //           </button>

// //           {/* User Avatar */}
// //           <Avatar
// //             initials="JD"
// //             size="md"
// //             className="cursor-pointer hover:ring-2 hover:ring-olive-300
// //                        transition-all"
// //           />
// //         </div>
// //       </header>

// //       {/* ── Notifications Modal ─────────────────────────────── */}
// //       {isNotificationModalOpen && (
// //         <div
// //           className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
// //           role="dialog"
// //           aria-modal="true"
// //           aria-labelledby="notifications-modal-title"
// //           onClick={closeNotificationModal}
// //         >
// //           <div
// //             className="w-full max-w-md rounded-2xl border border-cream-300 bg-white p-6 shadow-2xl"
// //             onClick={(event) => event.stopPropagation()}
// //           >
// //             <div className="mb-5 flex items-center justify-between">
// //               <div>
// //                 <h2
// //                   id="notifications-modal-title"
// //                   className="text-lg font-bold text-olive-900"
// //                 >
// //                   Notifications
// //                 </h2>
// //                 <p className="mt-1 text-sm text-gray-400">
// //                   Your latest updates appear here.
// //                 </p>
// //               </div>

// //               <button
// //                 type="button"
// //                 onClick={closeNotificationModal}
// //                 className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-cream-100 hover:text-olive-900"
// //                 aria-label="Close notifications"
// //               >
// //                 <X size={20} />
// //               </button>
// //             </div>

// //             <div className="space-y-3">
// //               <article className="rounded-xl border border-cream-300 bg-cream-100 p-4">
// //                 <p className="text-sm font-semibold text-olive-800">
// //                   Welcome back
// //                 </p>
// //                 <p className="mt-1 text-sm text-gray-400">
// //                   Your dashboard is ready for today.
// //                 </p>
// //               </article>

// //               <article className="rounded-xl border border-cream-300 bg-cream-100 p-4">
// //                 <p className="text-sm font-semibold text-olive-800">
// //                   New order update
// //                 </p>
// //                 <p className="mt-1 text-sm text-gray-400">
// //                   Check your recent order activity.
// //                 </p>
// //               </article>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </>
// //   );
// // }

// "use client";

// import { useState } from "react";
// import {
//   Search,
//   Bell,
//   X,
//   CheckCheck,
//   BellOff,
//   AlertTriangle,
// } from "lucide-react";
// import Link from "next/link";
// import Avatar from "@/components/ui/Avatar";
// import { useNotifications } from "@/lib/hooks/useNotifications";

// interface DesktopHeaderProps {
//   /** Page title displayed on the left */
//   title: string;
//   /** Optional subtitle below the title */
//   subtitle?: string;
// }

// export default function DesktopHeader({ title, subtitle }: DesktopHeaderProps) {
//   const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

//   const {
//     notifications,
//     unreadCount,
//     isLoading,
//     error,
//     markRead,
//     markAllRead,
//   } = useNotifications({ limit: 5 });

//   const openNotificationModal = () => setIsNotificationModalOpen(true);
//   const closeNotificationModal = () => setIsNotificationModalOpen(false);

//   return (
//     <>
//       <header
//         className="hidden lg:flex items-center justify-between
//                    bg-white/80 backdrop-blur-md border-b border-cream-300
//                    px-6 py-4 shrink-0 sticky top-0 z-10"
//       >
//         {/* ── Left: Page Title ───────────────────────────────── */}
//         <div className="flex items-center gap-4 min-w-0">
//           <div>
//             <h1 className="text-xl font-bold text-olive-900 leading-tight">
//               {title}
//             </h1>
//             {subtitle && (
//               <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
//             )}
//           </div>
//         </div>

//         {/* ── Right: Search + Bell + Avatar ──────────────────── */}
//         <div className="flex items-center gap-3">
//           {/* Search Input */}
//           <div
//             className="flex items-center gap-2 bg-cream-100 border border-cream-300
//                        rounded-xl px-3.5 py-2.5 w-56
//                        focus-within:border-olive-400 focus-within:ring-2
//                        focus-within:ring-olive-100 transition-all"
//           >
//             <Search
//               size={15}
//               className="text-gray-400 shrink-0"
//               aria-hidden="true"
//             />
//             <input
//               type="search"
//               placeholder="Search..."
//               className="bg-transparent text-sm text-gray-600 outline-none
//                          placeholder:text-gray-400 w-full"
//               aria-label="Search"
//             />
//           </div>

//           {/* Notification Bell */}
//           <button
//             type="button"
//             onClick={openNotificationModal}
//             className="relative p-2.5 text-gray-500 hover:text-olive-600
//                        hover:bg-olive-50 rounded-xl transition-colors"
//             aria-label="View notifications"
//             aria-haspopup="dialog"
//             aria-expanded={isNotificationModalOpen}
//           >
//             <Bell size={20} />
//             {/* Unread indicator dot */}
//             {unreadCount > 0 && (
//               <span
//                 className="absolute top-2 right-2 w-2 h-2 bg-red-500
//                            rounded-full ring-2 ring-white"
//                 aria-hidden="true"
//               />
//             )}
//           </button>

//           {/* User Avatar */}
//           <Avatar
//             initials="JD"
//             size="md"
//             className="cursor-pointer hover:ring-2 hover:ring-olive-300
//                        transition-all"
//           />
//         </div>
//       </header>

//       {/* ── Notifications Modal ─────────────────────────────── */}
//       {isNotificationModalOpen && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="notifications-modal-title"
//           onClick={closeNotificationModal}
//         >
//           <div
//             className="w-full max-w-md rounded-2xl border border-cream-300 bg-white p-6 shadow-2xl"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="mb-5 flex items-start justify-between">
//               <div>
//                 <h2
//                   id="notifications-modal-title"
//                   className="text-lg font-bold text-olive-900"
//                 >
//                   Notifications
//                 </h2>
//                 <p className="mt-1 text-sm text-gray-400">
//                   {unreadCount > 0
//                     ? `${unreadCount} unread`
//                     : "You're all caught up"}
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={closeNotificationModal}
//                 className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-cream-100 hover:text-olive-900"
//                 aria-label="Close notifications"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             {/* ── Loading ───────────────────────────────────── */}
//             {isLoading && (
//               <div className="space-y-3">
//                 {Array.from({ length: 3 }).map((_, i) => (
//                   <div
//                     key={i}
//                     className="h-16 rounded-xl bg-cream-100 animate-pulse"
//                   />
//                 ))}
//               </div>
//             )}

//             {/* ── Error ─────────────────────────────────────── */}
//             {!isLoading && error && (
//               <div className="rounded-xl border border-cream-300 bg-cream-100 py-8 text-center">
//                 <AlertTriangle
//                   size={28}
//                   className="mx-auto mb-2 text-red-400"
//                 />
//                 <p className="text-sm font-semibold text-red-600">{error}</p>
//               </div>
//             )}

//             {/* ── Empty ─────────────────────────────────────── */}
//             {!isLoading && !error && notifications.length === 0 && (
//               <div className="rounded-xl border border-cream-300 bg-cream-100 py-10 text-center">
//                 <BellOff size={26} className="mx-auto mb-2 text-olive-300" />
//                 <p className="text-sm font-semibold text-olive-700">
//                   No notifications yet
//                 </p>
//               </div>
//             )}

//             {/* ── List ──────────────────────────────────────── */}
//             {!isLoading && !error && notifications.length > 0 && (
//               <div className="space-y-3">
//                 {notifications.map((n) => (
//                   <button
//                     key={n.id}
//                     type="button"
//                     onClick={() => !n.isRead && markRead(n.id)}
//                     className={`w-full rounded-xl p-4 text-left transition-colors ${
//                       !n.isRead
//                         ? "bg-green-50 hover:bg-green-100"
//                         : "bg-cream-100 hover:bg-cream-200"
//                     }`}
//                   >
//                     <p
//                       className={`text-sm ${
//                         !n.isRead
//                           ? "font-bold text-olive-900"
//                           : "font-medium text-olive-800"
//                       }`}
//                     >
//                       {n.title}
//                     </p>
//                     <p className="mt-1 text-sm text-gray-400">{n.body}</p>
//                   </button>
//                 ))}
//               </div>
//             )}

//             {/* ── Footer actions ────────────────────────────── */}
//             <div className="mt-5 flex items-center justify-between border-t border-cream-200 pt-4">
//               <Link
//                 href="/dashboard/notifications"
//                 onClick={closeNotificationModal}
//                 className="text-xs font-semibold text-olive-600 hover:text-olive-800"
//               >
//                 View all
//               </Link>

//               {unreadCount > 0 && (
//                 <button
//                   type="button"
//                   onClick={() => void markAllRead()}
//                   className="flex items-center gap-1.5 text-xs font-semibold text-olive-600 hover:text-olive-800"
//                 >
//                   <CheckCheck size={13} />
//                   Mark all read
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  X,
  CheckCheck,
  BellOff,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { useNotifications } from "@/lib/hooks/useNotifications";

interface DesktopHeaderProps {
  /** Page title displayed on the left */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
}

export default function DesktopHeader({ title, subtitle }: DesktopHeaderProps) {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
  } = useNotifications({ limit: 5 });

  const openNotificationModal = () => setIsNotificationModalOpen(true);
  const closeNotificationModal = () => setIsNotificationModalOpen(false);

  return (
    <>
      <header
        className="hidden lg:flex items-center justify-between
                   bg-white/80 backdrop-blur-md border-b border-cream-300
                   px-6 py-4 shrink-0 sticky top-0 z-10"
      >
        {/* ── Left: Page Title ───────────────────────────────── */}
        <div className="flex items-center gap-4 min-w-0">
          <div>
            <h1 className="text-xl font-bold text-olive-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* ── Right: Search + Bell + Avatar ──────────────────── */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div
            className="flex items-center gap-2 bg-cream-100 border border-cream-300
                       rounded-xl px-3.5 py-2.5 w-56
                       focus-within:border-olive-400 focus-within:ring-2
                       focus-within:ring-olive-100 transition-all"
          >
            <Search
              size={15}
              className="text-gray-400 shrink-0"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search..."
              className="bg-transparent text-sm text-gray-600 outline-none
                         placeholder:text-gray-400 w-full"
              aria-label="Search"
            />
          </div>

          {/* Notification Bell + Dropdown wrapper (relative anchor) */}
          <div className="relative">
            <button
              type="button"
              onClick={openNotificationModal}
              className="relative p-2.5 text-gray-500 hover:text-olive-600
                         hover:bg-olive-50 rounded-xl transition-colors"
              aria-label="View notifications"
              aria-haspopup="dialog"
              aria-expanded={isNotificationModalOpen}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 bg-red-500
                             rounded-full ring-2 ring-white"
                  aria-hidden="true"
                />
              )}
            </button>

            {/* ── Notifications Dropdown ─────────────────────── */}
            {isNotificationModalOpen && (
              <>
                {/* invisible click-outside backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={closeNotificationModal}
                  aria-hidden="true"
                />

                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="notifications-modal-title"
                  className="absolute right-0 top-full z-50 mt-3 w-96
                             rounded-2xl border border-cream-300 bg-white
                             shadow-xl overflow-hidden"
                >
                  {/* pointer/caret */}
                  <div
                    className="absolute -top-1.5 right-5 h-3 w-3 rotate-45
                               border-l border-t border-cream-300 bg-white"
                    aria-hidden="true"
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-cream-200 px-5 py-4">
                    <div>
                      <h2
                        id="notifications-modal-title"
                        className="text-sm font-bold text-olive-900"
                      >
                        Notifications
                      </h2>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "You're all caught up"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeNotificationModal}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-cream-100 hover:text-olive-900"
                      aria-label="Close notifications"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="max-h-96 overflow-y-auto px-3 py-3">
                    {/* Loading */}
                    {isLoading && (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-16 rounded-xl bg-cream-100 animate-pulse"
                          />
                        ))}
                      </div>
                    )}

                    {/* Error */}
                    {!isLoading && error && (
                      <div className="rounded-xl bg-cream-100 py-8 text-center">
                        <AlertTriangle
                          size={24}
                          className="mx-auto mb-2 text-red-400"
                        />
                        <p className="text-xs font-semibold text-red-600">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && notifications.length === 0 && (
                      <div className="rounded-xl bg-cream-100 py-10 text-center">
                        <BellOff
                          size={22}
                          className="mx-auto mb-2 text-olive-300"
                        />
                        <p className="text-xs font-semibold text-olive-700">
                          No notifications yet
                        </p>
                      </div>
                    )}

                    {/* List */}
                    {!isLoading && !error && notifications.length > 0 && (
                      <div className="space-y-1.5">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`rounded-xl px-3 py-2.5 transition-colors ${
                              !n.isRead ? "bg-green-50" : "hover:bg-cream-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => !n.isRead && markRead(n.id)}
                              className="w-full text-left"
                            >
                              <p
                                className={`text-xs leading-snug ${
                                  !n.isRead
                                    ? "font-bold text-olive-900"
                                    : "font-medium text-olive-800"
                                }`}
                              >
                                {n.title}
                              </p>
                              <p className="mt-0.5 text-xs leading-snug text-gray-400">
                                {n.body}
                              </p>
                            </button>

                            {n.orderId && (
                              <Link
                                href={`/dashboard/orders/${n.orderId}`}
                                onClick={closeNotificationModal}
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-olive-600 hover:text-olive-800"
                              >
                                View product
                                <ArrowUpRight size={12} />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-cream-200 px-5 py-3">
                    <Link
                      href="/dashboard/notifications"
                      onClick={closeNotificationModal}
                      className="text-xs font-semibold text-olive-600 hover:text-olive-800"
                    >
                      View all
                    </Link>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void markAllRead()}
                        className="flex items-center gap-1.5 text-xs font-semibold text-olive-600 hover:text-olive-800"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Avatar */}
          <Avatar
            initials="JD"
            size="md"
            className="cursor-pointer hover:ring-2 hover:ring-olive-300
                       transition-all"
          />
        </div>
      </header>
    </>
  );
}
