import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — EaseWaybill",
  description:
    "How EaseWaybill uses cookies and how to manage your preferences.",
};

export default function CookiePolicyPage() {
  const doc = getLegalDoc("cookie-policy");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
