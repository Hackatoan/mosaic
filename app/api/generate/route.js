import { generateMosaic, MosaicError } from "../../../lib/mosaic.js";
import { config } from "../../../lib/config.js";
import { fetchPexelsTiles, isPexelsConfigured, creditHeaderValue, PexelsError } from "../../../lib/pexels.js";
import {
  checkRateLimit,
  tryAcquireJobSlot,
  releaseJobSlot,
  clientIp,
} from "../../../lib/rateLimit.js";

// sharp needs the Node runtime, not edge.
export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...(init.headers || {}) },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return json({
    endpoint: "/api/generate",
    method: "POST",
    contentType: "multipart/form-data",
    description:
      "Generates a photomosaic from a source image using either uploaded tile images, or (if configured) tiles auto-fetched from Pexels for a topic.",
    fields: {
      source: "file (required) — the source image to mosaic-ify",
      cols: `number (optional, default 40, ${config.minCols}-${config.maxCols}) — grid columns`,
      tileSize: `number (optional, default 24px, ${config.minTileSize}-${config.maxTileSize}) — pixel size of each tile cell`,
      tiles: `file[] (repeat the field) — ${config.minTiles}-${config.maxTiles} tile images. Use this OR 'topic', not both.`,
      topic: `string — search topic for auto-fetched Pexels tiles. Use this OR 'tiles', not both.`,
      tileCount: `number (optional, default ${config.defaultTopicTiles}, ${config.minTiles}-${config.maxTiles}) — how many Pexels tiles to fetch when using 'topic'`,
    },
    limits: {
      maxSourceMB: config.maxSourceBytes / 1024 / 1024,
      maxTileMB: config.maxTileBytes / 1024 / 1024,
      rateLimit: `${config.rateLimitMax} requests / ${config.rateLimitWindowMs / 60000} min per IP`,
    },
    pexelsAvailable: isPexelsConfigured(),
    response:
      "image/png (the generated mosaic). Header X-Mosaic-Tile-Credit (URI-encoded) is set when tiles came from Pexels.",
  });
}

export async function POST(request) {
  const ip = clientIp(request);

  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    return json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  const maxBody = config.maxSourceBytes + config.maxTiles * config.maxTileBytes + 2 * 1024 * 1024;
  if (contentLength && contentLength > maxBody) {
    return json({ error: "Request too large." }, { status: 413 });
  }

  if (!tryAcquireJobSlot()) {
    return json(
      { error: "Server is busy generating other mosaics. Try again in a few seconds." },
      { status: 503, headers: { "Retry-After": "5" } }
    );
  }

  try {
    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ error: "Expected multipart/form-data body." }, { status: 400 });
    }

    const sourceFile = form.get("source");
    const tileFiles = form.getAll("tiles").filter((f) => typeof f === "object" && "arrayBuffer" in f);
    const topic = form.get("topic");
    const tileCountRaw = Number(form.get("tileCount"));
    const cols = Number(form.get("cols")) || undefined;
    const tileSize = Number(form.get("tileSize")) || undefined;

    if (!sourceFile || typeof sourceFile === "string") {
      return json({ error: "Missing required 'source' file." }, { status: 400 });
    }
    if (!sourceFile.type?.startsWith("image/")) {
      return json({ error: "'source' must be an image file." }, { status: 400 });
    }
    if (sourceFile.size > config.maxSourceBytes) {
      return json(
        { error: `'source' exceeds ${config.maxSourceBytes / 1024 / 1024}MB limit.` },
        { status: 400 }
      );
    }

    const usingTopic = typeof topic === "string" && topic.trim().length > 0;
    const usingUploadedTiles = tileFiles.length > 0;

    if (usingTopic && usingUploadedTiles) {
      return json({ error: "Provide either 'tiles' files or a 'topic', not both." }, { status: 400 });
    }
    if (!usingTopic && !usingUploadedTiles) {
      return json({ error: "Provide either 'tiles' files or a 'topic'." }, { status: 400 });
    }

    let tileBuffers;
    let creditHeader = "";

    if (usingUploadedTiles) {
      if (tileFiles.length < config.minTiles) {
        return json(
          { error: `Provide at least ${config.minTiles} 'tiles' files (got ${tileFiles.length}).` },
          { status: 400 }
        );
      }
      if (tileFiles.length > config.maxTiles) {
        return json(
          { error: `Too many tile images (max ${config.maxTiles}, got ${tileFiles.length}).` },
          { status: 400 }
        );
      }
      for (const f of tileFiles) {
        if (!f.type?.startsWith("image/")) {
          return json({ error: `Tile '${f.name || "unnamed"}' is not an image file.` }, { status: 400 });
        }
        if (f.size > config.maxTileBytes) {
          return json(
            { error: `Tile '${f.name || "unnamed"}' exceeds ${config.maxTileBytes / 1024 / 1024}MB limit.` },
            { status: 400 }
          );
        }
      }
      tileBuffers = await Promise.all(tileFiles.map(async (f) => Buffer.from(await f.arrayBuffer())));
    } else {
      const tileCount = Math.min(
        config.maxTiles,
        Math.max(config.minTiles, Number.isFinite(tileCountRaw) && tileCountRaw > 0 ? tileCountRaw : config.defaultTopicTiles)
      );
      try {
        const result = await fetchPexelsTiles(topic, tileCount);
        tileBuffers = result.buffers;
        creditHeader = creditHeaderValue(result.attributions);
      } catch (err) {
        if (err instanceof PexelsError) {
          return json({ error: err.message }, { status: err.status || 502 });
        }
        console.error("[mosaic] pexels fetch failed:", err);
        return json({ error: "Failed to fetch tile images from Pexels." }, { status: 502 });
      }
    }

    const sourceBuffer = Buffer.from(await sourceFile.arrayBuffer());

    let result;
    try {
      result = await generateMosaic(sourceBuffer, tileBuffers, { cols, tileSize });
    } catch (err) {
      if (err instanceof MosaicError) {
        return json({ error: err.message }, { status: 400 });
      }
      console.error("[mosaic] generation failed:", err);
      return json({ error: "Failed to decode one of the images." }, { status: 400 });
    }

    const headers = {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="mosaic.png"',
      "X-Mosaic-Grid": `${result.cols}x${result.rows}`,
      "X-Mosaic-Tile-Size": String(result.tileSize),
      ...CORS_HEADERS,
    };
    if (creditHeader) headers["X-Mosaic-Tile-Credit"] = creditHeader;

    return new Response(result.png, { status: 200, headers });
  } finally {
    releaseJobSlot();
  }
}
