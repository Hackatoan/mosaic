import { readResult } from "../../../../lib/results.js";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { id } = await params;
  const buf = await readResult(id); // also renews the 14-day-since-last-viewed TTL

  if (!buf) {
    return new Response("Not found — this shared mosaic may have expired.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      // Must not be cached by intermediaries — every real view needs to hit
      // this route so the last-viewed TTL actually renews.
      "Cache-Control": "no-store",
    },
  });
}
