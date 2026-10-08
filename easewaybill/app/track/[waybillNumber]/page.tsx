"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  MapPin,
  PackageSearch,
  PackageX,
} from "lucide-react";
import {
  useTrackWaybill,
  TrackingNotFoundError,
} from "@/lib/hooks/useTrackWaybill";
import TrackingSearchForm from "@/app/components/tracking/TrackingSearchForm";
import StatusStepper from "@/app/components/tracking/StatusStepper";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function TrackResultsPage() {
  const params = useParams<{ waybillNumber: string }>();
  const waybillNumber = decodeURIComponent(params.waybillNumber);

  const { data, isLoading, error } = useTrackWaybill(waybillNumber);

  return (
    <main className="min-h-screen bg-cream-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/track"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 hover:text-olive-800"
        >
          <ArrowLeft size={15} />
          Track another shipment
        </Link>

        <div className="mb-6">
          <TrackingSearchForm initialValue={waybillNumber} />
        </div>

        {/* ── Loading ─────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-4 rounded-2xl border border-cream-300 bg-white p-6">
            <div className="h-6 w-1/2 animate-pulse rounded bg-cream-200" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-cream-200" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-cream-200" />
          </div>
        )}

        {/* ── Not found ───────────────────────────────────────── */}
        {!isLoading && error instanceof TrackingNotFoundError && (
          <div className="rounded-2xl border border-cream-300 bg-white py-14 text-center">
            <PackageX size={32} className="mx-auto mb-3 text-olive-300" />
            <p className="mb-1 text-base font-semibold text-olive-800">
              We couldn&apos;t find that waybill
            </p>
            <p className="text-sm text-olive-400">
              Double-check the number and try again — it&apos;s usually printed
              on your receipt as WB-XXXXXXXX.
            </p>
          </div>
        )}

        {/* ── Other errors ────────────────────────────────────── */}
        {!isLoading && error && !(error instanceof TrackingNotFoundError) && (
          <div className="rounded-2xl border border-cream-300 bg-white py-14 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3 text-red-400" />
            <p className="text-sm font-semibold text-red-600">
              Something went wrong. Please try again shortly.
            </p>
          </div>
        )}

        {/* ── Result ──────────────────────────────────────────── */}
        {!isLoading && !error && data && (
          <div className="space-y-5">
            {/* Summary card */}
            <div className="rounded-2xl border border-cream-300 bg-white p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-olive-400">
                    Waybill
                  </p>
                  <h1 className="text-lg font-bold text-olive-900">
                    {data.waybillNumber}
                  </h1>
                  <p className="mt-0.5 text-xs text-olive-400">
                    Order {data.trackingCode}
                  </p>
                </div>

                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-cream-200), var(--color-cream-300))",
                  }}
                >
                  <PackageSearch size={20} className="text-olive-600" />
                </div>
              </div>

              <StatusStepper orderStatus={data.orderStatus} />

              <p className="mt-5 text-sm text-olive-600">{data.description}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="clay-inset rounded-xl p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-olive-500">
                    <MapPin size={12} /> Pickup
                  </p>
                  <p className="text-sm text-olive-800">{data.pickupAddress}</p>
                </div>
                <div className="clay-inset rounded-xl p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-olive-500">
                    <MapPin size={12} /> Delivery
                  </p>
                  <p className="text-sm text-olive-800">
                    {data.deliveryAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline card */}
            <div className="rounded-2xl border border-cream-300 bg-white p-6">
              <h2 className="mb-4 text-sm font-bold text-olive-900">
                Shipment history
              </h2>

              {data.timeline.length === 0 ? (
                <p className="text-sm text-olive-400">
                  No tracking events yet.
                </p>
              ) : (
                <ol className="space-y-5">
                  {data.timeline.map((entry, index) => (
                    <li
                      key={`${entry.createdAt}-${index}`}
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-olive-600" />
                        {index < data.timeline.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-cream-300" />
                        )}
                      </div>

                      <div className="pb-1">
                        <p className="text-sm font-semibold text-olive-800">
                          {formatStatusLabel(entry.status)}
                        </p>
                        {entry.note && (
                          <p className="mt-0.5 text-sm text-olive-500">
                            {entry.note}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-olive-400">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(entry.createdAt)}
                          </span>
                          {entry.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {entry.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
