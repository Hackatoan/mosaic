// Runs once when the server process starts (Next.js instrumentation hook).
// Used here purely to schedule the shared-results cleanup sweep — nothing
// request-triggered lives in this file.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { cleanupExpiredResults } = await import("./lib/results.js");
  const HOUR_MS = 60 * 60 * 1000;

  async function runCleanup() {
    try {
      const { checked, deleted } = await cleanupExpiredResults();
      if (deleted > 0) {
        console.log(`[mosaic] cleanup: checked ${checked} shared result(s), deleted ${deleted} expired`);
      }
    } catch (err) {
      console.error("[mosaic] cleanup sweep failed:", err);
    }
  }

  // Small delay so it doesn't compete with server startup, then hourly.
  setTimeout(runCleanup, 30_000);
  setInterval(runCleanup, HOUR_MS);
}
