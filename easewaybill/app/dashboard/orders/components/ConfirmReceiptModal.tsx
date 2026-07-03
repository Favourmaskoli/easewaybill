"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";

interface ConfirmReceiptModalProps {
  orderTrackingCode: string;
  amount: string;
  onConfirm: () => Promise<void>;
  onDispute: () => void;
  onClose: () => void;
}

export default function ConfirmReceiptModal({
  orderTrackingCode,
  amount,
  onConfirm,
  onDispute,
  onClose,
}: ConfirmReceiptModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!acknowledged || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      // Parent closes modal on success — we don't close here
      // so the parent can refetch before dismissing
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to confirm receipt. Please try again.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────────── */}
      <div
        onClick={!isSubmitting ? onClose : undefined}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        {/* ── Modal Panel ────────────────────────────────────────── */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "white",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "480px",
            boxShadow:
              "0 25px 60px rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e3a2f 0%, #14532d 100%)",
              padding: "24px 24px 20px",
              position: "relative",
            }}
          >
            <button
              onClick={!isSubmitting ? onClose : undefined}
              disabled={isSubmitting}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isSubmitting ? 0.4 : 1,
              }}
            >
              <X size={15} color="white" />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} color="white" />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "white",
                    marginBottom: "2px",
                  }}
                >
                  Confirm Receipt of Goods
                </h2>
                <p
                  style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}
                >
                  Order {orderTrackingCode} · {amount}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          <div style={{ padding: "24px" }}>
            {/* Warning banner */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                padding: "12px 14px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <AlertTriangle
                size={16}
                color="#d97706"
                style={{ flexShrink: 0, marginTop: "1px" }}
              />
              <p
                style={{ fontSize: "12px", color: "#92400e", lineHeight: 1.6 }}
              >
                <strong>This action is irreversible.</strong> Once confirmed,
                the escrow payment will be released immediately and cannot be
                recalled.
              </p>
            </div>

            {/* What happens next */}
            <p
              style={{
                fontSize: "13px",
                color: "#374151",
                marginBottom: "14px",
                lineHeight: 1.6,
              }}
            >
              You are about to confirm that you have received your goods in
              satisfactory condition. Once you continue:
            </p>

            <ul
              style={{
                margin: "0 0 20px 0",
                padding: "0",
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {[
                "Your order will be marked as Completed.",
                "The escrow payment will be automatically released to the seller.",
                "The seller will begin receiving their payout.",
                "This action cannot be reversed.",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#374151",
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      background: "#dcfce7",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path
                        d="M1 3.5L3.5 6L8 1"
                        stroke="#16a34a"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            {/* Dispute notice */}
            <div
              style={{
                padding: "12px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <p
                style={{ fontSize: "12px", color: "#991b1b", lineHeight: 1.6 }}
              >
                <strong>Have an issue?</strong> If you have any problem with the
                goods, delivery, or transaction — do not confirm. Raise a
                dispute instead so your payment remains securely held in escrow
                while the issue is investigated.
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background: "#f3f4f6",
                marginBottom: "20px",
              }}
            />

            {/* Acknowledgement checkbox */}
            <button
              onClick={() => !isSubmitting && setAcknowledged((v) => !v)}
              disabled={isSubmitting}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                background: acknowledged ? "#f0fdf4" : "#f9fafb",
                border: `1px solid ${acknowledged ? "#86efac" : "#e5e7eb"}`,
                borderRadius: "10px",
                padding: "12px 14px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                marginBottom: "20px",
                width: "100%",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <div style={{ flexShrink: 0, marginTop: "1px" }}>
                {acknowledged ? (
                  <CheckSquare size={18} color="#16a34a" />
                ) : (
                  <Square size={18} color="#9ca3af" />
                )}
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: acknowledged ? "#166534" : "#4b5563",
                  lineHeight: 1.6,
                  fontWeight: acknowledged ? 600 : 400,
                }}
              >
                I understand that confirming this order will immediately release
                the escrow payment to the seller and this action cannot be
                undone.
              </p>
            </button>

            {/* API error */}
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  marginBottom: "16px",
                }}
              >
                <p style={{ fontSize: "12px", color: "#dc2626" }}>{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1.4fr",
                gap: "10px",
              }}
            >
              {/* Raise Dispute */}
              <button
                onClick={() => {
                  if (!isSubmitting) {
                    onClose();
                    onDispute();
                  }
                }}
                disabled={isSubmitting}
                style={{
                  padding: "11px 8px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#dc2626",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                Raise Dispute
              </button>

              {/* Cancel */}
              <button
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
                style={{
                  padding: "11px 8px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  color: "#4b5563",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                Cancel
              </button>

              {/* Confirm & Release */}
              <button
                onClick={handleConfirm}
                disabled={!acknowledged || isSubmitting}
                style={{
                  padding: "11px 8px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  background:
                    !acknowledged || isSubmitting ? "#d1fae5" : "#15803d",
                  color: !acknowledged || isSubmitting ? "#6ee7b7" : "white",
                  cursor:
                    !acknowledged || isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.15s",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={13}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Releasing...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} />
                    Confirm & Release
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
