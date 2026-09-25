import Link from "next/link";
import { REPO } from "../lib/docs";

export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <Logo /> <span>ward<span className="script">script</span></span>
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

/** The checked w between two guard bars. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" aria-hidden="true">
      <rect x="38.4" y="51.2" width="23.04" height="153.6" fill="var(--accent)" />
      <rect x="194.56" y="51.2" width="23.04" height="153.6" fill="var(--accent)" />
      <path d="M76.8 99.84 L102.4 179.2 L129.28 74.24" fill="none" stroke="var(--fg)" strokeWidth="25.6" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="1" />
      <path d="M126.72 99.84 L152.32 179.2 L179.2 74.24" fill="none" stroke="var(--fg)" strokeWidth="25.6" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="1" />
    </svg>
  );
}
