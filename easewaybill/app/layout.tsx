// app/layout.tsx
// Root layout — wraps all pages
// No font import needed here in v4, handled in globals.css

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EaseWaybill - Secure Delivery Payments with Escrow",
  description:
    "Pay safely. Get your goods. Release funds only when satisfied.",
  keywords: "waybill, escrow, secure payment, delivery, shipment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}