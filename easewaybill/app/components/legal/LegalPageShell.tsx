import ReactMarkdown from "react-markdown";
import type { LegalDoc } from "@/lib/legal";

export function LegalPageShell({ doc }: { doc: LegalDoc }) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-semibold">{doc.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Effective: {doc.effectiveDate} · Last updated: {doc.lastUpdated}
        </p>
      </header>
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown>{doc.content}</ReactMarkdown>
      </div>
    </article>
  );
}
