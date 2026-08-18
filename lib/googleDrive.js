// Fetches tile images from a *publicly link-shared* Google Drive folder
// ("Anyone with the link" viewer access), using a plain Google API key —
// no OAuth/sign-in flow. This only works for folders shared that way; a
// private folder returns a 403/404 from the Drive API, which we surface as
// a clear error rather than trying to work around it.
import { config } from "./config.js";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DOWNLOAD_CONCURRENCY = 6;

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 30;
const cache = new Map(); // key -> { buffers, expiresAt }

export class DriveError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function isDriveConfigured() {
  return Boolean(process.env.GOOGLE_DRIVE_API_KEY);
}

/** Accepts a full Drive folder URL or a bare folder ID and returns the ID. */
export function parseFolderId(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;
  const m = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // Also accept ?id=<id> style links, or a bare ID typed directly.
  const qm = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (qm) return qm[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

function cacheKey(folderId, count) {
  return `${folderId}|${count}`;
}

async function downloadFile(fileId, apiKey) {
  const url = `${DRIVE_FILES_URL}/${fileId}?alt=media&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new DriveError(`Failed to download a file from Drive (${res.status}).`, 502);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * @param {string} folderInput  Drive folder URL or bare ID
 * @param {number} count
 * @returns {Promise<{ buffers: Buffer[], cached: boolean }>}
 */
export async function fetchDriveFolderTiles(folderInput, count) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    throw new DriveError(
      "Google Drive tile fetch isn't configured on this server (missing GOOGLE_DRIVE_API_KEY).",
      501
    );
  }

  const folderId = parseFolderId(folderInput);
  if (!folderId) {
    throw new DriveError(
      "Couldn't parse a Drive folder ID from that input. Paste the full folder share link.",
      400
    );
  }

  const key = cacheKey(folderId, count);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { buffers: cached.buffers, cached: true };
  }

  const listUrl = new URL(DRIVE_FILES_URL);
  listUrl.searchParams.set(
    "q",
    `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`
  );
  listUrl.searchParams.set("key", apiKey);
  listUrl.searchParams.set("fields", "files(id,name,mimeType)");
  listUrl.searchParams.set("pageSize", String(Math.min(1000, Math.max(1, count))));

  let res;
  try {
    res = await fetch(listUrl);
  } catch {
    throw new DriveError("Could not reach the Google Drive API.", 502);
  }

  if (res.status === 404 || res.status === 403) {
    throw new DriveError(
      "Couldn't read that folder — make sure it's shared as \"Anyone with the link\" (Viewer).",
      400
    );
  }
  if (!res.ok) {
    throw new DriveError(`Google Drive API error (${res.status}).`, 502);
  }

  const data = await res.json();
  const files = (data.files || []).slice(0, count);
  if (files.length < config.minTiles) {
    throw new DriveError(
      `That folder only has ${files.length} image(s) visible — need at least ${config.minTiles}. ` +
        `Make sure the folder is shared publicly and contains image files directly (not in subfolders).`,
      400
    );
  }

  const buffers = new Array(files.length);
  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const idx = cursor++;
      buffers[idx] = await downloadFile(files[idx].id, apiKey);
    }
  }
  await Promise.all(Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, files.length) }, worker));

  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { buffers, expiresAt: Date.now() + CACHE_TTL_MS });

  return { buffers, cached: false };
}
