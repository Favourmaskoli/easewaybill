import { CookieConsentBanner } from "../components/legal/CookieConsentBanner";
import { LegalFooterLinks } from "../components/legal/LegalFooterLinks";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="border-t p-6">
          <LegalFooterLinks />
        </footer>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
