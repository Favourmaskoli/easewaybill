// // "use client";

// // import { useEffect, useState } from "react";
// // import { usePathname, useRouter } from "next/navigation";
// // import { useAuth } from "@/lib/hooks/useAuth";

// // import Sidebar from "@/components/layout/Sidebar";
// // import DesktopHeader from "@/components/layout/DesktopHeader";
// // import MobileBottomNav from "@/components/layout/MobileBottomNav";

// // import { pageTitles } from "@/lib/navigation";

// // export default function RiderLayout({
// //   children,
// // }: {
// //   children: React.ReactNode;
// // }) {
// //   const { user, isLoading } = useAuth();
// //   const router = useRouter();
// //   const pathname = usePathname();

// //   const [sidebarOpen, setSidebarOpen] = useState(false);

// //   useEffect(() => {
// //     if (!isLoading && (!user || user.role !== "RIDER")) {
// //       router.replace("/dashboard");
// //     }
// //   }, [user, isLoading, router]);

// //   if (isLoading || !user || user.role !== "RIDER") {
// //     return (
// //       <div
// //         style={{
// //           display: "flex",
// //           alignItems: "center",
// //           justifyContent: "center",
// //           minHeight: "100vh",
// //           background: "#f3f4f6",
// //         }}
// //       >
// //         <div style={{ textAlign: "center" }}>
// //           <div
// //             style={{
// //               width: "40px",
// //               height: "40px",
// //               border: "4px solid #f59e0b",
// //               borderTopColor: "transparent",
// //               borderRadius: "50%",
// //               animation: "spin 1s linear infinite",
// //               margin: "0 auto 12px",
// //             }}
// //           />
// //           <p style={{ color: "#6b7280", fontSize: "13px" }}>
// //             Verifying rider access...
// //           </p>
// //         </div>
// //         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
// //       </div>
// //     );
// //   }

// //   const currentPage = pageTitles[pathname] || {
// //     title: "Rider Dashboard",
// //     subtitle: "Your assigned deliveries",
// //   };

// //   return (
// //     <div className="flex h-screen bg-cream-200 overflow-hidden">
// //       <Sidebar
// //         isOpen={sidebarOpen}
// //         onClose={() => setSidebarOpen(false)}
// //         pathname={pathname}
// //       />

// //       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
// //         <DesktopHeader
// //           title={currentPage.title}
// //           subtitle={currentPage.subtitle}
// //         />

// //         <main
// //           className="flex-1 overflow-y-auto scrollbar-hide pb-24 lg:pb-6"
// //           id="main-content"
// //         >
// //           {children}
// //         </main>

// //         <MobileBottomNav pathname={pathname} />
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { useEffect, useState } from "react";
// import { usePathname, useRouter } from "next/navigation";
// import { Menu } from "lucide-react";
// import { useAuth } from "@/lib/hooks/useAuth";

// import Sidebar from "@/components/layout/Sidebar";
// import DesktopHeader from "@/components/layout/DesktopHeader";
// import MobileBottomNav from "@/components/layout/MobileBottomNav";

// import { pageTitles } from "@/lib/navigation";

// export default function RiderLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { user, isLoading, hasHydrated } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();

//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   useEffect(() => {
//     if (!isLoading && (!user || user.role !== "RIDER")) {
//       router.replace("/dashboard");
//     }
//   }, [user, isLoading, router]);

//   if (isLoading || !user || user.role !== "RIDER") {
//     return (
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           minHeight: "100vh",
//           background: "#f3f4f6",
//         }}
//       >
//         <div style={{ textAlign: "center" }}>
//           <div
//             style={{
//               width: "40px",
//               height: "40px",
//               border: "4px solid #f59e0b",
//               borderTopColor: "transparent",
//               borderRadius: "50%",
//               animation: "spin 1s linear infinite",
//               margin: "0 auto 12px",
//             }}
//           />
//           <p style={{ color: "#6b7280", fontSize: "13px" }}>
//             Verifying rider access...
//           </p>
//         </div>
//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     );
//   }

//   const currentPage = pageTitles[pathname] || {
//     title: "Rider Dashboard",
//     subtitle: "Your assigned deliveries",
//   };

//   return (
//     <div className="flex h-screen bg-cream-200 overflow-hidden">
//       <Sidebar
//         isOpen={sidebarOpen}
//         onClose={() => setSidebarOpen(false)}
//         pathname={pathname}
//       />

//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         {/* Mobile-only header with hamburger to open the Sidebar drawer */}
//         <header
//           className="lg:hidden flex items-center justify-between px-4 py-3
//                      bg-white/80 backdrop-blur-md border-b border-cream-300
//                      shrink-0 sticky top-0 z-10"
//         >
//           <button
//             type="button"
//             onClick={() => setSidebarOpen(true)}
//             aria-label="Open navigation"
//             className="p-2 -ml-2 text-olive-700 hover:bg-olive-50 rounded-xl transition-colors"
//           >
//             <Menu size={22} />
//           </button>

//           <div className="text-center">
//             <h1 className="text-base font-bold text-olive-900 leading-tight">
//               {currentPage.title}
//             </h1>
//           </div>

//           {/* Spacer to balance the hamburger button and keep title centered */}
//           <div className="w-9" aria-hidden="true" />
//         </header>

//         <DesktopHeader
//           title={currentPage.title}
//           subtitle={currentPage.subtitle}
//         />

//         <main
//           className="flex-1 overflow-y-auto scrollbar-hide pb-24 lg:pb-6"
//           id="main-content"
//         >
//           {children}
//         </main>

//         <MobileBottomNav pathname={pathname} />
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

import Sidebar from "@/components/layout/Sidebar";
import DesktopHeader from "@/components/layout/DesktopHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { pageTitles } from "@/lib/navigation";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, hasHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isLoading && (!user || user.role !== "RIDER")) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, hasHydrated, router]);

  if (!hasHydrated || isLoading || !user || user.role !== "RIDER") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#f3f4f6",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f59e0b",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: "13px" }}>
            Verifying rider access...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentPage = pageTitles[pathname] || {
    title: "Rider Dashboard",
    subtitle: "Your assigned deliveries",
  };

  return (
    <div className="flex h-screen bg-cream-200 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pathname={pathname}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile-only header with hamburger to open the Sidebar drawer */}
        <header
          className="lg:hidden flex items-center justify-between px-4 py-3
                     bg-white/80 backdrop-blur-md border-b border-cream-300
                     shrink-0 sticky top-0 z-10"
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="p-2 -ml-2 text-olive-700 hover:bg-olive-50 rounded-xl transition-colors"
          >
            <Menu size={22} />
          </button>

          <div className="text-center">
            <h1 className="text-base font-bold text-olive-900 leading-tight">
              {currentPage.title}
            </h1>
          </div>

          {/* Spacer to balance the hamburger button and keep title centered */}
          <div className="w-9" aria-hidden="true" />
        </header>

        <DesktopHeader
          title={currentPage.title}
          subtitle={currentPage.subtitle}
        />

        <main
          className="flex-1 overflow-y-auto scrollbar-hide pb-24 lg:pb-6"
          id="main-content"
        >
          {children}
        </main>

        <MobileBottomNav pathname={pathname} />
      </div>
    </div>
  );
}
