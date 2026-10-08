import { getLegalDoc } from "@/lib/legal";
import { LegalPageShell } from "../../components/legal/LegalPageShell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fake Reviews & User Content Policy — EaseWaybill",
  description:
    "Rules against fake or manipulated reviews and fraudulent claims.",
};

export default function FakeReviewsPage() {
  const doc = getLegalDoc("fake-reviews-policy");
  if (!doc) notFound();
  return <LegalPageShell doc={doc} />;
}
