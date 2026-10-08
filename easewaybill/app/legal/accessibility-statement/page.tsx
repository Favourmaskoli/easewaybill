import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement — EaseWaybill",
  description: "EaseWaybill's commitment to an accessible platform.",
};

export default function AccessibilityPage() {
  const doc = getLegalDoc("accessibility-statement");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
