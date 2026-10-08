"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2, ShieldCheck } from "lucide-react";
import { disputesApi } from "@/lib/api/disputes.api";
import { DISPUTE_REASONS } from "@/lib/types/api.types";

const MIN_DESCRIPTION = 20;
const MAX_DESCRIPTION = 2000;

interface RaiseDisputeModalProps {
  orderId: string;
  trackingCode: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function RaiseDisputeModal({
  orderId,
  trackingCode,
  onSuccess,
  onClose,
}: RaiseDisputeModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    reason?: string;
    description?: string;
  }>({});

  const descLength = description.trim().length;
  const descValid =
    descLength >= MIN_DESCRIPTION && descLength <= MAX_DESCRIPTION;

  const validate = (): boolean => {
    const errors: { reason?: string; description?: string } = {};

    if (!reason) {
      errors.reason = "Please select a reason.";
    }
    if (!description.trim()) {
      errors.description = "Description is required.";
    } else if (descLength < MIN_DESCRIPTION) {
      errors.description = `At least ${MIN_DESCRIPTION} characters required (${descLength} so far).`;
    } else if (descLength > MAX_DESCRIPTION) {
      errors.description = `Cannot exceed ${MAX_DESCRIPTION} characters.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      await disputesApi.raise(orderId, {
        reason,
        description: description.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message instanceof Array
          ? ((err as { response?: { data?: { message?: string[] } } })?.response
              ?.data?.message?.[0] ?? "Failed to raise dispute.")
          : ((err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to raise dispute. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
            padding: "24px 24px 20px",
            position: "relative",
            flexShrink: 0,
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
              }}
            >
              <AlertTriangle size={22} color="white" />
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
                Raise a Dispute
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                Order {trackingCode}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          {/* Escrow lock warning */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "12px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <ShieldCheck
              size={16}
              color="#dc2626"
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
            <p style={{ fontSize: "12px", color: "#991b1b", lineHeight: 1.6 }}>
              Raising a dispute will <strong>lock the escrow funds</strong>{" "}
              until an admin reviews and resolves the case. Only raise a dispute
              if you have a genuine issue with this order.
            </p>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Reason <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {DISPUTE_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    setReason(r.value);
                    setFieldErrors((p) => ({ ...p, reason: undefined }));
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    textAlign: "left",
                    border:
                      reason === r.value
                        ? "2px solid #dc2626"
                        : "1px solid #e5e7eb",
                    background: reason === r.value ? "#fef2f2" : "white",
                    color: reason === r.value ? "#991b1b" : "#374151",
                    fontSize: "13px",
                    fontWeight: reason === r.value ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.1s",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: `2px solid ${reason === r.value ? "#dc2626" : "#d1d5db"}`,
                      background: reason === r.value ? "#dc2626" : "white",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {reason === r.value && (
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          background: "white",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </div>
                  {r.label}
                </button>
              ))}
            </div>
            {fieldErrors.reason && (
              <p
                style={{ fontSize: "11px", color: "#dc2626", marginTop: "6px" }}
              >
                {fieldErrors.reason}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Description <span style={{ color: "#ef4444" }}>*</span>
              <span
                style={{
                  fontWeight: 400,
                  color: "#9ca3af",
                  marginLeft: "6px",
                }}
              >
                (min {MIN_DESCRIPTION} characters)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFieldErrors((p) => ({ ...p, description: undefined }));
              }}
              placeholder="Describe the issue in detail — what happened, when, and any relevant information that will help the admin resolve this dispute..."
              rows={5}
              maxLength={MAX_DESCRIPTION}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${fieldErrors.description ? "#fca5a5" : "#e5e7eb"}`,
                borderRadius: "10px",
                fontSize: "13px",
                color: "#111827",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "4px",
              }}
            >
              {fieldErrors.description ? (
                <p style={{ fontSize: "11px", color: "#dc2626" }}>
                  {fieldErrors.description}
                </p>
              ) : (
                <span />
              )}
              <p
                style={{
                  fontSize: "11px",
                  color:
                    descLength > MAX_DESCRIPTION
                      ? "#dc2626"
                      : descLength >= MIN_DESCRIPTION
                        ? "#16a34a"
                        : "#9ca3af",
                  marginLeft: "auto",
                }}
              >
                {descLength} / {MAX_DESCRIPTION}
              </p>
            </div>
          </div>

          {/* API error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                marginBottom: "16px",
                fontSize: "12px",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <button
              onClick={!isSubmitting ? onClose : undefined}
              disabled={isSubmitting}
              style={{
                padding: "11px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                border: "1px solid #e5e7eb",
                background: "white",
                color: "#4b5563",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason || !descValid || isSubmitting}
              style={{
                padding: "11px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                border: "none",
                background:
                  !reason || !descValid || isSubmitting ? "#fca5a5" : "#dc2626",
                color: "white",
                cursor:
                  !reason || !descValid || isSubmitting
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={13}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <AlertTriangle size={13} />
                  Raise Dispute
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
