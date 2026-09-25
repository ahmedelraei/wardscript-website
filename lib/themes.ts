import type { ThemeRegistrationRaw } from "shiki";

// Code colors. Types are Ward green, the trust built-ins (validate, approve, declassify) are green
// too, and `Untrusted` is the only amber token.
const palette = {
  light: {
    bg: "#FFFFFF", fg: "#15171C", kw: "#3450B8", fn: "#0B7285", type: "#1E7A55", trust: "#1E7A55",
    untrusted: "#B7791F", str: "#8A3FB5", num: "#B4235A", comment: "#8A8F99", punct: "#5E6472",
  },
  dark: {
    bg: "#181A1F", fg: "#E8E9E5", kw: "#8FB0FF", fn: "#6FD3D8", type: "#4FBF8A", trust: "#4FBF8A",
    untrusted: "#E0A84A", str: "#D2A8F0", num: "#FF8FA3", comment: "#6B7180", punct: "#9AA0AC",
  },
};

function theme(name: string, type: "light" | "dark"): ThemeRegistrationRaw {
  const c = palette[type];
  return {
    name,
    type,
    settings: [
      { settings: { foreground: c.fg, background: c.bg } },
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: c.comment, fontStyle: "italic" } },
      { scope: ["keyword", "storage", "keyword.control", "variable.language", "support.other.provider"], settings: { foreground: c.kw } },
      { scope: ["keyword.operator", "punctuation"], settings: { foreground: c.punct } },
      { scope: ["meta.annotation", "punctuation.definition.annotation", "storage.type.annotation"], settings: { foreground: c.kw } },
      { scope: ["entity.name.type", "support.type", "support.class", "entity.name.class"], settings: { foreground: c.type } },
      { scope: ["support.type.trust.untrusted.ward"], settings: { foreground: c.untrusted, fontStyle: "bold" } },
      { scope: ["support.function.trust.ward"], settings: { foreground: c.trust, fontStyle: "bold" } },
      { scope: ["string", "constant.character.escape"], settings: { foreground: c.str } },
      { scope: ["meta.interpolation", "punctuation.section.interpolation"], settings: { foreground: c.fg } },
      { scope: ["constant.numeric", "constant.language"], settings: { foreground: c.num } },
      { scope: ["entity.name.function", "support.function"], settings: { foreground: c.fn } },
      { scope: ["variable", "entity.name.tag", "support.type.property-name"], settings: { foreground: c.fg } },
      // Other languages on the site (bash, python, typescript, json)
      { scope: ["support.type.property-name.json"], settings: { foreground: c.kw } },
      { scope: ["variable.parameter", "variable.other"], settings: { foreground: c.fg } },
    ],
  };
}

export const wardLight = theme("ward-light", "light");
export const wardDark = theme("ward-dark", "dark");
