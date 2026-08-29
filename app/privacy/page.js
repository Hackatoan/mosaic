import { Policy } from "../components/Policy.jsx";
import { getDictionary, languageAlternates } from "../get-dictionary.js";

export async function generateMetadata() {
  const dict = await getDictionary("en");
  return {
    title: dict.meta.privacyTitle,
    description: dict.meta.privacyDescription,
    alternates: { canonical: "/privacy", languages: languageAlternates("/privacy") },
  };
}

export default async function PrivacyPage() {
  const dict = await getDictionary("en");
  return <Policy blocks={dict.privacy.blocks} />;
}
