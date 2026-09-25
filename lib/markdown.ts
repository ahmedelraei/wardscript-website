import fs from "node:fs";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import { createHighlighter, type Highlighter } from "shiki";
import type { Root, Element } from "hast";
import { resolveLink } from "./docs";

let hl: Promise<Highlighter> | null = null;
function highlighter() {
  if (!hl) {
    const grammar = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "ward.tmLanguage.json"), "utf8"));
    hl = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [{ ...grammar, name: "ward", aliases: ["wardscript"] }, "bash", "powershell", "python", "typescript", "json", "toml", "rust", "text"],
    });
  }
  return hl;
}

// The upstream README tags Wardscript as `rust` for GitHub; everything that looks like Ward is Ward.
const looksLikeWard = (code: string) => /\b(ai fn|Untrusted<|uses \{|import mcp)\b/.test(code);

export async function highlight(code: string, lang = "ward") {
  const h = await highlighter();
  if (lang === "rust" && looksLikeWard(code)) lang = "ward";
  if (!h.getLoadedLanguages().includes(lang)) lang = "text";
  return h.codeToHtml(code.replace(/\n$/, ""), {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}

export type Heading = { id: string; text: string; depth: number };

export async function renderMarkdown(source: string, file: string) {
  const headings: Heading[] = [];
  const codeBlocks: { node: Element; parent: Element | Root; index: number; lang: string; code: string }[] = [];
  let title = "";

  const tree = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .run(unified().use(remarkParse).use(remarkGfm).parse(source));

  const root = tree as Root;
  visit(root, "element", (node: Element, index, parent) => {
    if (node.tagName === "h1" && !title) {
      title = toString(node);
      if (parent && index !== undefined) (parent as Element).children.splice(index, 1);
      return index;
    }
    if ((node.tagName === "h2" || node.tagName === "h3") && node.properties?.id) {
      headings.push({ id: String(node.properties.id), text: toString(node), depth: node.tagName === "h2" ? 2 : 3 });
      node.children = [{ type: "element", tagName: "a", properties: { href: `#${node.properties.id}`, className: ["anchor"] }, children: node.children }];
    }
    if (node.tagName === "a" && typeof node.properties?.href === "string") {
      const href = resolveLink(file, node.properties.href);
      node.properties.href = href;
      if (/^https?:/.test(href)) { node.properties.target = "_blank"; node.properties.rel = ["noreferrer"]; }
    }
    if (node.tagName === "img" && typeof node.properties?.src === "string") {
      node.properties.src = resolveLink(file, node.properties.src);
    }
    if (node.tagName === "table" && parent && index !== undefined) {
      (parent as Element).children[index] = { type: "element", tagName: "div", properties: { className: ["table-wrap"] }, children: [node] };
    }
    if (node.tagName === "pre" && parent && index !== undefined) {
      const code = node.children[0] as Element | undefined;
      if (code?.tagName === "code") {
        const cls = (code.properties?.className as string[] | undefined) ?? [];
        const lang = cls.find((c) => c.startsWith("language-"))?.slice(9) ?? "text";
        codeBlocks.push({ node, parent: parent as Element, index, lang, code: toString(code) });
      }
    }
  });

  for (const b of codeBlocks) {
    const html = await highlight(b.code, b.lang);
    (b.parent as Element).children[b.index] = { type: "raw", value: html } as never;
  }

  const html = String(unified().use(rehypeStringify, { allowDangerousHtml: true }).stringify(root));
  return { html, headings, title };
}
