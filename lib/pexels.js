// Thin client for the Pexels API (https://www.pexels.com/api/), used only
// for the optional "auto-fetch tiles from a topic" mode. Free tier: 200
// requests/hour, no cost, license permits free use + modification, no
// attribution required (though we show a small credit line anyway).
import { config } from "./config.js";

const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";
const DOWNLOAD_CONCURRENCY = 6;

// Small in-memory cache so repeated identical searches don't re-hit the
// Pexels API (which has its own hourly rate limit) or re-download images.
// Not persisted to disk; cleared on restart.
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 50;
const cache = new Map(); // key -> { buffers, attributions, expiresAt }

export class PexelsError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function isPexelsConfigured() {
  return Boolean(process.env.PEXELS_API_KEY);
}

function cacheKey(topic, count) {
  return `${topic.trim().toLowerCase()}|${count}`;
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new PexelsError(`Failed to download a tile image from Pexels (${res.status}).`, 502);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * @param {string} topic
 * @param {number} count
 * @returns {Promise<{ buffers: Buffer[], attributions: {photographer:string,photographerUrl:string}[], cached: boolean }>}
 */
export async function fetchPexelsTiles(topic, count) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new PexelsError(
      "Auto-fetch isn't configured on this server (missing PEXELS_API_KEY).",
      501
    );
  }
  if (!topic || !topic.trim()) {
    throw new PexelsError("A search topic is required to auto-fetch tiles.", 400);
  }

  const key = cacheKey(topic, count);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { buffers: cached.buffers, attributions: cached.attributions, cached: true };
  }

  const url = new URL(PEXELS_SEARCH_URL);
  url.searchParams.set("query", topic.trim());
  url.searchParams.set("per_page", String(Math.min(80, Math.max(1, count)))); // Pexels caps per_page at 80
  url.searchParams.set("size", "medium");

  let res;
  try {
    res = await fetch(url, { headers: { Authorization: apiKey } });
  } catch {
    throw new PexelsError("Could not reach the Pexels API.", 502);
  }
  if (res.status === 429) {
    throw new PexelsError("Pexels API rate limit reached. Try again later.", 429);
  }
  if (!res.ok) {
    throw new PexelsError(`Pexels search failed (${res.status}).`, 502);
  }

  const data = await res.json();
  const photos = (data.photos || []).slice(0, count);
  if (photos.length < config.minTiles) {
    throw new PexelsError(
      `Pexels only returned ${photos.length} result(s) for "${topic}" — try a broader topic.`,
      400
    );
  }

  const buffers = new Array(photos.length);
  let cursor = 0;
  async function worker() {
    while (cursor < photos.length) {
      const idx = cursor++;
      buffers[idx] = await downloadImage(photos[idx].src.medium);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, photos.length) }, worker)
  );

  const attributions = photos.map((p) => ({
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
  }));

  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { buffers, attributions, expiresAt: Date.now() + CACHE_TTL_MS });

  return { buffers, attributions, cached: false };
}

export function creditHeaderValue(attributions) {
  if (!attributions?.length) return "";
  const names = [...new Set(attributions.map((a) => a.photographer))];
  const shown = names.slice(0, 8);
  const suffix = names.length > shown.length ? ` and ${names.length - shown.length} more` : "";
  const text = `Tile photos by ${shown.join(", ")}${suffix} via Pexels`;
  // HTTP header values must be Latin-1; photographer names can contain
  // arbitrary Unicode, so percent-encode and have the client decode it.
  return encodeURIComponent(text);
}
