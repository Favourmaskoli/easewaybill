// // components/Navbar.tsx
// // Navigation bar component used on the Landing Page
// // Contains logo, nav links, and auth buttons

// "use client"; // Client component for mobile menu toggle

// import { useState } from "react";
// import Link from "next/link";
// import { Menu, X, Package } from "lucide-react"; // Icons

// export default function Navbar() {
//   // State to control mobile menu open/close
//   const [menuOpen, setMenuOpen] = useState(false);

//   return (
//     <nav className="bg-white shadow-sm sticky top-0 z-50">
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-between h-16">

//           {/* ====== LOGO ====== */}
//           <Link href="/" className="flex items-center gap-2">
//             {/* Logo Icon */}
//             <div className="bg-blue-600 text-white p-1.5 rounded-lg">
//               <Package size={20} />
//             </div>
//             {/* Logo Text */}
//             <span className="text-xl font-bold text-blue-900">
//               ease<span className="text-blue-500">waybill</span>
//             </span>
//           </Link>

//           {/* ====== DESKTOP NAV LINKS ====== */}
//           <div className="hidden md:flex items-center gap-8">
//             <Link
//               href="#features"
//               className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
//             >
//               Features
//             </Link>
//             <Link
//               href="#how-it-works"
//               className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
//             >
//               How it Works
//             </Link>
//           </div>

//           {/* ====== AUTH BUTTONS (Desktop) ====== */}
//           <div className="hidden md:flex items-center gap-3">
//             <Link href="/sign-in" className="btn-outline text-sm px-5 py-2">
//               Sign In
//             </Link>
//             <Link href="/sign-up" className="btn-primary text-sm px-5 py-2">
//               Get Started
//             </Link>
//           </div>

//           {/* ====== MOBILE MENU TOGGLE ====== */}
//           <button
//             className="md:hidden text-gray-600 hover:text-blue-600"
//             onClick={() => setMenuOpen(!menuOpen)} // Toggle menu
//             aria-label="Toggle Menu"
//           >
//             {menuOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </div>

//       {/* ====== MOBILE DROPDOWN MENU ====== */}
//       {menuOpen && (
//         <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 space-y-3">
//           <Link
//             href="#features"
//             className="block py-2 text-gray-600 hover:text-blue-600 font-medium"
//             onClick={() => setMenuOpen(false)}
//           >
//             Features
//           </Link>
//           <Link
//             href="#how-it-works"
//             className="block py-2 text-gray-600 hover:text-blue-600 font-medium"
//             onClick={() => setMenuOpen(false)}
//           >
//             How it Works
//           </Link>
//           <Link
//             href="/sign-in"
//             className="block btn-outline text-center text-sm"
//           >
//             Sign In
//           </Link>
//           <Link
//             href="/sign-up"
//             className="block btn-primary text-center text-sm"
//           >
//             Get Started
//           </Link>
//         </div>
//       )}
//     </nav>
//   );
// }

// components/Navbar.tsx
// Navigation bar component used on the Landing Page
// Contains logo, nav links, and auth buttons

"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Package } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ====== LOGO ====== */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
              <Package size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900">
              ease<span className="text-green-500">waybill</span>
            </span>
          </Link>

          {/* ====== DESKTOP NAV LINKS ====== */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-gray-600 hover:text-green-600 font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-gray-600 hover:text-green-600 font-medium transition-colors"
            >
              How it Works
            </Link>
          </div>

          {/* ====== AUTH BUTTONS (Desktop) ====== */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in" className="btn-outline text-sm px-5 py-2">
              Sign In
            </Link>
            <Link href="/sign-up" className="btn-primary text-sm px-5 py-2">
              Get Started
            </Link>
          </div>

          {/* ====== MOBILE MENU TOGGLE ====== */}
          <button
            className="md:hidden text-gray-600 hover:text-green-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ====== MOBILE DROPDOWN MENU ====== */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 space-y-3">
          <Link
            href="#features"
            className="block py-2 text-gray-600 hover:text-green-600 font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="block py-2 text-gray-600 hover:text-green-600 font-medium"
            onClick={() => setMenuOpen(false)}
          >
            How it Works
          </Link>
          <Link
            href="/sign-in"
            className="block btn-outline text-center text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="block btn-primary text-center text-sm"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
