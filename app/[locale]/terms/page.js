import { Policy } from "../../components/Policy.jsx";
import { getDictionary, languageAlternates } from "../../get-dictionary.js";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.termsTitle,
    description: dict.meta.termsDescription,
    alternates: { canonical: `/${locale}/terms`, languages: languageAlternates("/terms") },
  };
}

export default async function LocaleTermsPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return <Policy blocks={dict.terms.blocks} locale={locale} />;
}
