// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import {
//   Package,
//   Mail,
//   ArrowRight,
//   ArrowLeft,
//   CheckCircle2,
// } from "lucide-react";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);
//     try {
//       const res = await fetch("/api/auth/forgot-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: email.trim().toLowerCase() }),
//       });
//       if (!res.ok) throw new Error("Something went wrong. Please try again.");
//       // Always show success, regardless of backend result — avoids leaking
//       // whether the email is registered.
//       setSubmitted(true);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
//         <Link href="/" className="flex items-center gap-2 mb-8">
//           <div className="bg-green-600 text-white p-1.5 rounded-lg">
//             <Package size={20} />
//           </div>
//           <span className="text-xl font-bold text-gray-900">
//             ease<span className="text-green-500">waybill</span>
//           </span>
//         </Link>

//         {submitted ? (
//           <div className="text-center py-4">
//             <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
//               <CheckCircle2 className="text-green-600" size={28} />
//             </div>
//             <h1 className="text-2xl font-bold text-gray-900 mb-2">
//               Check your email
//             </h1>
//             <p className="text-gray-500 mb-6">
//               If an account exists for <strong>{email}</strong>, we&apos;ve sent
//               a link to reset your password. It expires in 30 minutes.
//             </p>
//             <Link
//               href="/sign-in"
//               className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline"
//             >
//               <ArrowLeft size={16} /> Back to sign in
//             </Link>
//           </div>
//         ) : (
//           <>
//             <h1 className="text-2xl font-bold text-gray-900 mb-2">
//               Forgot your password?
//             </h1>
//             <p className="text-gray-500 mb-6">
//               Enter the email associated with your account and we&apos;ll send
//               you a link to reset it.
//             </p>

//             <form onSubmit={handleSubmit} className="space-y-5" noValidate>
//               <div>
//                 <label
//                   htmlFor="email"
//                   className="block text-sm font-medium text-gray-700 mb-1.5"
//                 >
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <Mail
//                     size={18}
//                     className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
//                     aria-hidden="true"
//                   />
//                   <input
//                     id="email"
//                     type="email"
//                     name="email"
//                     autoComplete="email"
//                     placeholder="john@example.com"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                     disabled={loading}
//                     className="input-field pl-10 disabled:opacity-60 disabled:cursor-not-allowed"
//                   />
//                 </div>
//               </div>

//               {error && (
//                 <div
//                   role="alert"
//                   aria-live="assertive"
//                   className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3"
//                 >
//                   {error}
//                 </div>
//               )}

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
//               >
//                 {loading ? (
//                   <>
//                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     Sending...
//                   </>
//                 ) : (
//                   <>
//                     Send Reset Link <ArrowRight size={18} />
//                   </>
//                 )}
//               </button>

//               <p className="text-center text-sm">
//                 <Link
//                   href="/sign-in"
//                   className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline"
//                 >
//                   <ArrowLeft size={16} /> Back to sign in
//                 </Link>
//               </p>
//             </form>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { authApi } from "@/lib/api/auth.api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword({
        email: email.trim().toLowerCase(),
      });

      // Always show success, regardless of backend result.
      // This avoids leaking whether the email is registered.
      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="bg-green-600 text-white p-1.5 rounded-lg">
            <Package size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900">
            ease<span className="text-green-500">waybill</span>
          </span>
        </Link>

        {submitted ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={28} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Check your email
            </h1>

            <p className="text-gray-500 mb-6">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent
              a link to reset your password. It expires in 30 minutes.
            </p>

            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline"
            >
              <ArrowLeft size={16} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Forgot your password?
            </h1>

            <p className="text-gray-500 mb-6">
              Enter the email associated with your account and we&apos;ll send
              you a link to reset it.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />

                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="input-field pl-10 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="text-center text-sm">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline"
                >
                  <ArrowLeft size={16} /> Back to sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
