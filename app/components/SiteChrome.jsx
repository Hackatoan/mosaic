"use client";

import { useT } from "../lib/i18n-client.js";
import { LangSwitcher } from "./LangSwitcher.jsx";

// Header + footer, localized per-visitor. Nav links carry the resolved locale
// prefix so a Spanish-viewing visitor stays in Spanish when they click through.
export function SiteHeader() {
  const { t, locale } = useT();
  const p = locale === "en" ? "" : `/${locale}`;
  return (
    <header className="site-header">
      <nav>
        <a className="brand" href={p || "/"}>
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          Mosaic
        </a>
        <div className="nav-links">
          <a href={p || "/"}>{t("nav.generate")}</a>
          <a href={`${p}/privacy`}>{t("nav.privacy")}</a>
          <a href={`${p}/terms`}>{t("nav.terms")}</a>
          <a href="https://github.com/Hackatoan/mosaic" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <LangSwitcher current={locale} />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const { t, locale } = useT();
  const p = locale === "en" ? "" : `/${locale}`;
  return (
    <footer className="site-footer">
      <div className="inner">
        <span>© {new Date().getFullYear()} Hackatoa</span>
        <span>
          {t("footer.builtBy")} <a href="https://hackatoa.com">hackatoa.com</a>
        </span>
        <span>
          <a href={`${p}/privacy`}>{t("footer.privacy")}</a> ·{" "}
          <a href={`${p}/terms`}>{t("footer.terms")}</a>
        </span>
      </div>
    </footer>
  );
}
