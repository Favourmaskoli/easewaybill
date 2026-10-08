import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Details — EaseWaybill",
  description: "EaseWaybill's registered business and contact information.",
};

export default function BusinessDetailsPage() {
  const doc = getLegalDoc("business-details");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
