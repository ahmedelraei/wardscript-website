import fs from "node:fs";
import path from "node:path";
import { highlight } from "../../lib/markdown";
import { REPO } from "../../lib/docs";

export const metadata = { title: "Examples" };

export default async function Examples() {
  const dir = path.join(process.cwd(), "content");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".wardscript")).sort();
  const items = await Promise.all(
    files.map(async (f) => {
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      const intro = src.match(/^(\/\/.*\n)+/)?.[0].replace(/^\/\/ ?/gm, "").replace(/\n/g, " ").trim() ?? "";
      return { f, intro, html: await highlight(src, "ward") };
    }),
  );
  return (
    <main className="page">
      <h1>Examples</h1>
      <p className="lede">Complete programs from the <a href={`${REPO}/tree/main/examples`} target="_blank" rel="noreferrer">examples directory</a>. Each one passes <code>ward check</code>.</p>
      {items.map((it) => (
        <section key={it.f} id={it.f.replace(/\..*/, "")} className="example">
          <h2><a href={`#${it.f.replace(/\..*/, "")}`} className="anchor">{it.f}</a></h2>
          {it.intro && <p>{it.intro}</p>}
          <div className="prose" dangerouslySetInnerHTML={{ __html: it.html }} />
        </section>
      ))}
    </main>
  );
}
