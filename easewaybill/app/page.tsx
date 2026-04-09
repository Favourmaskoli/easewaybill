// app/page.tsx (or app/(landing)/page.tsx)
// Landing Page for EaseWaybill — Green/Gray/Blue Theme

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Truck,
  MapPin,
  MessageSquare,
  Scale, // ← replaces Gavel (removed in newer lucide-react)
  ShoppingCart,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ====== NAVBAR ====== */}
      <Navbar />

      {/* ====== MAIN CONTENT ====== */}
      <main className="flex-1">
        {/* ================================================
            SECTION 1: HERO
        ================================================ */}
        <section className="bg-gradient-to-br from-green-50 via-white to-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Hero Text */}
              <div className="flex-1 text-center lg:text-left">
                {/* Badge */}
                <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                  🔒 Trusted Escrow Platform
                </span>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                  Secure Delivery{" "}
                  <span className="text-green-600">Payments</span> with Escrow
                </h1>

                {/* Subtext */}
                <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto lg:mx-0">
                  Pay safely. Get your goods. Release funds only when satisfied.
                  EaseWaybill keeps your money safe until delivery is confirmed.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/sign-up" className="btn-primary text-center">
                    Get Started →
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="btn-outline text-center"
                  >
                    Learn More
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start">
                  {[
                    "✅ 100% Secure",
                    "⚡ Fast Payouts",
                    "🛡️ Dispute Protection",
                  ].map((badge) => (
                    <span
                      key={badge}
                      className="text-sm text-gray-500 font-medium"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hero Illustration */}
              <div className="flex-1 flex justify-center">
                <div className="relative w-80 h-80 bg-gradient-to-br from-green-500 to-green-300 rounded-full flex items-center justify-center shadow-2xl">
                  <div className="text-white text-center">
                    <Truck size={80} strokeWidth={1.5} />
                    <p className="font-bold text-xl mt-2">Safe Delivery</p>
                    <p className="text-green-100 text-sm">Escrow Protected</p>
                  </div>

                  {/* Floating badge 1 */}
                  <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-2">
                    <ShieldCheck className="text-green-500" size={20} />
                    <span className="text-xs font-semibold text-gray-700">
                      Payment Secured
                    </span>
                  </div>

                  {/* Floating badge 2 */}
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-xs font-semibold text-gray-700">
                      Order Confirmed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================
            SECTION 2: HOW IT WORKS
        ================================================ */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Simple 3-step process to secure your transactions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="card text-center group hover:-translate-y-1 transition-transform">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <ShoppingCart size={32} />
                </div>
                <div className="text-green-600 font-bold text-sm mb-2">
                  STEP 1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Buyer Pays → Escrow
                </h3>
                <p className="text-gray-500 text-sm">
                  Securely deposit funds into a neutral escrow account. Your
                  money is protected until you confirm delivery.
                </p>
              </div>

              {/* Step 2 */}
              <div className="card text-center group hover:-translate-y-1 transition-transform">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Truck size={32} />
                </div>
                <div className="text-blue-500 font-bold text-sm mb-2">
                  STEP 2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Seller Ships Goods
                </h3>
                <p className="text-gray-500 text-sm">
                  Goods are dispatched to the buyer with real-time tracking.
                  Track your shipment every step of the way.
                </p>
              </div>

              {/* Step 3 */}
              <div className="card text-center group hover:-translate-y-1 transition-transform">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <CheckCircle size={32} />
                </div>
                <div className="text-green-600 font-bold text-sm mb-2">
                  STEP 3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Buyer Confirms → Seller Gets Paid
                </h3>
                <p className="text-gray-500 text-sm">
                  Inspect received items and release funds to the seller.
                  Everyone wins!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================
            SECTION 3: FEATURES
        ================================================ */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Our Features
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Everything you need to trade safely and confidently
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="card text-center group hover:-translate-y-1 transition-transform">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Secure Escrow System
                </h3>
                <p className="text-gray-500 text-sm">
                  Payments held safely until buyer satisfaction confirmed
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card text-center group hover:-translate-y-1 transition-transform">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <MapPin size={28} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Real-Time Tracking
                </h3>
                <p className="text-gray-500 text-sm">
                  Follow your shipment's journey from dispatch to doorstep
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card text-center group hover:-translate-y-1 transition-transform">
                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Scale size={28} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Dispute Resolution
                </h3>
                <p className="text-gray-500 text-sm">
                  Fair mediation for issue settlement. Communicate easily
                </p>
              </div>

              {/* Feature 4 */}
              <div className="card text-center group hover:-translate-y-1 transition-transform">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <MessageSquare size={28} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Chat Between Parties
                </h3>
                <p className="text-gray-500 text-sm">
                  Direct communication between buyer and seller in-platform
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================
            SECTION 4: CALL TO ACTION
        ================================================ */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-500">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start using secure payments today
            </h2>
            <p className="text-green-100 text-lg mb-8">
              Join thousands of buyers and sellers trading safely with
              EaseWaybill
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Create Account <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <Footer />
    </div>
  );
}
