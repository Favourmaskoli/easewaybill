"use client";

import { useState } from "react";
import { MapPin, ScanLine, CheckCircle2, AlertTriangle } from "lucide-react";
import { useScanWaybill } from "@/lib/hooks/useScanWaybill";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";

interface ScanWaybillButtonProps {
  waybillNumber: string;
  /** e.g. "Confirm pickup", "Confirm delivery" — matches the order's current stage */
  label: string;
}

export default function ScanWaybillButton({
  waybillNumber,
  label,
}: ScanWaybillButtonProps) {
  const [note, setNote] = useState("");
  const [justScanned, setJustScanned] = useState(false);

  const {
    getLocation,
    isLocating,
    error: locationError,
  } = useCurrentLocation();
  const scanMutation = useScanWaybill(waybillNumber);

  const handleScan = async () => {
    setJustScanned(false);

    // Location is best-effort — a failed GPS read shouldn't block the scan
    let coords: { lat?: number; lng?: number } = {};
    try {
      coords = await getLocation();
    } catch {
      // locationError is already set by the hook; proceed without coords
    }

    scanMutation.mutate(
      { ...coords, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setJustScanned(true);
          setNote("");
        },
      },
    );
  };

  const isBusy = isLocating || scanMutation.isPending;

  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-50 text-olive-600">
          <ScanLine size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-olive-900">{label}</p>
          <p className="text-xs text-olive-400">
            {isLocating
              ? "Getting your location…"
              : "Captures your current location"}
          </p>
        </div>
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (e.g. handed to gatekeeper)"
        maxLength={500}
        className="clay-inset mb-3 w-full rounded-xl px-3.5 py-2.5 text-sm text-olive-800 outline-none placeholder:text-olive-400"
      />

      <button
        type="button"
        onClick={handleScan}
        disabled={isBusy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MapPin size={16} />
        {isBusy ? "Recording scan…" : "Scan checkpoint"}
      </button>

      {locationError && !scanMutation.isError && (
        <p className="mt-2 text-xs text-amber-600">
          {locationError} — scan will be recorded without a location.
        </p>
      )}

      {scanMutation.isError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{scanMutation.error.message}</p>
        </div>
      )}

      {justScanned && !scanMutation.isError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 p-3">
          <CheckCircle2 size={15} className="shrink-0 text-green-600" />
          <p className="text-xs text-green-700">Checkpoint recorded.</p>
        </div>
      )}
    </div>
  );
}
