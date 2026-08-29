import "server-only";

// Lazy-loaded per-locale dictionaries (server-only; used by generateMetadata and
// the SSR-localized Privacy/Terms pages). The client hook (lib/i18n-client.js)
// imports the same JSON for the interactive surfaces.
const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  "pt-br": () => import("./dictionaries/pt-br.json").then((m) => m.default),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default),
  de: () => import("./dictionaries/de.json").then((m) => m.default),
  vi: () => import("./dictionaries/vi.json").then((m) => m.default),
  th: () => import("./dictionaries/th.json").then((m) => m.default),
};

export const LOCALES = Object.keys(dictionaries);
// Locales that get a /<locale> URL prefix (English is served at the root "/").
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== "en");

export const hasLocale = (locale) => Object.prototype.hasOwnProperty.call(dictionaries, locale);
export const getDictionary = (locale) => (dictionaries[locale] || dictionaries.en)();

// hreflang code for each locale (region-qualified where needed).
export const HREFLANG = {
  en: "en", es: "es", "pt-br": "pt-BR", fr: "fr", de: "de", vi: "vi", th: "th",
};
export const OG_LOCALE = {
  en: "en_US", es: "es_ES", "pt-br": "pt_BR", fr: "fr_FR", de: "de_DE", vi: "vi_VN", th: "th_TH",
};

// { hreflang: url } map for Metadata.alternates.languages (+ x-default).
// `path` is the page path without locale prefix, e.g. "" for home, "/privacy".
export function languageAlternates(path = "") {
  const map = {};
  for (const l of LOCALES) map[HREFLANG[l]] = l === "en" ? path || "/" : `/${l}${path}`;
  map["x-default"] = path || "/";
  return map;
}
