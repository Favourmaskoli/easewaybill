// // app/(auth)/sign-up/page.tsx
// // Sign Up Page for EaseWaybill
// // Split layout: Left (brand visual) + Right (form)

// "use client"; // Client component for form state

// import { useState } from "react";
// import Link from "next/link";
// import {
//   Package,
//   User,
//   Mail,
//   Lock,
//   Phone,
//   Eye,
//   EyeOff,
//   ShieldCheck,
// } from "lucide-react";

// // ============================================================
// // SIGN UP PAGE COMPONENT
// // ============================================================
// export default function SignUpPage() {
//   // ---- Form State ----
//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     phone: "",
//   });

//   // ---- Toggle password visibility ----
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   // ---- Loading state for submit ----
//   const [loading, setLoading] = useState(false);

//   // Handle input changes and update formData state
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // Handle form submission (mock for now)
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     // TODO: Connect to NestJS API
//     console.log("Sign Up Data:", formData);
//     setTimeout(() => setLoading(false), 2000); // Mock delay
//   };

//   return (
//     <div className="min-h-screen flex">

//       {/* ====== LEFT SIDE - Brand Panel ====== */}
//       <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 flex-col justify-between p-12 relative overflow-hidden">

//         {/* Background decorative circles */}
//         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
//         <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-48 -translate-x-48" />

//         {/* Logo */}
//         <Link href="/" className="flex items-center gap-2 relative z-10">
//           <div className="bg-white text-blue-600 p-2 rounded-xl">
//             <Package size={24} />
//           </div>
//           <span className="text-2xl font-bold text-white">
//             ease<span className="text-blue-200">waybill</span>
//           </span>
//         </Link>

//         {/* Center content */}
//         <div className="relative z-10 text-white">
//           {/* Large icon */}
//           <div className="w-28 h-28 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
//             <ShieldCheck size={56} className="text-white" />
//           </div>

//           <h2 className="text-4xl font-bold mb-4 leading-tight">
//             Trade with <br /> Confidence
//           </h2>
//           <p className="text-blue-100 text-lg leading-relaxed">
//             Join thousands of buyers and sellers using EaseWaybill's secure
//             escrow system for safe transactions.
//           </p>

//           {/* Stats */}
//           <div className="flex gap-8 mt-8">
//             <div>
//               <p className="text-3xl font-bold">10K+</p>
//               <p className="text-blue-200 text-sm">Happy Users</p>
//             </div>
//             <div>
//               <p className="text-3xl font-bold">₦2B+</p>
//               <p className="text-blue-200 text-sm">Secured</p>
//             </div>
//             <div>
//               <p className="text-3xl font-bold">99%</p>
//               <p className="text-blue-200 text-sm">Success Rate</p>
//             </div>
//           </div>
//         </div>

//         {/* Bottom text */}
//         <p className="text-blue-200 text-sm relative z-10">
//           © {new Date().getFullYear()} EaseWaybill Inc.
//         </p>
//       </div>

//       {/* ====== RIGHT SIDE - Sign Up Form ====== */}
//       <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white overflow-y-auto">
//         <div className="w-full max-w-md">

//           {/* Mobile Logo (visible only on small screens) */}
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
//             <h1 className="text-3xl font-bold text-blue-900 mb-2">Sign Up</h1>
//             <p className="text-gray-500">
//               Create your account to get started
//             </p>
//           </div>

//           {/* ====== SIGN UP FORM ====== */}
//           <form onSubmit={handleSubmit} className="space-y-4">

//             {/* Full Name */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                 Full Name
//               </label>
//               <div className="relative">
//                 {/* Icon */}
//                 <User
//                   size={18}
//                   className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
//                 />
//                 <input
//                   type="text"
//                   name="fullName"
//                   placeholder="John Doe"
//                   value={formData.fullName}
//                   onChange={handleChange}
//                   required
//                   className="input-field pl-10"
//                 />
//               </div>
//             </div>

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
//                   placeholder="Create a password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   required
//                   className="input-field pl-10 pr-10"
//                 />
//                 {/* Toggle password visibility */}
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>
//             </div>

