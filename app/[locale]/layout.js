import { notFound } from "next/navigation";
import { hasLocale, PREFIXED_LOCALES } from "../get-dictionary.js";

// Only the prefixed locales are valid; anything else (including "en", served at
// the root) 404s via the notFound() call below. dynamicParams must stay true:
// with it false, an unmatched locale never reaches this function at all --
// Next's internal fallback signal for that case isn't caught by the
// `output: "standalone"` server and crashes the whole process instead of
// rendering a 404 (hit constantly in production from ordinary bot/crawler
// probes, which are almost always single unmatched path segments).
export const dynamicParams = true;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(locale) || locale === "en") notFound();
  // The client hooks (chrome + tool) read the /<locale> prefix from the URL, so a
  // visitor landing directly on /<locale> sees the UI in that language — not just
  // the SSR metadata. No inline script needed.
  return children;
}
