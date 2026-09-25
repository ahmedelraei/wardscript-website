# wardscript-website

The website and documentation for [Wardscript](https://github.com/ahmedelraei/wardscript), built with Next.js (App Router, static export).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
```

## Content

Docs are Markdown in `content/docs/`, written for the site (they are not copied from the
Wardscript repo). The sidebar order is defined in `lib/docs.ts` (`NAV`); a page's title is
its first `#` heading. Wardscript code blocks are highlighted with the VS Code extension's
TextMate grammar (`content/ward.tmLanguage.json`).

To refresh the grammar, images and example programs from a local checkout:

```bash
npm run sync-docs -- ../wardscript
```

- `/` — landing page
- `/docs/` — getting started, language tour (`/docs/language/...`), guides (`/docs/guides/...`)
  and reference (`/docs/reference/...`)
- `/examples/` — the example programs
