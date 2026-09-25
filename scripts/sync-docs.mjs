// Copies docs from a local checkout of the wardscript repo into content/.
// Usage: node scripts/sync-docs.mjs [path-to-wardscript]  (default: ../wardscript)
import { cpSync, rmSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const src = resolve(process.argv[2] ?? "../wardscript");
rmSync("content/docs", { recursive: true, force: true });
cpSync(join(src, "docs"), "content/docs", { recursive: true });
cpSync(join(src, "editors/vscode/syntaxes/ward.tmLanguage.json"), "content/ward.tmLanguage.json");
for (const f of readdirSync(join(src, "docs/img"))) cpSync(join(src, "docs/img", f), join("public/img", f));
for (const f of readdirSync(join(src, "examples")).filter((f) => f.endsWith(".wardscript")))
  cpSync(join(src, "examples", f), join("content", f));
console.log(`synced docs from ${src}`);
