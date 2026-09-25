import Link from "next/link";
import { REPO } from "../lib/docs";

export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <Logo /> Wardscript
        </Link>
        <nav className="nav">
          <Link href="/docs/">Docs</Link>
          <Link href="/docs/reference/cli/">Reference</Link>
          <Link href="/examples/">Examples</Link>
          <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  );
}

export function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="var(--accent)" />
      <path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
