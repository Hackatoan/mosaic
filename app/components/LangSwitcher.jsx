"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LOCALES } from "../lib/i18n-client.js";

const LABEL = { en: "EN", es: "ES", "pt-br": "PT", fr: "FR", de: "DE", vi: "VI", th: "TH" };
const NAME = { en: "English", es: "Español", "pt-br": "Português", fr: "Français", de: "Deutsch", vi: "Tiếng Việt", th: "ไทย" };
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
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);
  const remember = (l) => { try { localStorage.setItem("hk_lang", l); } catch { /* ignore */ } };
  return (
    <div className="lang-switcher" ref={ref}>
      <button
        type="button"
        className="lang-btn"
        aria-label="Language"
        aria-haspopup="true"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
        </svg>
      </button>
      {open && (
        <div className="lang-pop" role="menu">
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
                {LABEL[l]} · {NAME[l]}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
