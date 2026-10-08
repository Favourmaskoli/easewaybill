import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tracking & Analytics Disclosure — EaseWaybill",
  description: "What technical and usage data EaseWaybill collects, and why.",
};

export default function TrackingPage() {
  const doc = getLegalDoc("tracking-analytics");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
