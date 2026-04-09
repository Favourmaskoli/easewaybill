// // app/(auth)/sign-in/page.tsx
// // Sign In Page for EaseWaybill
// // Split layout: Left (brand visual) + Right (form)

// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { Package, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

// // ============================================================
// // SIGN IN PAGE COMPONENT
// // ============================================================
// export default function SignInPage() {
//   // ---- Form State ----
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     rememberMe: false,
//   });

//   // ---- Password visibility ----
//   const [showPassword, setShowPassword] = useState(false);

//   // ---- Loading state ----
//   const [loading, setLoading] = useState(false);

//   // Handle input changes
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     setFormData({
//       ...formData,
//       [name]: type === "checkbox" ? checked : value,
//     });
//   };

//   // Handle form submission (mock for now)
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     // TODO: Connect to NestJS Auth API
//     console.log("Sign In Data:", formData);
//     setTimeout(() => setLoading(false), 2000);
//   };

//   return (
//     <div className="min-h-screen flex">
//       {/* ====== LEFT SIDE - Brand Panel ====== */}
//       <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-500 via-blue-500 to-blue-700 flex-col justify-between p-12 relative overflow-hidden">
//         {/* Decorative background shapes */}
//         <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36" />
//         <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full translate-y-40 -translate-x-40" />

//         {/* Logo */}
//         <Link href="/" className="flex items-center gap-2 relative z-10">
//           <div className="bg-white text-blue-600 p-2 rounded-xl">
//             <Package size={24} />
//           </div>
//           <span className="text-2xl font-bold text-white">
//             ease<span className="text-blue-200">waybill</span>
//           </span>
//         </Link>

//         {/* Center Illustration */}
//         <div className="relative z-10 text-white">
//           {/* Animated icon card */}
//           <div className="w-32 h-32 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
//             {/* Exchange arrows SVG */}
//             <svg
//               width="64"
//               height="64"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="white"
//               strokeWidth="1.5"
//             >
//               <path d="M7 16V4m0 0L3 8m4-4l4 4" />
//               <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
//               <circle cx="7" cy="4" r="0" />
//             </svg>
//           </div>

//           <h2 className="text-4xl font-bold mb-4 leading-tight">
//             Welcome <br /> Back! 👋
//           </h2>
//           <p className="text-blue-100 text-lg leading-relaxed">
//             Sign in to manage your orders, track shipments, and handle escrow
//             payments securely.
//           </p>

//           {/* Feature bullets */}
//           <div className="mt-8 space-y-3">
//             {[
//               "✅ View all your active orders",
//               "✅ Track real-time delivery",
//               "✅ Manage escrow payments",
//             ].map((item) => (
//               <p key={item} className="text-blue-100 text-sm">
//                 {item}
//               </p>
//             ))}
//           </div>
//         </div>

//         <p className="text-blue-200 text-sm relative z-10">
//           © {new Date().getFullYear()} EaseWaybill Inc.
//         </p>
//       </div>

//       {/* ====== RIGHT SIDE - Sign In Form ====== */}
//       <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
//         <div className="w-full max-w-md">
//           {/* Mobile Logo */}
//           <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
//             <div className="bg-blue-600 text-white p-1.5 rounded-lg">
//               <Package size={20} />
//             </div>
//             <span className="text-xl font-bold text-blue-900">
//               ease<span className="text-blue-500">waybill</span>
//             </span>
//           </Link>

//           {/* Form Header */}
//           <div className="mb-8">
//             <h1 className="text-3xl font-bold text-blue-900 mb-2">Sign In</h1>
//             <p className="text-gray-500">Welcome back! Please sign in.</p>
//           </div>

//           {/* ====== SIGN IN FORM ====== */}
//           <form onSubmit={handleSubmit} className="space-y-5">
//             {/* Email */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <Mail
//                   size={18}
//                   className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
//                 />
//                 <input
//                   type="email"
//                   name="email"
//                   placeholder="john@example.com"
//                   value={formData.email}
//                   onChange={handleChange}
//                   required
//                   className="input-field pl-10"
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                 Password
//               </label>
//               <div className="relative">
//                 <Lock
//                   size={18}
//                   className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
//                 />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   placeholder="Enter your password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   required
//                   className="input-field pl-10 pr-10"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>
//             </div>

//             {/* Remember me + Forgot password */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   name="rememberMe"
//                   checked={formData.rememberMe}
//                   onChange={handleChange}
//                   className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="text-sm text-gray-600">Remember me</span>
//               </label>
//               <Link
//                 href="#"
//                 className="text-sm text-blue-600 hover:underline font-medium"
//               >
//                 Forgot password?
//               </Link>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
//             >
//               {loading ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   Signing In...
//                 </>
//               ) : (
//                 <>
//                   Sign In <ArrowRight size={18} />
//                 </>
//               )}
//             </button>

//             {/* Sign up link */}
//             <p className="text-center text-sm text-gray-500">
//               Don&apos;t have an account?{" "}
//               <Link
//                 href="/sign-up"
//                 className="text-blue-600 font-semibold hover:underline"
//               >
//                 Sign up
//               </Link>
//             </p>

//             {/* Divider */}
//             <div className="flex items-center gap-3">
//               <div className="flex-1 h-px bg-gray-200" />
//               <span className="text-sm text-gray-400">or</span>
//               <div className="flex-1 h-px bg-gray-200" />
//             </div>

//             {/* Google Sign In */}
//             <button
//               type="button"
//               className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700"
//             >
//               <svg width="20" height="20" viewBox="0 0 24 24">
//                 <path
//                   fill="#4285F4"
//                   d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                 />
//                 <path
//                   fill="#34A853"
//                   d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                 />
//                 <path
//                   fill="#FBBC05"
//                   d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                 />
//                 <path
//                   fill="#EA4335"
//                   d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                 />
//               </svg>
//               Sign in with Google
//             </button>

//             {/* Facebook Sign In */}
//             <button
//               type="button"
//               className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700"
//             >
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
//                 <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
//               </svg>
//               Sign in with Facebook
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// app/(auth)/sign-in/page.tsx
// Sign In Page for EaseWaybill — Green/Gray/Blue Theme
// Split layout: Left (brand visual) + Right (form)

"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to NestJS Auth API
    console.log("Sign In Data:", formData);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* ====== LEFT SIDE - Brand Panel ====== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-500 via-green-600 to-green-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full translate-y-40 -translate-x-40" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="bg-white text-green-600 p-2 rounded-xl">
            <Package size={24} />
          </div>
          <span className="text-2xl font-bold text-white">
            ease<span className="text-green-200">waybill</span>
          </span>
        </Link>

        {/* Center Illustration */}
        <div className="relative z-10 text-white">
          {/* Animated icon card */}
          <div className="w-32 h-32 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            >
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>

          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Welcome <br /> Back! 👋
          </h2>
          <p className="text-green-100 text-lg leading-relaxed">
            Sign in to manage your orders, track shipments, and handle escrow
            payments securely.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {[
              "✅ View all your active orders",
              "✅ Track real-time delivery",
              "✅ Manage escrow payments",
            ].map((item) => (
              <p key={item} className="text-green-100 text-sm">
                {item}
              </p>
            ))}
          </div>
        </div>

        <p className="text-green-200 text-sm relative z-10">
          © {new Date().getFullYear()} EaseWaybill Inc.
        </p>
      </div>

      {/* ====== RIGHT SIDE - Sign In Form ====== */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
              <Package size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900">
              ease<span className="text-green-500">waybill</span>
            </span>
          </Link>

          {/* Form Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                Secure
              </span>
            </div>
            <p className="text-gray-500">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* ====== SIGN IN FORM ====== */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                href="#"
                className="text-sm text-green-600 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-green-600 font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            {/* Facebook Sign In */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Sign in with Facebook
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
