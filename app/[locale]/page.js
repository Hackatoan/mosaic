import MosaicApp from "../components/MosaicApp.jsx";
import { getDictionary, languageAlternates, OG_LOCALE } from "../get-dictionary.js";
import { config } from "../../lib/config.js";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const url = `${config.siteUrl}/${locale}`;
  return {
    title: { absolute: dict.meta.homeTitle },
    description: dict.meta.homeDescription,
    alternates: { canonical: `/${locale}`, languages: languageAlternates("") },
    openGraph: {
      type: "website",
      url,
      siteName: "Mosaic",
      title: dict.meta.homeTitle,
      description: dict.meta.ogDescription,
      locale: OG_LOCALE[locale],
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mosaic photomosaic generator" }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.homeTitle,
      description: dict.meta.ogDescription,
      images: ["/og.png"],
    },
  };
}

// The interactive tool localizes itself per-visitor via the client hook; this
// route exists for the localized SEO metadata + hreflang.
export default function LocaleHome() {
  return <MosaicApp />;
}
