// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useQuery } from "@tanstack/react-query";
// import { ArrowLeft, MapPin, Package, AlertTriangle } from "lucide-react";
// import ScanWaybillButton from "@/app/components/rider/ScanWaybillButton";
// import { apiClient, unwrap } from "@/lib/api/client";
// import type { Order } from "@/lib/types/api.types";
// import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";

// async function fetchOrder(id: string): Promise<Order> {
//   const response = await apiClient.get<{ data: Order }>(`/orders/${id}`);
//   return unwrap(response);
// }

// const SCAN_LABELS: Record<string, string> = {
//   SHIPPED: "Confirm pickup",
//   IN_TRANSIT: "Update delivery location",
//   DELIVERED: "Confirm delivery",
// };

// export default function RiderOrderDetailPage() {
//   const params = useParams<{ id: string }>();
//   const {
//     data: order,
//     isLoading,
//     error,
//   } = useQuery({
//     queryKey: ["order", params.id],
//     queryFn: () => fetchOrder(params.id),
//   });

//   if (isLoading) {
//     return <div className="h-48 animate-pulse rounded-2xl bg-cream-100 m-4" />;
//   }

//   if (error || !order) {
//     return (
//       <div className="p-6 text-center">
//         <AlertTriangle size={28} className="mx-auto mb-2 text-red-400" />
//         <p className="text-sm text-red-600">Couldn&apos;t load this order.</p>
//       </div>
//     );
//   }

//   const waybillNumber = order.waybills?.[0]?.waybillNumber;
//   const scanLabel = SCAN_LABELS[order.status];

//   return (
//     <div className="space-y-4 p-4">
//       <Link
//         href="/rider/orders"
//         className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 lg:hidden"
//       >
//         <ArrowLeft size={15} />
//         Back to deliveries
//       </Link>

//       <div className="rounded-2xl border border-cream-300 bg-white p-4">
//         <div className="mb-3 flex items-center gap-2">
//           <Package size={18} className="text-olive-600" />
//           <p className="text-sm font-bold text-olive-900">
//             {order.trackingCode}
//           </p>
//         </div>
//         <p className="mb-1 flex items-start gap-1.5 text-sm text-olive-600">
//           <MapPin size={14} className="mt-0.5 shrink-0 text-olive-400" />
//           {order.deliveryAddress}
//         </p>
//         <p className="text-xs text-olive-400">{order.description}</p>
//       </div>

//       {waybillNumber && scanLabel ? (
//         <ScanWaybillButton waybillNumber={waybillNumber} label={scanLabel} />
//       ) : waybillNumber ? (
//         <p className="rounded-2xl border border-cream-300 bg-white p-4 text-center text-sm text-olive-400">
//           No scan action available for status &quot;{order.status}&quot;.
//         </p>
//       ) : (
//         <p className="rounded-2xl border border-cream-300 bg-white p-4 text-center text-sm text-red-500">
//           No waybill found for this order.
//         </p>
//       )}
//     </div>
//   );
// }

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Package, AlertTriangle } from "lucide-react";
import ScanWaybillButton from "@/app/components/rider/ScanWaybillButton";
import { apiClient, unwrap } from "@/lib/api/client";
import type { Order } from "@/lib/types/api.types";

async function fetchOrder(id: string): Promise<Order> {
  const response = await apiClient.get<{ data: Order }>(`/orders/${id}`);
  return unwrap(response);
}

const SCAN_LABELS: Record<string, string> = {
  SHIPPED: "Confirm pickup",
  IN_TRANSIT: "Update delivery location",
  DELIVERED: "Confirm delivery",
};

export default function RiderOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => fetchOrder(params.id),
  });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-cream-100 m-4" />;
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle size={28} className="mx-auto mb-2 text-red-400" />
        <p className="text-sm text-red-600">Couldn&apos;t load this order.</p>
      </div>
    );
  }

  const waybillNumber = order.waybills?.[0]?.waybillNumber;
  const scanLabel = SCAN_LABELS[order.status];

  return (
    <div className="space-y-4 p-4">
      <Link
        href="/rider/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 lg:hidden"
      >
        <ArrowLeft size={15} />
        Back to deliveries
      </Link>

      <div className="rounded-2xl border border-cream-300 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Package size={18} className="text-olive-600" />
          <p className="text-sm font-bold text-olive-900">
            {order.trackingCode}
          </p>
        </div>
        <p className="mb-1 flex items-start gap-1.5 text-sm text-olive-600">
          <MapPin size={14} className="mt-0.5 shrink-0 text-olive-400" />
          {order.deliveryAddress}
        </p>
        <p className="text-xs text-olive-400">{order.description}</p>
      </div>

      {waybillNumber && scanLabel ? (
        <ScanWaybillButton waybillNumber={waybillNumber} label={scanLabel} />
      ) : waybillNumber ? (
        <p className="rounded-2xl border border-cream-300 bg-white p-4 text-center text-sm text-olive-400">
          No scan action available for status &quot;{order.status}&quot;.
        </p>
      ) : (
        <p className="rounded-2xl border border-cream-300 bg-white p-4 text-center text-sm text-red-500">
          No waybill found for this order.
        </p>
      )}
    </div>
  );
}
