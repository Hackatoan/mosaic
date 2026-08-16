import "./globals.css";
import { config } from "../lib/config.js";

export const metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: "Mosaic — Turn any photo into a photomosaic",
    template: "%s — Mosaic",
  },
  description:
    "Free photomosaic generator. Upload a source photo and a set of tile images, and Mosaic rebuilds the photo out of hundreds of smaller tiles matched by average color. No signup, nothing stored.",
  applicationName: "Mosaic",
  keywords: [
    "photomosaic",
    "photo mosaic generator",
    "image mosaic maker",
    "tile art generator",
    "average color matching",
    "picture mosaic",
  ],
  authors: [{ name: "Hackatoa", url: "https://hackatoa.com" }],
  creator: "Hackatoa",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: config.siteUrl,
    siteName: "Mosaic",
    title: "Mosaic — Turn any photo into a photomosaic",
    description:
      "Free photomosaic generator. Upload a photo and tile images; Mosaic rebuilds it from hundreds of color-matched tiles.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mosaic photomosaic generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mosaic — Turn any photo into a photomosaic",
    description:
      "Free photomosaic generator. Upload a photo and tile images; Mosaic rebuilds it from hundreds of color-matched tiles.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav>
            <a className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              Mosaic
            </a>
            <div className="nav-links">
              <a href="/">Generate</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="https://github.com/Hackatoan/mosaic" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="inner">
            <span>© {new Date().getFullYear()} Hackatoa</span>
            <span>
              Built by <a href="https://hackatoa.com">hackatoa.com</a>
            </span>
            <span>
              <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
