export interface ScanWaybillPayload {
  location?: string;
  lat?: number;
  lng?: number;
  note?: string;
}

export interface WaybillTimelineEntry {
  id: string;
  status: string;
  note: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

export interface WaybillTrackingResponse {
  waybillNumber: string;
  status: string;
  orderStatus: string;
  trackingCode: string;
  description: string;
  sellerName: string;
  sellerAddress: string;
  buyerName: string;
  buyerAddress: string;
  weight: number | null;
  dimensions: string | null;
  fragile: boolean;
  declaredValue: number | null;
  notes: string | null;
  timeline: WaybillTimelineEntry[];
  generatedAt: string;
  estimatedDelivery: string | null;
}
