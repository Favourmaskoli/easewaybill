import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — EaseWaybill",
  description: "The rules governing use of the EaseWaybill platform.",
};

export default function TermsPage() {
  const doc = getLegalDoc("terms-and-conditions");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
