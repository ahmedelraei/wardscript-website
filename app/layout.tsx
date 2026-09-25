import type { Metadata } from "next";
import { Header } from "../components/Header";
import { REPO } from "../lib/docs";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Wardscript — trustworthy AI functions and agents", template: "%s · Wardscript" },
  description:
    "A small, typed language whose compiler proves untrusted data can't reach sensitive actions without an explicit validate, approve or declassify step.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Martian+Mono:wght@400;500&display=swap" />
      </head>
      <body>
        <Header />
        {children}
        <footer className="footer">
          <span>Wardscript is dual-licensed under MIT or Apache-2.0.</span>
          <a href={REPO} target="_blank" rel="noreferrer">github.com/ahmedelraei/wardscript</a>
        </footer>
      </body>
    </html>
  );
}
