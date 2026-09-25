import fs from "node:fs";
import path from "node:path";

export const REPO = "https://github.com/ahmedelraei/wardscript";
export const SITE_REPO = "https://github.com/ahmedelraei/wardscript-website";
const ROOT = path.join(process.cwd(), "content", "docs");

export type Doc = { slug: string[]; file: string; title: string; href: string };
export type Section = { title: string; docs: Doc[] };

function titleOf(file: string) {
  const m = fs.readFileSync(path.join(ROOT, file), "utf8").match(/^#\s+(.+)$/m);
  return m ? m[1].replace(/`/g, "") : file;
}

/** Source file (relative to docs/) -> URL slug. */
export function slugFor(file: string): string[] {
  const noExt = file.replace(/\.md$/, "");
  if (noExt === "index") return [];
  return noExt.split("/");
}

export const hrefFor = (slug: string[]) => "/docs" + (slug.length ? "/" + slug.join("/") : "");

/** The sidebar, in reading order. Titles default to each page's first heading. */
const NAV: [string, string[]][] = [
  ["Getting started", ["index.md", "installation.md", "quickstart.md", "prompt-injection.md"]],
  ["Language", ["language/basics.md", "language/types.md", "language/classes.md", "language/ai-functions.md", "language/errors.md", "language/trust.md", "language/effects.md", "language/tools.md", "language/testing.md"]],
  ["Guides", ["guides/python.md", "guides/typescript.md", "guides/models.md", "guides/audit-traces.md"]],
  ["Reference", ["reference/cli.md", "reference/diagnostics.md"]],
];

let cache: Section[] | null = null;
export function sections(): Section[] {
  if (cache) return cache;
  const mk = (file: string): Doc => {
    const slug = slugFor(file);
    return { file, slug, href: hrefFor(slug), title: titleOf(file) };
  };
  cache = NAV.map(([title, files]) => ({ title, docs: files.map(mk) }));
  return cache;
}

export const allDocs = () => sections().flatMap((s) => s.docs);

export function findDoc(slug: string[]): Doc | undefined {
  const key = slug.join("/");
  return allDocs().find((d) => d.slug.join("/") === key);
}

export const readDoc = (doc: Doc) => fs.readFileSync(path.join(ROOT, doc.file), "utf8");

/** Resolve a relative link found in `fromFile` to a site URL or a GitHub URL. */
export function resolveLink(fromFile: string, href: string): string {
  if (/^[a-z]+:|^#|^\//i.test(href)) return href;
  const [p, hash] = href.split("#");
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), p));
  const suffix = hash ? "#" + hash : "";
  if (target.endsWith(".md") && !target.startsWith("..") && fs.existsSync(path.join(ROOT, target)))
    return hrefFor(slugFor(target)) + "/" + suffix;
  if (target.startsWith("img/")) return "/" + target;
  // Anything outside docs/ (examples, editors, source): link to GitHub.
  const repoPath = path.posix.normalize(path.posix.join("docs", target));
  return `${REPO}/tree/main/${repoPath}${suffix}`;
}
