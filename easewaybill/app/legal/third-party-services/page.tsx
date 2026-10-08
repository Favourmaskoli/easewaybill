import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Third-Party Services — EaseWaybill",
  description:
    "The third-party services EaseWaybill integrates and their policies.",
};

export default function ThirdPartyPage() {
  const doc = getLegalDoc("third-party-services");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
