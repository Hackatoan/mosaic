"use client";

// Client-side i18n for the interactive surfaces (the generator UI, site chrome,
// shared-mosaic view). The SEO-facing routes (home, /privacy, /terms) are also
// SSR-localized under /<locale>; this hook resolves each visitor's language for
// the client UI from localStorage 'hk_lang' (set by the localized routes /
// language switcher) with a navigator.language fallback, and sets <html lang>.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import en from "../dictionaries/en.json";

// English ships in the main client bundle (it's the SSR/fallback dictionary,
// needed synchronously). The other six are only ever needed for the one
// locale a given visitor resolves to, so they're loaded on demand instead of
// bundled into every visitor's initial JS payload — same lazy-per-locale
// approach the server side already uses in ../get-dictionary.js.
const loaders = {
  en: () => Promise.resolve(en),
  es: () => import("../dictionaries/es.json").then((m) => m.default),
  "pt-br": () => import("../dictionaries/pt-br.json").then((m) => m.default),
  fr: () => import("../dictionaries/fr.json").then((m) => m.default),
  de: () => import("../dictionaries/de.json").then((m) => m.default),
  vi: () => import("../dictionaries/vi.json").then((m) => m.default),
  th: () => import("../dictionaries/th.json").then((m) => m.default),
};

export const LOCALES = Object.keys(loaders);
const LOCALE_SET = new Set(LOCALES);

export function resolveLocale(pathname) {
  // The /<locale> URL prefix wins on the SSR-localized routes (/es, /es/privacy…).
  if (pathname) {
    const seg = pathname.split("/")[1];
    if (LOCALE_SET.has(seg) && seg !== "en") return seg;
  }
  if (typeof window === "undefined") return "en";
  let l = "";
  try { l = localStorage.getItem("hk_lang") || ""; } catch { /* ignore */ }
  if (LOCALE_SET.has(l)) return l;
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("pt")) return "pt-br";
  const two = nav.slice(0, 2);
  return LOCALE_SET.has(two) ? two : "en";
}

function lookup(dict, path) {
  const v = path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), dict);
  return typeof v === "string" ? v : undefined;
}

// Resolves the visitor's locale on mount (SSR renders English, then swaps in on
// hydration — matching initial render, so no hydration mismatch) and sets
// <html lang>. `t()` falls back to English then to the key itself.
export function useT() {
  const pathname = usePathname();
  const [locale, setLocale] = useState("en");
  const [dict, setDict] = useState(en);
  useEffect(() => {
    const l = resolveLocale(pathname);
    // Deliberately deferred: SSR must render "en" first so hydration matches,
    // then this swaps in the real locale post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(l);
    try { document.documentElement.lang = l; } catch { /* ignore */ }
    // Persist so the locale-less tool + shared pages inherit the chosen language.
    try { localStorage.setItem("hk_lang", l); } catch { /* ignore */ }
    let cancelled = false;
    (loaders[l] || loaders.en)().then((d) => {
      if (!cancelled) setDict(d);
    });
    return () => { cancelled = true; };
  }, [pathname]);
  const t = (path, params) => {
    let s = lookup(dict, path) ?? lookup(en, path) ?? path;
    if (params) for (const k in params) s = s.split("{" + k + "}").join(String(params[k]));
    return s;
  };
  return { t, locale, dict };
}
