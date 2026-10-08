import Link from "next/link";

const LINKS = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/refund-policy", label: "Refund Policy" },
  { href: "/legal/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/legal/cookie-policy", label: "Cookie Policy" },
  { href: "/legal/accessibility-statement", label: "Accessibility" },
  { href: "/legal/copyright-ip-policy", label: "Copyright" },
  { href: "/legal/business-details", label: "Contact" },
];

export function LegalFooterLinks() {
  return (
    <nav className="flex flex-wrap gap-4 text-sm text-gray-500">
      {LINKS.map((link, i) => (
        <span key={link.href} className="flex items-center gap-4">
          <Link href={link.href} className="hover:text-gray-900">
            {link.label}
          </Link>
          {i < LINKS.length - 1 && <span aria-hidden>|</span>}
        </span>
      ))}
    </nav>
  );
}
