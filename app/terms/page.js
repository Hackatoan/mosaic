import { Policy } from "../components/Policy.jsx";
import { getDictionary, languageAlternates } from "../get-dictionary.js";

export async function generateMetadata() {
  const dict = await getDictionary("en");
  return {
    title: dict.meta.termsTitle,
    description: dict.meta.termsDescription,
    alternates: { canonical: "/terms", languages: languageAlternates("/terms") },
  };
}

export default async function TermsPage() {
  const dict = await getDictionary("en");
  return <Policy blocks={dict.terms.blocks} />;
}
