import { notFound } from "next/navigation";
import { hasLocale, PREFIXED_LOCALES } from "../get-dictionary.js";

// Only the prefixed locales are valid; anything else (including "en", served at
// the root) 404s. The root layout owns <html>/<body> and the site chrome.
export const dynamicParams = false;

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
