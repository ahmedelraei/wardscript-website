# wardscript-website

The website and documentation for [Wardscript](https://github.com/ahmedelraei/wardscript), built with Next.js (App Router, static export).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
```

## Content

Docs are rendered from Markdown in `content/docs/`, copied from the Wardscript repo's `docs/`
directory. Wardscript code blocks are highlighted with the VS Code extension's TextMate grammar
(`content/ward.tmLanguage.json`). To refresh everything from a local checkout:

```bash
npm run sync-docs -- ../wardscript
```

- `/` — landing page
- `/docs/` — getting started guide, demo, language spec (`/docs/spec/...`) and design decisions (`/docs/decisions/...`)
- `/examples/` — the example programs

Relative links between docs are rewritten to site routes; links outside `docs/` go to GitHub.
