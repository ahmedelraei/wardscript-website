"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Section } from "../lib/docs";

export type SearchEntry = { href: string; title: string; section: string; text: string };

export function Sidebar({ sections, index }: { sections: Section[]; index: SearchEntry[] }) {
  const path = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const norm = (p: string) => p.replace(/\/$/, "");
  const query = q.trim().toLowerCase();
  const results = query
    ? index.filter((e) => (e.title + " " + e.text).toLowerCase().includes(query)).slice(0, 12)
    : [];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Close menu" : "Browse docs"}
      </button>
      <div className="sidebar-body">
        <input className="search" type="search" placeholder="Search docs…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search docs" />
        {query ? (
          <ul className="results">
            {results.length === 0 && <li className="muted">No matches</li>}
            {results.map((r) => (
              <li key={r.href}>
                <Link href={r.href} onClick={() => { setQ(""); setOpen(false); }}>
                  <span>{r.title}</span>
                  <small>{r.section}</small>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          sections.map((s) => (
            <div key={s.title} className="side-section">
              <h4>{s.title}</h4>
              <ul>
                {s.docs.map((d) => (
                  <li key={d.href}>
                    <Link href={d.href + "/"} className={norm(path) === norm(d.href) ? "active" : ""} onClick={() => setOpen(false)}>
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
