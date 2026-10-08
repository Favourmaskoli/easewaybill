import Link from "next/link";
import { getAllLegalDocs } from "@/lib/legal";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = getAllLegalDocs();

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="w-full md:w-64 border-r p-6">
        <Link href="/legal" className="font-semibold block mb-4">
          Legal & Compliance
        </Link>
        <nav className="flex flex-col gap-2 text-sm">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/legal/${doc.slug}`}
              className="text-gray-600 hover:text-black"
            >
              {doc.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
