// Prefix internal /privacy and /terms links inside translated prose with the
// active locale, so a localized page links to its localized siblings. English
// (no prefix) is returned unchanged. Safe in both server and client components.
export function localizeLinks(html, locale) {
  if (!locale || locale === "en") return html;
  return html
    .replace(/href="\/privacy"/g, `href="/${locale}/privacy"`)
    .replace(/href="\/terms"/g, `href="/${locale}/terms"`);
}
