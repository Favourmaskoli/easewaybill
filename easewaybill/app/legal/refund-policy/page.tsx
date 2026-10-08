import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — EaseWaybill",
  description: "When and how refunds work for escrow-protected orders.",
};

export default function RefundPolicyPage() {
  const doc = getLegalDoc("refund-policy");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
