export const metadata = {
  title: "Terms of Service",
  description: "Terms for using Mosaic, the photomosaic generator.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="policy">
      <h1>Terms of Service</h1>
      <p>Last updated: August 18, 2026</p>

      <p>
        These terms govern your use of Mosaic, a free tool that generates a photomosaic from a
        source photo and tile images. By using Mosaic, you agree to these terms.
      </p>

      <h2>What Mosaic does</h2>
      <p>
        You supply a source photo and a set of tile images — uploaded directly, auto-fetched from
        Pexels by topic, or pulled from a Google Drive folder you link. Mosaic analyzes the
        average color of regions of your source photo, matches each region to the closest-colored
        tile image, and composites the result into a single generated image, which is returned to
        you. Mosaic also exposes this functionality as a public API endpoint
        (<code>POST /api/generate</code>), and can optionally generate a public link for a result
        (see "Shareable links" below).
      </p>

      <h2>Your content</h2>
      <ul>
        <li>
          You must own the rights to, or otherwise have permission to use and publicly share, every
          image involved — whether you upload it directly, or point Mosaic at it via a Google
          Drive folder link. Pointing Mosaic at a Drive folder is treated the same as uploading its
          contents yourself for the purposes of these terms.
        </li>
        <li>
          You retain whatever rights you already had in the images you supply. We claim no
          ownership over them or the mosaic generated from them.
        </li>
        <li>
          Mosaic does not review content before processing it. You are solely responsible for what
          you supply and for the resulting generated image.
        </li>
      </ul>

      <h2>Auto-fetched tiles (Pexels)</h2>
      <p>
        If you use the "auto-fetch by topic" option, the tile photos used in your mosaic are
        sourced from <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>{" "}
        and are licensed to you under the{" "}
        <a href="https://www.pexels.com/license/" target="_blank" rel="noreferrer">Pexels License</a>.
        In short: free to use and modify, no attribution legally required, but you may not resell
        or redistribute an unaltered copy of a Pexels photo on its own, imply that people or brands
        shown in a photo endorse you without their permission, or use Pexels content in a way that
        competes with Pexels. The generated mosaic — a substantial transformation combining many
        such tiles — is yours to use, but the underlying tile photos remain subject to that
        license. We display a non-mandatory photographer/Pexels credit line alongside results
        generated this way as a courtesy.
      </p>

      <h2>Tiles from a Google Drive folder</h2>
      <p>
        If you use the "from Drive folder" option, you're representing that you have the right to
        use every image in that folder this way. This only works for folders you've shared as
        "Anyone with the link" — by using this feature, you're the one choosing to make that
        folder's contents accessible to Mosaic, and you're responsible for what you put in a
        folder you point us at.
      </p>

      <h2>Shareable links</h2>
      <p>
        Generating a mosaic never creates a public link unless you explicitly ask for one. If you
        do, the finished mosaic image is stored on our server and made accessible to anyone who
        has that link — treat it like sharing an unlisted photo, not a private one. Links expire
        automatically 14 days after the mosaic was last viewed. Don't request a shareable link for
        a mosaic built from content you don't have the right to make publicly accessible; the
        acceptable-use restrictions below apply to shared results the same as everything else.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to use Mosaic to upload, generate, or attempt to generate images that:</p>
      <ul>
        <li>Depict child sexual abuse material, or sexual content involving minors in any form.</li>
        <li>Infringe someone else's copyright, trademark, or other intellectual property rights.</li>
        <li>Are used to harass, defame, threaten, or violate the privacy of another person.</li>
        <li>Violate any applicable law.</li>
      </ul>
      <p>
        You also agree not to abuse the service or its public API — including attempting to bypass
        rate limits, upload limits, or other technical controls, or using automated means to
        overwhelm the service.
      </p>

      <h2>No warranty</h2>
      <p>
        Mosaic is provided "as is" and "as available," without warranties of any kind, express or
        implied. We do not guarantee the service will be uninterrupted, error-free, or available at
        any particular time — this is a small, self-hosted, free tool.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Hackatoa is not liable for any indirect,
        incidental, or consequential damages arising from your use of, or inability to use, Mosaic.
      </p>

      <h2>Changes and availability</h2>
      <p>
        We may change, suspend, or discontinue Mosaic (or any part of it, including the public API)
        at any time, without notice, since it is offered free of charge as a hobby/homelab project.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the State of California, without regard to
        conflict-of-law principles.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:jacobprestonharris@gmail.com">jacobprestonharris@gmail.com</a>.
      </p>
    </article>
  );
}
