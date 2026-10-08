import TrackingSearchForm from "@/app/components/tracking/TrackingSearchForm";
import { PackageSearch } from "lucide-react";

export default function TrackLandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-4 py-16">
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background:
            "linear-gradient(145deg, var(--color-cream-200), var(--color-cream-300))",
          boxShadow:
            "inset 3px 3px 7px rgba(42,53,18,0.08), inset -2px -2px 5px rgba(255,255,255,0.7)",
        }}
      >
        <PackageSearch size={28} className="text-olive-600" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-olive-900">Track your shipment</h1>
      <p className="mb-8 max-w-sm text-center text-sm text-olive-500">
        Enter the waybill number on your receipt or delivery note to see live status.
      </p>

      <TrackingSearchForm />
    </main>
  );
}