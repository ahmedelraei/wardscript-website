import Link from "next/link";
import { notFound } from "next/navigation";
import { allDocs, findDoc, readDoc, SITE_REPO } from "../../../lib/docs";
import { renderMarkdown } from "../../../lib/markdown";

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return allDocs().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props) {
  const doc = findDoc((await params).slug ?? []);
  return { title: doc?.title };
}

export default async function DocPage({ params }: Props) {
  const slug = (await params).slug ?? [];
  const doc = findDoc(slug);
  if (!doc) notFound();
  const { html, headings, title } = await renderMarkdown(readDoc(doc), doc.file);
  const docs = allDocs();
  const i = docs.findIndex((d) => d.href === doc.href);
  const prev = docs[i - 1];
  const next = docs[i + 1];

  return (
    <>
      <article className="doc">
        <h1>{title || doc.title}</h1>
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="doc-foot">
          <a href={`${SITE_REPO}/edit/main/content/docs/${doc.file}`} target="_blank" rel="noreferrer">Edit this page on GitHub</a>
        </div>
        <nav className="pager">
          {prev ? <Link href={prev.href + "/"}><small>Previous</small>{prev.title}</Link> : <span />}
          {next ? <Link href={next.href + "/"} className="next"><small>Next</small>{next.title}</Link> : <span />}
        </nav>
      </article>
      <aside className="toc">
        {headings.length > 0 && (
          <>
            <h4>On this page</h4>
            <ul>
              {headings.map((h) => (
                <li key={h.id} className={h.depth === 3 ? "sub" : ""}><a href={`#${h.id}`}>{h.text}</a></li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </>
  );
}
