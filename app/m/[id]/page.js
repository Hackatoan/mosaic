import { notFound } from "next/navigation";
import { resultExists } from "../../../lib/results.js";
import { config } from "../../../lib/config.js";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const exists = await resultExists(id);
  if (!exists) {
    return { title: "Mosaic not found" };
  }
  const imageUrl = `${config.siteUrl}/api/m/${id}`;
  return {
    title: "A shared photomosaic",
    description: "Made with Mosaic — turn any photo into a photomosaic.",
    alternates: { canonical: `/m/${id}` },
    // User-generated content: shareable, but not something search engines
    // should index or crawl into.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      url: `${config.siteUrl}/m/${id}`,
      siteName: "Mosaic",
      title: "A shared photomosaic",
      description: "Made with Mosaic — turn any photo into a photomosaic.",
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: "A shared photomosaic",
      images: [imageUrl],
    },
  };
}

export default async function SharedMosaicPage({ params }) {
  const { id } = await params;
  const exists = await resultExists(id);
  if (!exists) notFound();

  const imageUrl = `/api/m/${id}`;

  return (
    <article>
      <h1>A shared photomosaic</h1>
      <p className="subtitle">
        Made with <a href="/">Mosaic</a>. Shared links stick around for {config.shareRetentionDays}{" "}
        days after they were last viewed.
      </p>
      <section className="card result">
        <div className="result-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Shared photomosaic" />
        </div>
        <div className="result-meta">
          <a className="secondary" href={imageUrl} download="mosaic.png">
            Download PNG
          </a>
          <a className="secondary" href="/">
            Make your own
          </a>
        </div>
      </section>
    </article>
  );
}
