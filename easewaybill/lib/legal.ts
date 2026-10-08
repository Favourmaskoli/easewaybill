import fs from "fs";
import path from "path";
import matter from "gray-matter";

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

export type LegalDoc = {
  slug: string;
  title: string;
  summary: string;
  effectiveDate: string;
  lastUpdated: string;
  content: string; // raw markdown body
};

export function getAllLegalSlugs(): string[] {
  return fs
    .readdirSync(LEGAL_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getLegalDoc(slug: string): LegalDoc | null {
  const filePath = path.join(LEGAL_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    summary: data.summary ?? "",
    effectiveDate: data.effectiveDate ?? "",
    lastUpdated: data.lastUpdated ?? "",
    content,
  };
}

export function getAllLegalDocs(): LegalDoc[] {
  return getAllLegalSlugs()
    .map((slug) => getLegalDoc(slug))
    .filter((doc): doc is LegalDoc => doc !== null);
}