//             {/* Confirm Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                 Confirm Password
//               </label>
//               <div className="relative">
//                 <Lock
//                   size={18}
//                   className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
//                 />
//                 <input
//                   type={showConfirmPassword ? "text" : "password"}
//                   name="confirmPassword"
//                   placeholder="Confirm your password"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   required
//                   className="input-field pl-10 pr-10"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 >
//                   {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>
//             </div>

//             {/* Phone Number */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                 Phone Number
//               </label>
//               <div className="relative">
//                 <Phone
//                   size={18}
//                   className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
//                 />
//                 <input
//                   type="tel"
//                   name="phone"
//                   placeholder="+234 800 000 0000"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   required
//                   className="input-field pl-10"
//                 />
//               </div>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
//             >
//               {loading ? (
//                 <>
//                   {/* Loading spinner */}
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   Creating Account...
//                 </>
//               ) : (
//                 "Create Account"
//               )}
//             </button>

//             {/* Already have account link */}
//             <p className="text-center text-sm text-gray-500">
//               Already have an account?{" "}
//               <Link
//                 href="/sign-in"
//                 className="text-blue-600 font-semibold hover:underline"
//               >
//                 Sign In
//               </Link>
//             </p>

//             {/* Divider */}
//             <div className="flex items-center gap-3 my-2">
//               <div className="flex-1 h-px bg-gray-200" />
//               <span className="text-sm text-gray-400">or</span>
//               <div className="flex-1 h-px bg-gray-200" />
//             </div>

//             {/* Social Sign Up Buttons */}
//             {/* Google */}
//             <button
//               type="button"
//               className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700"
//             >
//               {/* Google SVG Icon */}
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
//               Sign up with Google
//             </button>

//             {/* Facebook */}
//             <button
//               type="button"
//               className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700"
//             >
//               {/* Facebook SVG Icon */}
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
//                 <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
//               </svg>
//               Sign up with Facebook
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// app/(auth)/sign-up/page.tsx
// Sign Up Page for EaseWaybill — Green/Gray/Blue Theme
// Split layout: Left (brand visual) + Right (form)

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to NestJS API
    console.log("Sign Up Data:", formData);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* ====== LEFT SIDE - Brand Panel ====== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-500 to-green-400 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-48 -translate-x-48" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="bg-white text-green-600 p-2 rounded-xl">
            <Package size={24} />
          </div>
          <span className="text-2xl font-bold text-white">
            ease<span className="text-green-200">waybill</span>
          </span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 text-white">
          {/* Large icon */}
          <div className="w-28 h-28 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <ShieldCheck size={56} className="text-white" />
          </div>

          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Trade with <br /> Confidence
          </h2>
          <p className="text-green-100 text-lg leading-relaxed">
            Join thousands of buyers and sellers using EaseWaybill's secure
            escrow system for safe transactions.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-8">
            <div>
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-green-200 text-sm">Happy Users</p>
            </div>
            <div>
              <p className="text-3xl font-bold">₦2B+</p>
              <p className="text-green-200 text-sm">Secured</p>
            </div>
            <div>
              <p className="text-3xl font-bold">99%</p>
              <p className="text-green-200 text-sm">Success Rate</p>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-green-200 text-sm relative z-10">
          © {new Date().getFullYear()} EaseWaybill Inc.
        </p>
      </div>

      {/* ====== RIGHT SIDE - Sign Up Form ====== */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white overflow-y-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Sign Up</h1>
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                Free
              </span>
            </div>
            <p className="text-gray-500">Create your account to get started</p>
          </div>

          {/* ====== SIGN UP FORM ====== */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

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
                  placeholder="Create a password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+234 800 000 0000"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Already have account link */}
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-green-600 font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google */}
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
              Sign up with Google
            </button>

            {/* Facebook */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Sign up with Facebook
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
