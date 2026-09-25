import fs from "node:fs";
import path from "node:path";

export const REPO = "https://github.com/ahmedelraei/wardscript";
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
  if (noExt === "guide") return [];
  if (noExt === "spec/README") return ["spec"];
  return noExt.split("/");
}

export const hrefFor = (slug: string[]) => "/docs" + (slug.length ? "/" + slug.join("/") : "");

const SPEC_ORDER = ["README", "syntax", "names", "types", "trust", "effects", "tools", "runtime", "typescript", "testing", "diagnostics"];

let cache: Section[] | null = null;
export function sections(): Section[] {
  if (cache) return cache;
  const mk = (file: string, title?: string): Doc => {
    const slug = slugFor(file);
    return { file, slug, href: hrefFor(slug), title: title ?? titleOf(file) };
  };
  const list = (dir: string) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".md"));
  const spec = list("spec")
    .map((f) => f.replace(/\.md$/, ""))
    .sort((a, b) => (SPEC_ORDER.indexOf(a) + 1 || 99) - (SPEC_ORDER.indexOf(b) + 1 || 99))
    .map((f) => mk(`spec/${f}.md`, f === "README" ? "Overview" : undefined));
  const decisions = list("decisions").sort().map((f) => mk(`decisions/${f}`));
  cache = [
    { title: "Getting started", docs: [mk("guide.md", "Getting started"), mk("demo.md", "Demo: a vulnerable agent")] },
    { title: "Language specification", docs: spec },
    { title: "Design decisions", docs: decisions },
  ];
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
