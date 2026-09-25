// Copies the syntax grammar, images and example programs from a local checkout of the
// wardscript repo into content/. The docs themselves are written for the site and live
// in content/docs/; they are not synced. WEPs are records, so they are copied as written.
// Usage: node scripts/sync-docs.mjs [path-to-wardscript]  (default: ../wardscript)
import { cpSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const src = resolve(process.argv[2] ?? "../wardscript");
cpSync(join(src, "editors/vscode/syntaxes/ward.tmLanguage.json"), "content/ward.tmLanguage.json");
for (const f of readdirSync(join(src, "docs/img"))) cpSync(join(src, "docs/img", f), join("public/img", f));
for (const f of readdirSync(join(src, "docs/img"))) cpSync(join(src, "docs/img", f), join("content/docs/img", f));
rmSync("content/docs/weps", { recursive: true, force: true });
cpSync(join(src, "docs/weps"), "content/docs/weps", { recursive: true });
for (const f of readdirSync(join(src, "examples")).filter((f) => f.endsWith(".wardscript")))
  cpSync(join(src, "examples", f), join("content", f));
console.log(`synced grammar, images, WEPs and examples from ${src}`);
