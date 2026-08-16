export const metadata = {
  title: "Privacy Policy",
  description: "How Mosaic handles the images you upload.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="policy">
      <h1>Privacy Policy</h1>
      <p>Last updated: August 16, 2026</p>

      <p>
        Mosaic ("we", "the service") is a small, self-hosted tool that turns a photo into a
        photomosaic built from tile images you supply. This page explains what happens to the
        images and data you send us.
      </p>

      <h2>What we process</h2>
      <ul>
        <li>The source photo you upload.</li>
        <li>
          Either the tile images you upload, <em>or</em> — if you use the "auto-fetch by topic"
          option — the search topic you type in.
        </li>
        <li>The grid settings (columns, tile size) you choose.</li>
      </ul>

      <h2>What we don't do</h2>
      <ul>
        <li>We do not require an account, and we do not collect names, emails, or payment details.</li>
        <li>We do not run analytics or advertising trackers on this site.</li>
        <li>We do not sell, share, or use your uploaded images for anything other than generating the mosaic you requested.</li>
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
        , which we don't control. This mode is entirely optional — you can always upload your own
        tile images instead and nothing leaves our server.
      </p>

      <h2>How long we keep your images</h2>
      <p>
        Your source photo and tile images (uploaded or Pexels-fetched) are held in server memory
        only for the duration of a single generation request. Once the resulting mosaic PNG is
        sent back to your browser, they are discarded — not written to disk, a database, or any
        persistent storage — except for the brief Pexels tile cache described above.
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
        Because we don't retain uploaded images or account data after your request completes,
        there is generally nothing stored to access, export, or delete. If you have questions or
        believe something was retained in error, contact us using the details below.
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
