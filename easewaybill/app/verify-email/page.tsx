"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Package } from "lucide-react";
import { authApi } from "@/lib/api/auth.api";

type VerifyState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    let cancelled = false;

    authApi
      .verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        setState("success");
        setMessage(res.message ?? "Email verified successfully");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const apiMessage = (
          err as { response?: { data?: { message?: string } } }
        )?.response?.data?.message;
        setState("error");
        setMessage(
          apiMessage ?? "This verification link is invalid or has expired.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

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
        {state === "loading" && (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 size={32} className="text-gray-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your email...
            </h1>
            <p className="text-gray-500">This will only take a moment.</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email verified
            </h1>
            <p className="text-gray-500 mb-8">{message}</p>
            <Link href="/dashboard" className="btn-primary inline-block px-8">
              Continue to dashboard
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification failed
            </h1>
            <p className="text-gray-500 mb-8">{message}</p>
            <Link
              href="/sign-in"
              className="text-green-600 font-semibold hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  // useSearchParams() requires a Suspense boundary in the app router
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
