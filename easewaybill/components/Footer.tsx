// // components/Footer.tsx
// // Footer component used on the Landing Page
// // Contains links, copyright info

// import Link from "next/link";
// import { Package } from "lucide-react";

// export default function Footer() {
//   return (
//     <footer className="bg-blue-900 text-white py-10">
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

//         {/* ====== FOOTER TOP ====== */}
//         <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">

//           {/* Logo */}
//           <Link href="/" className="flex items-center gap-2">
//             <div className="bg-white text-blue-600 p-1.5 rounded-lg">
//               <Package size={20} />
//             </div>
//             <span className="text-xl font-bold text-white">
//               ease<span className="text-blue-300">waybill</span>
//             </span>
//           </Link>

//           {/* Footer Links */}
//           <div className="flex items-center gap-6 text-sm text-blue-200">
//             <Link href="#" className="hover:text-white transition-colors">
//               About
//             </Link>
//             <Link href="#" className="hover:text-white transition-colors">
//               FAQ
//             </Link>
//             <Link href="#" className="hover:text-white transition-colors">
//               Contact
//             </Link>
//             <Link href="#" className="hover:text-white transition-colors">
//               Privacy Policy
//             </Link>
//             <Link href="#" className="hover:text-white transition-colors">
//               Terms of Service
//             </Link>
//           </div>
//         </div>

//         {/* ====== FOOTER BOTTOM ====== */}
//         <div className="border-t border-blue-800 pt-6 text-center text-sm text-blue-300">
//           © {new Date().getFullYear()} EaseWaybill Inc. All rights reserved.
//         </div>
//       </div>
//     </footer>
//   );
// }

// components/Footer.tsx
// Footer component used on the Landing Page
// Contains links, copyright info

import Link from "next/link";
import { Package } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ====== FOOTER TOP ====== */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-white text-green-600 p-1.5 rounded-lg">
              <Package size={20} />
            </div>
            <span className="text-xl font-bold text-white">
              ease<span className="text-green-300">waybill</span>
            </span>
          </Link>

          {/* Footer Links */}
          <div className="flex items-center gap-6 text-sm text-green-200">
            <Link href="#" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        {/* ====== FOOTER BOTTOM ====== */}
        <div className="border-t border-green-800 pt-6 text-center text-sm text-green-300">
          © {new Date().getFullYear()} EaseWaybill Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
