export const metadata = {
  title: "Privacy Policy",
  description: "How Mosaic handles the images you upload.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="policy">
      <h1>Privacy Policy</h1>
      <p>Last updated: August 18, 2026</p>

      <p>
        Mosaic ("we", "the service") is a small, self-hosted tool that turns a photo into a
        photomosaic built from tile images you supply. This page explains what happens to the
        images and data you send us.
      </p>

      <h2>What we process</h2>
      <ul>
        <li>The source photo you upload.</li>
        <li>
          Tile images, sourced one of three ways: files you upload yourself, a search topic you
          type in ("auto-fetch by topic"), or a Google Drive folder link you provide.
        </li>
        <li>The grid settings (columns, tile size) you choose.</li>
        <li>
          If you explicitly request a shareable link: the finished mosaic image, so it can be
          served at that link.
        </li>
      </ul>

      <h2>What we don't do</h2>
      <ul>
        <li>We do not require an account, and we do not collect names, emails, or payment details.</li>
        <li>We do not run analytics or advertising trackers on this site.</li>
        <li>We do not sell or use your images for anything other than generating (and, if you ask, sharing) the mosaic you requested.</li>
        <li>We never send your source photo, or any tile images you upload yourself, to any third party.</li>
      </ul>

      <h2>Auto-fetch by topic (Pexels)</h2>
      <p>
        If you choose "auto-fetch by topic" instead of uploading your own tiles, the search topic
        you type is sent from our server to the{" "}
        <a href="https://www.pexels.com/api/" target="_blank" rel="noreferrer">Pexels API</a> to
        find matching photos, which are then downloaded by our server and used as tiles the same
        way uploaded tiles are — held only for the duration of your request and discarded once the
        mosaic is returned. Only the topic text is sent to Pexels; your source photo and IP-derived
        location are not shared with Pexels. Fetched tile images may be kept in a short-lived
        in-memory cache (up to 10 minutes) so identical searches don't need to hit the Pexels API
        again; this cache is never written to disk and clears on restart. Pexels' own handling of
        the request (e.g. their server logs) is governed by their{" "}
        <a href="https://www.pexels.com/privacy-policy/" target="_blank" rel="noreferrer">
          privacy policy
        </a>
        , which we don't control. This mode is entirely optional.
      </p>

      <h2>Tiles from a Google Drive folder</h2>
      <p>
        If you choose "from Drive folder," the folder link or ID you provide is sent from our
        server to the Google Drive API to list and download the image files it contains — this
        only works for folders shared as "Anyone with the link"; we have no way to access a
        private folder, and never ask you to sign in with a Google account. Downloaded images are
        used as tiles the same way uploaded tiles are — held only for the duration of your
        request, plus the same short-lived in-memory cache described above for identical folder
        requests. Only the folder link/ID is sent to Google; your source photo is not. Google's
        own handling of that request is governed by their{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          privacy policy
        </a>
        , which we don't control. You're responsible for only pointing Mosaic at folders you have
        the right to use this way — see the{" "}
        <a href="/terms">Terms of Service</a>.
      </p>

      <h2>Shareable links</h2>
      <p>
        Generating a mosaic never saves anything by default. If you explicitly check "get a
        shareable link," the <em>finished mosaic image only</em> — never your source photo, never
        your tile images or the topic/folder used to source them — is saved to disk on our server
        under a random, unguessable URL (<code>/m/&lt;id&gt;</code>). Anyone with that exact URL
        can view or download that image; it is not otherwise listed, indexed, or discoverable
        (search engines are asked not to crawl or index it). It's automatically deleted 14 days
        after it was last viewed — viewing it again resets that 14-day clock, so an actively-shared
        link stays alive, but an abandoned one eventually expires. There's no way for us to
        associate a shared mosaic with who generated it after the fact.
      </p>

      <h2>How long we keep your images</h2>
      <p>
        Your source photo and tile images (uploaded, Pexels-fetched, or Drive-fetched) are held in
        server memory only for the duration of a single generation request and discarded once the
        resulting mosaic PNG is sent back to your browser — not written to disk, a database, or
        any persistent storage — except for the brief in-memory tile cache described above. The
        <strong> only</strong> thing we ever write to disk is a finished mosaic image, and only
        when you explicitly request a shareable link for it (see above).
      </p>

      <h2>Server logs</h2>
      <p>
        Like most web services, our infrastructure (reverse proxy / hosting) keeps standard,
        short-lived access logs (IP address, timestamp, requested path, response status) for
        operational purposes and to detect abuse of the public API endpoint. These logs do not
        contain the contents of your uploaded images. A rate limiter tracks how many requests an
        IP address has made in the last few minutes; that counter is kept in memory only and
        resets whenever the service restarts.
      </p>

      <h2>Cookies</h2>
      <p>Mosaic does not set any cookies.</p>

      <h2>Children's privacy</h2>
      <p>
        Mosaic is not directed at children and we do not knowingly collect personal information
        from children.
      </p>

      <h2>Your rights</h2>
      <p>
        Because we don't retain uploaded images or account data (beyond an explicitly-requested
        shareable mosaic, per above), there is generally nothing else stored to access, export, or
        delete. If you'd like a shared mosaic removed before its 14-day window lapses, or have
        questions, contact us using the details below.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes — for example, if a future version adds another third-party image
        source, or a way to save a tile library between visits — we'll update this page and the
        "last updated" date above before that feature goes live.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href="mailto:jacobprestonharris@gmail.com">jacobprestonharris@gmail.com</a>.
      </p>
    </article>
  );
}
