// Opt-in persistence for shareable mosaic results. A generated PNG is only
// ever written here when the caller explicitly asks for a share link
// (`share=true` on /api/generate) — everything else in this app (source
// photos, tile images, non-shared results) stays fully in-memory and is
// never written to disk. See app/privacy/page.js for the user-facing
// version of this.
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";

const ID_RE = /^[a-f0-9-]{36}$/; // crypto.randomUUID() shape

function isValidId(id) {
  return typeof id === "string" && ID_RE.test(id);
}

function resultPath(id) {
  if (!isValidId(id)) return null;
  // isValidId already restricts to a fixed charset with no path separators,
  // but resolve-and-check anyway as a second layer against traversal.
  const p = path.join(config.resultsDir, `${id}.png`);
  if (path.dirname(p) !== path.resolve(config.resultsDir)) return null;
  return p;
}

async function ensureDir() {
  await fs.mkdir(config.resultsDir, { recursive: true });
}

async function hasFreeDiskSpace() {
  try {
    const stats = await fs.statfs(config.resultsDir);
    return stats.bavail * stats.bsize >= config.minFreeDiskBytes;
  } catch {
    // statfs unsupported or dir missing — fail open rather than blocking the
    // whole feature over a platform quirk; ensureDir() below still runs.
    return true;
  }
}

/** @returns {Promise<string|null>} the new result's ID, or null if declined (low disk space) */
export async function saveResult(pngBuffer) {
  await ensureDir();
  if (!(await hasFreeDiskSpace())) return null;

  const id = randomUUID();
  const p = resultPath(id);
  await fs.writeFile(p, pngBuffer);
  return id;
}

/** Lightweight existence check, doesn't renew the TTL (use readResult for that). */
export async function resultExists(id) {
  const p = resultPath(id);
  if (!p) return false;
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Reads a shared result and renews its retention clock (last-viewed based TTL). */
export async function readResult(id) {
  const p = resultPath(id);
  if (!p) return null;
  try {
    const buf = await fs.readFile(p);
    const now = new Date();
    fs.utimes(p, now, now).catch(() => {}); // renew TTL, don't block the response on it
    return buf;
  } catch {
    return null;
  }
}

/** Deletes results whose mtime (last-viewed, see readResult) is past the retention window. */
export async function cleanupExpiredResults() {
  await ensureDir();
  const cutoff = Date.now() - config.shareRetentionDays * 24 * 60 * 60 * 1000;
  let entries;
  try {
    entries = await fs.readdir(config.resultsDir);
  } catch {
    return { checked: 0, deleted: 0 };
  }

  let checked = 0;
  let deleted = 0;
  for (const name of entries) {
    if (!name.endsWith(".png")) continue;
    checked++;
    const p = path.join(config.resultsDir, name);
    try {
      const stat = await fs.stat(p);
      if (stat.mtimeMs < cutoff) {
        await fs.unlink(p);
        deleted++;
      }
    } catch {
      // file removed concurrently or unreadable — skip
    }
  }
  return { checked, deleted };
}
