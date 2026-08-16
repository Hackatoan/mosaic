import { config } from "./config.js";

// Per-instance, in-memory sliding-window counter keyed by client IP.
// Resets on restart; not shared across replicas. Good enough for a single
// homelab container behind Watchtower — if this ever needs to scale
// horizontally, swap for a Redis-backed limiter.
const hits = new Map(); // ip -> number[] (timestamps, ms)

export function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - config.rateLimitWindowMs;
  const arr = (hits.get(ip) || []).filter((t) => t > windowStart);

  if (arr.length >= config.rateLimitMax) {
    hits.set(ip, arr);
    const retryAfterMs = arr[0] + config.rateLimitWindowMs - now;
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  arr.push(now);
  hits.set(ip, arr);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => t > windowStart);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }

  return { allowed: true };
}

// Simple counting semaphore so at most N generations run at once on this
// container — image compositing is CPU/memory heavy and this is a small box.
let inFlight = 0;

export function tryAcquireJobSlot() {
  if (inFlight >= config.maxConcurrentJobs) return false;
  inFlight++;
  return true;
}

export function releaseJobSlot() {
  inFlight = Math.max(0, inFlight - 1);
}

export function clientIp(request) {
  // Behind NPMplus; trust the standard forwarded header, fall back to a
  // constant so local/dev requests still work against the rate limiter.
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
