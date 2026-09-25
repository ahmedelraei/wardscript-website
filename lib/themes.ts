import type { ThemeRegistrationRaw } from "shiki";

// Brand code colors: keywords recede, types are green, and `Untrusted` is the one thing that stands out.
const palette = {
  light: { bg: "#FFFFFF", fg: "#15171C", kw: "#5E6472", type: "#1E7A55", untrusted: "#B7791F", str: "#3A3F4A", comment: "#8A8F99" },
  dark: { bg: "#181A1F", fg: "#E8E9E5", kw: "#9AA0AC", type: "#4FBF8A", untrusted: "#E0A84A", str: "#C9CCD3", comment: "#6B7180" },
};

function theme(name: string, type: "light" | "dark"): ThemeRegistrationRaw {
  const c = palette[type];
  return {
    name,
    type,
    settings: [
      { settings: { foreground: c.fg, background: c.bg } },
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: c.comment } },
      { scope: ["keyword", "storage", "keyword.operator", "meta.annotation", "punctuation.definition.annotation"], settings: { foreground: c.kw } },
      { scope: ["entity.name.type", "support.type", "support.class", "entity.name.class"], settings: { foreground: c.type } },
      { scope: ["support.type.trust.untrusted.ward"], settings: { foreground: c.untrusted } },
      { scope: ["string", "constant.character.escape"], settings: { foreground: c.str } },
      { scope: ["constant.numeric", "constant.language"], settings: { foreground: c.fg } },
      { scope: ["meta.interpolation", "punctuation.section.interpolation"], settings: { foreground: c.fg } },
      { scope: ["entity.name.function", "support.function"], settings: { foreground: c.fg } },
      { scope: ["variable", "entity.name.tag", "support.type.property-name"], settings: { foreground: c.fg } },
    ],
  };
}

export const wardLight = theme("ward-light", "light");
export const wardDark = theme("ward-dark", "dark");
