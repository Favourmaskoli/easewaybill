"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { authApi } from "@/lib/api/auth.api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reset, setReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resetToken = searchParams.get("token");

    if (resetToken) {
      setToken(resetToken);
    } else {
      setError("This password reset link is invalid or incomplete.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!token) {
      setError("This password reset link is invalid or has expired.");
      return;
    }

    if (newPassword.length < 12) {
      setError("Your password must be at least 12 characters long.");
      return;
    }

    if (newPassword.length > 128) {
      setError("Your password must not exceed 128 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token,
        newPassword,
      });

      setReset(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password. The link may have expired.",
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

        {reset ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={28} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Password reset successful
            </h1>

            <p className="text-gray-500 mb-6">
              Your password has been changed successfully. You can now sign in
              with your new password.
            </p>

            <Link
              href="/sign-in"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Sign in <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Reset your password
            </h1>

            <p className="text-gray-500 mb-6">
              Create a new password for your account. Your new password must be
              at least 12 characters long.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  New Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />

                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    autoComplete="new-password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={12}
                    maxLength={128}
                    disabled={loading || !token}
                    className="input-field pl-10 pr-11 disabled:opacity-60 disabled:cursor-not-allowed"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={12}
                    maxLength={128}
                    disabled={loading || !token}
                    className="input-field pl-10 pr-11 disabled:opacity-60 disabled:cursor-not-allowed"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    disabled={loading}
                    aria-label={
                      showConfirmPassword
                        ? "Hide password confirmation"
                        : "Show password confirmation"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>Password requirements:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>At least 12 characters</li>
                  <li>No more than 128 characters</li>
                  <li>Both password fields must match</li>
                </ul>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2"
                >
                  <AlertCircle
                    size={18}
                    className="shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !token ||
                  !newPassword ||
                  !confirmPassword
                }
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password <ArrowRight size={18} />
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