import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copyright & IP Policy — EaseWaybill",
  description:
    "Ownership of EaseWaybill content and how to report infringement.",
};

export default function CopyrightPage() {
  const doc = getLegalDoc("copyright-ip-policy");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
