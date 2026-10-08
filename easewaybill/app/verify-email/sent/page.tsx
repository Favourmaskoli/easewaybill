"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, Package } from "lucide-react";
import { authApi } from "@/lib/api/auth.api";

function VerifyEmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendError(null);
    try {
      await authApi.resendVerification(email);
      setResent(true);
    } catch {
      setResendError("Something went wrong. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="bg-green-600 text-white p-1.5 rounded-lg">
          <Package size={20} />
        </div>
        <span className="text-xl font-bold text-gray-900">
          ease<span className="text-green-500">waybill</span>
        </span>
      </Link>

      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MailCheck size={32} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check your inbox
        </h1>
        <p className="text-gray-500 mb-1">We sent a verification link to</p>
        <p className="text-gray-900 font-medium mb-6">
          {email || "your email"}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Click the link in that email to verify your account. It expires in 24
          hours.
        </p>

        {resent ? (
          <p className="text-sm text-green-600 font-medium mb-4">
            Verification email resent — check your inbox.
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending || !email}
            className="text-sm text-green-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {resending ? "Resending..." : "Didn't get it? Resend email"}
          </button>
        )}

        {resendError && (
          <p className="text-xs text-red-600 mb-4">{resendError}</p>
        )}

        <p className="text-sm text-gray-500 mt-6">
          <Link
            href="/dashboard"
            className="text-green-600 font-semibold hover:underline"
          >
            Continue to dashboard
          </Link>{" "}
          — you can verify later
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailSentPage() {
  // useSearchParams() requires a Suspense boundary in the app router
  return (
    <Suspense fallback={null}>
      <VerifyEmailSentContent />
    </Suspense>
  );
}
