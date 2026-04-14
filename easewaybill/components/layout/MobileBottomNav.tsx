// // components/layout/MobileBottomNav.tsx
// // ================================================================
// // MOBILE BOTTOM NAVIGATION BAR
// // ================================================================
// // Fixed to the bottom of the viewport on mobile (<lg).
// // Hidden on desktop.
// //
// // Layout: Home · Orders · (+Create) · Transactions · Profile
// //
// // The center "Create" button is elevated with a large olive circle,
// // matching the design in the attached mobile mockups.
// //
// // Props:
// //   pathname — current route path for active highlighting
// // ================================================================

// "use client";

// import React from "react";
// import Link from "next/link";
// import { Plus } from "lucide-react";

// // ── Data imports ──────────────────────────────────────────────
// import { mobileNavItems, isRouteActive } from "@/lib/navigation";

// interface MobileBottomNavProps {
//   /** Current route pathname (from usePathname) */
//   pathname: string;
// }

// export default function MobileBottomNav({ pathname }: MobileBottomNavProps) {
//   return (
//     <nav
//       className="lg:hidden fixed bottom-0 left-0 right-0 z-40
//                  bg-white border-t border-cream-300
//                  shadow-bottom-nav safe-bottom"
//       aria-label="Mobile navigation"
//     >
//       <div className="flex items-center justify-around px-2 py-1">
//         {mobileNavItems.map((item) => {
//           const active = isRouteActive(item.href, pathname);

//           // ── Center "Create" Button — Special Styling ────────
//           if (item.isCenter) {
//             return (
//               <Link
//                 key={item.label}
//                 href={item.href}
//                 className="flex flex-col items-center justify-center -mt-5"
//                 aria-label={item.label}
//               >
//                 {/* Elevated olive circle */}
//                 <div
//                   className="w-14 h-14 bg-olive-600 hover:bg-olive-700
//                              active:bg-olive-800 rounded-full
//                              flex items-center justify-center
//                              shadow-olive-lg transition-all active:scale-95"
//                 >
//                   <Plus size={26} className="text-white" />
//                 </div>

//                 {/* Label below */}
//                 <span className="text-[10px] font-medium text-olive-600 mt-1">
//                   {item.label}
//                 </span>
//               </Link>
//             );
//           }

//           // ── Regular Nav Item ────────────────────────────────
//           return (
//             <Link
//               key={item.label}
//               href={item.href}
//               className={[
//                 "flex flex-col items-center justify-center",
//                 "py-2 px-3 min-w-[56px] rounded-xl",
//                 "transition-colors duration-150",
//                 active
//                   ? "text-olive-600"
//                   : "text-gray-400 hover:text-olive-500",
//               ].join(" ")}
//               aria-current={active ? "page" : undefined}
//             >
//               {/* Icon — heavier stroke when active */}
//               <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />

//               {/* Label text */}
//               <span
//                 className={`text-[10px] mt-1 ${
//                   active ? "font-semibold" : "font-medium"
//                 }`}
//               >
//                 {item.label}
//               </span>

//               {/* Active dot indicator */}
//               {active && (
//                 <span
//                   className="w-1 h-1 bg-olive-600 rounded-full mt-0.5"
//                   aria-hidden="true"
//                 />
//               )}
//             </Link>
//           );
//         })}
//       </div>
//     </nav>
//   );
// }


// components/layout/MobileBottomNav.tsx
// ================================================================
// MOBILE BOTTOM NAV — deep olive clay bar
// ================================================================

"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { mobileNavItems, isRouteActive } from "@/lib/navigation";

interface MobileBottomNavProps {
  pathname: string;
}

export default function MobileBottomNav({
  pathname,
}: MobileBottomNavProps) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40
                 safe-bottom border-t border-olive-700/30"
      style={{
        background:
          "linear-gradient(180deg, var(--color-olive-900) 0%, var(--color-olive-950) 100%)",
        boxShadow: "var(--shadow-bottom-nav)",
      }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {mobileNavItems.map((item) => {
          const active = isRouteActive(item.href, pathname);

          /* ── Center Create Button ───────────────────────── */
          if (item.isCenter) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center
                           justify-center -mt-5"
                aria-label={item.label}
              >
                {/* Raised olive circle button */}
                <div
                  className="w-14 h-14 rounded-full flex items-center
                             justify-center transition-all active:scale-95"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                    boxShadow:
                      "6px 6px 16px rgba(23,29,9,0.40), -3px -3px 10px rgba(114,143,50,0.25), inset 0 1px 2px rgba(255,255,255,0.15)",
                  }}
                >
                  <Plus size={26} className="text-white" />
                </div>
                <span className="text-[10px] font-semibold text-olive-300 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          /* ── Regular Nav Item ───────────────────────────── */
          return (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "flex flex-col items-center justify-center",
                "py-2 px-3 min-w-[56px] rounded-xl",
                "transition-all duration-150",
                active
                  ? "text-olive-200"
                  : "text-olive-500 hover:text-olive-300",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] mt-1 ${
                  active ? "font-semibold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
              {active && (
                <span
                  className="w-1 h-1 bg-olive-300 rounded-full mt-0.5"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}