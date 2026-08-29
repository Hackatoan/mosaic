import { Policy } from "../../components/Policy.jsx";
import { getDictionary, languageAlternates } from "../../get-dictionary.js";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.privacyTitle,
    description: dict.meta.privacyDescription,
    alternates: { canonical: `/${locale}/privacy`, languages: languageAlternates("/privacy") },
  };
}

export default async function LocalePrivacyPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return <Policy blocks={dict.privacy.blocks} locale={locale} />;
}
