import { Suspense } from "react";
import PaymentsContent from "./PaymentsContent";

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 text-sm">Loading payments...</p>
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
