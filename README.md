# wardscript-website

The website and documentation for [Wardscript](https://github.com/ahmedelraei/wardscript), built with Next.js (App Router, static export).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
```

## Content

Docs are Markdown in `content/docs/`, written for the site (they are not copied from the
Wardscript repo). The exception is `content/docs/weps/`, the enhancement proposals, which
`sync-docs` copies from the Wardscript repo as written. The sidebar order is defined in `lib/docs.ts` (`NAV`); a page's title is
its first `#` heading. Wardscript code blocks are highlighted with the VS Code extension's
TextMate grammar (`content/ward.tmLanguage.json`).

To refresh the grammar, images and example programs from a local checkout:

```bash
npm run sync-docs -- ../wardscript
```

- `/` — landing page
- `/docs/` — getting started, language tour (`/docs/language/...`), guides (`/docs/guides/...`)
  and reference (`/docs/reference/...`), and enhancement proposals (`/docs/weps/...`)
- `/playground/` — edit, check, build and run Wardscript in the browser
- `/examples/` — the example programs

## Playground

The playground runs the real checker, compiled to WebAssembly from the `ward_wasm` crate in the
Wardscript repo, and runs programs with the generated Python in [Pyodide](https://pyodide.org)
(loaded from jsDelivr on the first Run). The built checker is committed in `public/wasm/`; to
rebuild it after a language change:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version <the crate's wasm-bindgen version>
npm run build-wasm -- ../wardscript
```
