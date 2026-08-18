// Central place for tunables, all overridable via env vars (see .env.example).
function intEnv(name, fallback) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://mosaic.hackatoa.com",

  // Upload limits
  maxSourceBytes: intEnv("MOSAIC_MAX_SOURCE_MB", 10) * 1024 * 1024,
  maxTileBytes: intEnv("MOSAIC_MAX_TILE_MB", 5) * 1024 * 1024,
  maxTiles: intEnv("MOSAIC_MAX_TILES", 120),
  minTiles: intEnv("MOSAIC_MIN_TILES", 3),

  // Default tile count when auto-fetching from Pexels (clamped to
  // [minTiles, maxTiles] same as uploaded tiles).
  defaultTopicTiles: intEnv("MOSAIC_DEFAULT_TOPIC_TILES", 40),
  // Same, for a public Google Drive folder.
  defaultDriveTiles: intEnv("MOSAIC_DEFAULT_DRIVE_TILES", 40),

  // Shareable results (opt-in `share=true` on /api/generate).
  resultsDir: process.env.MOSAIC_RESULTS_DIR || "/data/results",
  shareRetentionDays: intEnv("MOSAIC_SHARE_RETENTION_DAYS", 14),
  // Refuse to persist a new share if free disk space drops below this, so a
  // burst of shares can never take the whole container/host down.
  minFreeDiskBytes: intEnv("MOSAIC_MIN_FREE_DISK_MB", 500) * 1024 * 1024,

  // Grid / output bounds (server-side clamps, independent of what the UI sends)
  minCols: 5,
  maxCols: 150,
  minTileSize: 6,
  maxTileSize: 64,
  // Hard cap on total output pixels (cols*tileSize x rows*tileSize) to bound
  // memory/CPU per request on a single small container.
  maxOutputPixels: 4000 * 4000,
  // Hard cap on total grid cells (cols*rows) — this is what drives the cost
  // of the sharp .composite() call, independent of tileSize.
  maxCells: 9000,

  // Simple in-memory per-IP rate limit for the public endpoint.
  rateLimitMax: intEnv("MOSAIC_RATE_LIMIT_MAX", 12),
  rateLimitWindowMs: intEnv("MOSAIC_RATE_LIMIT_WINDOW_MS", 10 * 60 * 1000),

  // Cap concurrent generations so one busy request doesn't starve the others
  // on a single-container deploy.
  maxConcurrentJobs: 3,
};
