import { StreamLanguage, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const KEYWORDS = new Set([
  "ai", "fn", "pub", "let", "type", "enum", "match", "if", "else", "for", "in", "while", "return", "throw",
  "throws", "try", "catch", "import", "as", "uses", "budget", "model", "check", "where", "test", "assert",
  "class", "interface", "open", "abstract", "override", "init", "mcp",
]);
const ATOMS = new Set(["true", "false", "None", "Some", "self", "super"]);
const TRUST = new Set(["validate", "approve", "declassify"]);

type State = { inString: boolean };

/** A small tokenizer for Wardscript, for the playground editor. */
export const wardLanguage = StreamLanguage.define<State>({
  name: "ward",
  startState: () => ({ inString: false }),
  token(stream, state) {
    if (state.inString) {
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === "\\") stream.next();
        else if (ch === '"') { state.inString = false; break; }
      }
      return "string";
    }
    if (stream.eatSpace()) return null;
    if (stream.match("//")) { stream.skipToEnd(); return "comment"; }
    if (stream.peek() === '"') { stream.next(); state.inString = true; return "string"; }
    if (stream.match(/^[0-9][0-9_]*(\.[0-9][0-9_]*)?/)) return "number";
    if (stream.match(/^@[A-Za-z_]\w*/)) return "meta";
    const word = stream.match(/^[A-Za-z_]\w*/) as RegExpMatchArray | null;
    if (word) {
      const w = word[0];
      if (w === "Untrusted") return "untrusted";
      if (KEYWORDS.has(w)) return "keyword";
      if (ATOMS.has(w)) return "atom";
      if (TRUST.has(w)) return "trust";
      if (/^[A-Z]/.test(w)) return "typeName";
      if (stream.match(/^\s*\(/, false)) return "function";
      return "variableName";
    }
    if (stream.match(/^(->|=>|==|!=|<=|>=|&&|\|\||[-+*/%<>=!?])/)) return "operator";
    stream.next();
    return "punctuation";
  },
  tokenTable: {
    untrusted: t.special(t.typeName),
    trust: t.special(t.function(t.variableName)),
    function: t.function(t.variableName),
  },
  languageData: { commentTokens: { line: "//" } },
});

/** The site's code colors (see lib/themes.ts), switching with the color scheme through CSS variables. */
export const wardHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: t.keyword, color: "var(--code-kw)" },
    { tag: t.comment, color: "var(--code-comment)", fontStyle: "italic" },
    { tag: t.string, color: "var(--code-str)" },
    { tag: [t.number, t.atom, t.bool], color: "var(--code-num)" },
    { tag: t.typeName, color: "var(--code-type)" },
    { tag: t.special(t.typeName), color: "var(--code-untrusted)", fontWeight: "600" },
    { tag: t.special(t.function(t.variableName)), color: "var(--code-type)", fontWeight: "600" },
    { tag: t.function(t.variableName), color: "var(--code-fn)" },
    { tag: [t.operator, t.punctuation], color: "var(--code-punct)" },
    { tag: t.meta, color: "var(--code-kw)" },
  ]),
);
