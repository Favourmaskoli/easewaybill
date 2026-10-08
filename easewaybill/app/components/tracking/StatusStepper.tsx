import {
  CheckCircle,
  CreditCard,
  Package,
  Truck,
  MapPinCheck,
  CheckCheck,
} from "lucide-react";

const HAPPY_PATH = [
  { status: "AWAITING_PAYMENT", label: "Confirmed", icon: CheckCircle },
  { status: "PAID", label: "Paid", icon: CreditCard },
  { status: "SHIPPED", label: "Shipped", icon: Package },
  { status: "IN_TRANSIT", label: "In transit", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: MapPinCheck },
  { status: "COMPLETED", label: "Completed", icon: CheckCheck },
] as const;

const TERMINAL_OVERRIDES: Record<
  string,
  { label: string; tone: "warn" | "danger" }
> = {
  DISPUTED: { label: "Order disputed", tone: "danger" },
  CANCELLED: { label: "Order cancelled", tone: "danger" },
  REFUNDED: { label: "Order refunded", tone: "warn" },
};

export default function StatusStepper({
  orderStatus,
}: {
  orderStatus: string;
}) {
  const override = TERMINAL_OVERRIDES[orderStatus];

  if (override) {
    return (
      <div
        className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
          override.tone === "danger"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        {override.label}
      </div>
    );
  }

  const currentIndex = HAPPY_PATH.findIndex(
    (step) => step.status === orderStatus,
  );

  return (
    <div className="flex items-center">
      {HAPPY_PATH.map((step, index) => {
        const Icon = step.icon;
        const isComplete = currentIndex >= 0 && index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step.status}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  isComplete
                    ? "bg-olive-600 text-white"
                    : "bg-cream-200 text-olive-400"
                } ${isCurrent ? "ring-4 ring-olive-100" : ""}`}
              >
                <Icon size={16} />
              </div>
              <span
                className={`text-[11px] font-medium ${
                  isComplete ? "text-olive-800" : "text-olive-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < HAPPY_PATH.length - 1 && (
              <div
                className={`mx-1.5 h-0.5 flex-1 rounded-full transition-colors ${
                  index < currentIndex ? "bg-olive-600" : "bg-cream-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
