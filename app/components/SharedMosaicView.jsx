"use client";

import { useT } from "../lib/i18n-client.js";

// Client view for a shared mosaic (/m/<id>). The page is noindex UGC, so it's
// localized per-visitor via the client hook rather than SSR locale routes.
export function SharedMosaicView({ imageUrl, days }) {
  const { t } = useT();
  return (
    <article>
      <h1>{t("shared.title")}</h1>
      <p className="subtitle" dangerouslySetInnerHTML={{ __html: t("shared.subtitle", { days }) }} />
      <section className="card result">
        <div className="result-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={t("shared.imgAlt")} />
        </div>
        <div className="result-meta">
          <a className="secondary" href={imageUrl} download="mosaic.png">
            {t("shared.downloadPng")}
          </a>
          <a className="secondary" href="/">
            {t("shared.makeYourOwn")}
          </a>
        </div>
      </section>
    </article>
  );
}
