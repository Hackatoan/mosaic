"use client";

// Client-side i18n for the interactive surfaces (the generator UI, site chrome,
// shared-mosaic view). The SEO-facing routes (home, /privacy, /terms) are also
// SSR-localized under /<locale>; this hook resolves each visitor's language for
// the client UI from localStorage 'hk_lang' (set by the localized routes /
// language switcher) with a navigator.language fallback, and sets <html lang>.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import en from "../dictionaries/en.json";
import es from "../dictionaries/es.json";
import ptbr from "../dictionaries/pt-br.json";
import fr from "../dictionaries/fr.json";
import de from "../dictionaries/de.json";
import vi from "../dictionaries/vi.json";
import th from "../dictionaries/th.json";

const DICTS = { en, es, "pt-br": ptbr, fr, de, vi, th };
export const LOCALES = Object.keys(DICTS);

export function resolveLocale(pathname) {
  // The /<locale> URL prefix wins on the SSR-localized routes (/es, /es/privacy…).
  if (pathname) {
    const seg = pathname.split("/")[1];
    if (DICTS[seg] && seg !== "en") return seg;
  }
  if (typeof window === "undefined") return "en";
  let l = "";
  try { l = localStorage.getItem("hk_lang") || ""; } catch { /* ignore */ }
  if (DICTS[l]) return l;
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("pt")) return "pt-br";
  const two = nav.slice(0, 2);
  return DICTS[two] ? two : "en";
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
  useEffect(() => {
    const l = resolveLocale(pathname);
    // Deliberately deferred: SSR must render "en" first so hydration matches,
    // then this swaps in the real locale post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(l);
    try { document.documentElement.lang = l; } catch { /* ignore */ }
    // Persist so the locale-less tool + shared pages inherit the chosen language.
    try { localStorage.setItem("hk_lang", l); } catch { /* ignore */ }
  }, [pathname]);
  const dict = DICTS[locale] || en;
  const t = (path, params) => {
    let s = lookup(dict, path) ?? lookup(en, path) ?? path;
    if (params) for (const k in params) s = s.split("{" + k + "}").join(String(params[k]));
    return s;
  };
  return { t, locale, dict };
}
