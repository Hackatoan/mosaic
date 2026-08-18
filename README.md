[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/hackatoa)

# Mosaic

Free photomosaic generator. Upload a source photo and a set of tile images —
Mosaic measures the average color of each region of the source photo and
rebuilds that region out of the closest-matching tile image. Live at
[mosaic.hackatoa.com](https://mosaic.hackatoa.com).

Next.js app pre-wired for auto-deployment via GitHub Actions + Watchtower,
same pattern as the rest of the hackatoa.com fleet.

**Flow:** push to main → GitHub Actions builds Docker image → pushes to GHCR
→ Watchtower pulls and restarts the container automatically (~5 min lag).

## How it works

1. `lib/mosaic.js` downsamples the source image to a `cols x rows` grid using
   sharp's resize kernel — each resulting pixel is effectively the average
   color of the region it was downsampled from.
2. Every tile image is reduced to a single average RGB color (resize to 1×1)
   and, separately, a square thumbnail at the target cell size.
3. Each grid cell is matched to the tile with the closest average color
   (squared Euclidean distance in RGB).
4. All matched tile thumbnails are composited onto a blank canvas and
   encoded as PNG.

No database — uploads are held in memory only for the duration of a single
request and discarded once the mosaic is returned. The one exception is
opt-in shareable links (see below), which persist only the finished mosaic
image to a small disk volume. See [`/privacy`](app/privacy/page.js) for the
full policy.

## Public API

```
POST /api/generate
Content-Type: multipart/form-data

  source          file            required — the source image
  cols            number          optional, default 40   (5–150)
  tileSize        number          optional, default 24px  (6–64)
  share           boolean         optional, default false — persist the result, return a share URL

  # tile source: use exactly ONE of the three options below
  tiles           file (repeat)   3–120 tile images you supply
  topic           string          search topic — auto-fetches tiles from Pexels
  tileCount       number          optional, default 40 (3–120) — only with 'topic'
  driveFolder     string          public Drive folder URL/ID — fetches tiles from it
  driveTileCount  number          optional, default 40 (3–120) — only with 'driveFolder'

→ 200 image/png (the generated mosaic)
  Headers: X-Mosaic-Grid: <cols>x<rows>, X-Mosaic-Tile-Size: <px>,
           X-Mosaic-Tile-Credit: <URI-encoded credit line> (topic mode only),
           X-Mosaic-Share-Url: <url> (only when share=true and it succeeded)
```

`GET /api/generate` returns the same spec as JSON (self-documenting,
including `pexelsAvailable` / `driveAvailable` booleans). The endpoint is
CORS-open (`Access-Control-Allow-Origin: *`) and rate-limited per-IP
(`MOSAIC_RATE_LIMIT_MAX` requests / `MOSAIC_RATE_LIMIT_WINDOW_MS`, defaults
12 / 10 min) plus capped to a few concurrent generations at a time — see
`lib/config.js` and `.env.example` for every tunable.

## Tile sources

Three modes, all usable from the UI or the API directly:

- **Upload your own** — supply 3–120 tile images per generation. Always
  available, no API key needed.
- **Auto-fetch by topic** — type a topic (e.g. "autumn leaves") and Mosaic
  pulls matching tiles from the [Pexels API](https://www.pexels.com/api/)
  (free tier, permissive license, no attribution required — see
  `lib/pexels.js`). Requires `PEXELS_API_KEY`; if unset, this mode is hidden
  in the UI and the API returns a clear "not configured" error.
- **From a Google Drive folder** — paste a folder link shared as "Anyone
  with the link" and Mosaic pulls its images as tiles (see
  `lib/googleDrive.js`). Uses a plain Google API key, no OAuth/sign-in flow —
  it literally cannot access a private folder. Requires
  `GOOGLE_DRIVE_API_KEY`; if unset, this mode is hidden in the UI.

Scraping an image search engine (Google/Bing image results, etc.) instead of
using a licensed/authorized API was deliberately avoided — see `/privacy`
for why.

## Shareable links

Opt-in only (`share=true` / the checkbox in the UI). When requested, the
*finished mosaic PNG only* — never the source photo or tile images/topic/
folder used to build it — is written to `MOSAIC_RESULTS_DIR`
(`/data/results` in the container, bind-mounted to `./data/results` on the
host) under a random UUID, served at `/m/<id>`. Retention is
**`MOSAIC_SHARE_RETENTION_DAYS` (default 14) days since last viewed** — every
real view (`app/api/m/[id]/route.js`, `Cache-Control: no-store` so it can't
be served from a cache instead) bumps the file's mtime, and an hourly sweep
(`instrumentation.js` → `lib/results.js`'s `cleanupExpiredResults`) deletes
anything past the window. A new share is silently declined (not an error —
the mosaic still generates and returns normally, just without a link) if
free disk space drops below `MOSAIC_MIN_FREE_DISK_MB` (default 500MB), so a
burst of shares can never fill the host's disk. `/m/<id>` pages are
`noindex` and disallowed in `robots.txt` — shareable, not searchable.

## Local development

```bash
npm install
npm run dev
```

Regenerate the OG image (`public/og.svg` / `public/og.png`) after changing
its script:

```bash
node scripts/generate-og.mjs
```

## How Watchtower works

Watchtower runs on the Docker host and polls GHCR every 5 minutes. Any
container with the label `com.centurylinklabs.watchtower.enable=true` is
automatically updated when a new image is pushed. No webhooks, no secrets,
no deploy agent needed.

## Deploy checklist (first time only)

- [ ] On the server: `mkdir -p /opt/apps/mosaic/data/results && cd /opt/apps/mosaic`
      (the `data/results` dir backs shareable links — must exist before
      `docker compose up` for the bind mount to work as a directory, not a
      file)
- [ ] Copy `docker-compose.yml` there (already points at
      `ghcr.io/hackatoan/mosaic:latest`, port `3012:3000`)
- [ ] (Optional) create a `.env` file in the same directory with
      `PEXELS_API_KEY=your-key` and/or `GOOGLE_DRIVE_API_KEY=your-key` to
      enable those tile-source modes — free keys at
      https://www.pexels.com/api/ and the Google Cloud Console (enable the
      Drive API). Skip either/both to ship with fewer tile-source modes;
      upload-your-own always works.
- [ ] `docker compose up -d`
- [ ] Add an NPMplus proxy host for `mosaic.hackatoa.com` → `localhost:3012`
- [ ] Add a `hackatoa.com` DNS record in Pi-hole if not covered by the
      wildcard
- [ ] Push to main — Watchtower handles all future deploys automatically

## No secrets needed

The deploy workflow uses `GITHUB_TOKEN` (auto-provided by Actions) to push to
GHCR. No additional secrets required.

---

[hackatoa.com](https://hackatoa.com) · [GitHub](https://github.com/Hackatoan) · [Buy Me A Coffee](https://buymeacoffee.com/hackatoa)
