"use client";

import { usePathname } from "next/navigation";
import { LOCALES } from "../lib/i18n-client.js";

const LABEL = { en: "EN", es: "ES", "pt-br": "PT", fr: "FR", de: "DE", vi: "VI", th: "TH" };
const HREFLANG = { en: "en", es: "es", "pt-br": "pt-BR", fr: "fr", de: "de", vi: "vi", th: "th" };

// Strip a leading /<locale> segment so we can re-prefix with the target locale
// and keep the visitor on the same page when they switch languages.
function basePath(pathname) {
  const seg = pathname.split("/")[1];
  if (LOCALES.includes(seg) && seg !== "en") return pathname.slice(seg.length + 1) || "/";
  return pathname || "/";
}

export function LangSwitcher({ current }) {
  const pathname = usePathname() || "/";
  const base = basePath(pathname);
  const remember = (l) => { try { localStorage.setItem("hk_lang", l); } catch { /* ignore */ } };
  return (
    <nav aria-label="Language" className="lang-switcher">
      {LOCALES.map((l) => {
        const href = l === "en" ? base : `/${l}${base === "/" ? "" : base}`;
        const active = l === current;
        return (
          <a
            key={l}
            href={href}
            hrefLang={HREFLANG[l]}
            aria-current={active ? "true" : undefined}
            className={active ? "active" : undefined}
            onClick={() => remember(l)}
          >
            {LABEL[l]}
          </a>
        );
      })}
    </nav>
  );
}
