import { config } from "../lib/config.js";
import { LOCALES, HREFLANG } from "./get-dictionary.js";

// Localized sitemap: home + privacy + terms, each with hreflang alternates for
// all locales (English at the root, others under /<locale>).
const PATHS = [
  { path: "", changeFrequency: "monthly", priority: 1.0 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

const url = (locale, path) => `${config.siteUrl}${locale === "en" ? "" : `/${locale}`}${path || (locale === "en" ? "/" : "")}`;

export default function sitemap() {
  return PATHS.flatMap(({ path, changeFrequency, priority }) =>
    LOCALES.map((locale) => ({
      url: url(locale, path),
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], url(l, path)])),
      },
    })),
  );
}
