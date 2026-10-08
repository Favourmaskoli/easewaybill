import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — EaseWaybill",
  description:
    "How EaseWaybill collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  const doc = getLegalDoc("privacy-policy");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
