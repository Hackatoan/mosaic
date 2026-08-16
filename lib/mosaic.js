import sharp from "sharp";
import { config } from "./config.js";

/**
 * Photomosaic generator.
 *
 * Approach:
 *  1. Downsample the source image to a cols x rows grid using sharp's resize
 *     kernel — each resulting pixel is effectively the average color of the
 *     region it was downsampled from, so we get per-cell average colors for
 *     free instead of manually summing pixels per region.
 *  2. Reduce every tile image to a single average RGB color (resize to 1x1)
 *     and, separately, a square thumbnail at the target cell size (resize
 *     with fit "cover" so tiles of any aspect ratio fill their cell cleanly).
 *  3. For each grid cell, pick the tile whose average color is closest
 *     (squared Euclidean distance in RGB) to that cell's color.
 *  4. Composite all the chosen tile thumbnails onto a blank canvas at their
 *     grid position and encode as PNG.
 */

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

async function averageColor(buffer) {
  const { data } = await sharp(buffer)
    .rotate()
    .resize(1, 1, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return [data[0], data[1], data[2]];
}

async function tileThumbnail(buffer, size) {
  return sharp(buffer)
    .rotate()
    .resize(size, size, { fit: "cover", position: "attention" })
    .removeAlpha()
    .png()
    .toBuffer();
}

/**
 * @param {Buffer} sourceBuffer
 * @param {Buffer[]} tileBuffers
 * @param {{ cols: number, tileSize: number }} opts
 * @returns {Promise<{ png: Buffer, cols: number, rows: number, tileSize: number }>}
 */
export async function generateMosaic(sourceBuffer, tileBuffers, opts) {
  if (!Array.isArray(tileBuffers) || tileBuffers.length < config.minTiles) {
    throw new MosaicError(
      `Need at least ${config.minTiles} tile images (got ${tileBuffers?.length ?? 0}).`
    );
  }

  let cols = clamp(Math.round(opts.cols) || 40, config.minCols, config.maxCols);
  let tileSize = clamp(
    Math.round(opts.tileSize) || 24,
    config.minTileSize,
    config.maxTileSize
  );

  const srcMeta = await sharp(sourceBuffer).rotate().metadata();
  if (!srcMeta.width || !srcMeta.height) {
    throw new MosaicError("Could not read source image dimensions.");
  }

  let rows = Math.max(1, Math.round((cols * srcMeta.height) / srcMeta.width));

  // Shrink cols/rows proportionally to respect two independent caps:
  //  - total output pixels (memory for the final canvas)
  //  - total grid cells (cost of the sharp .composite() call itself, which
  //    scales with cell count regardless of tileSize)
  const outPixels = cols * tileSize * rows * tileSize;
  const cellCount = cols * rows;
  const pixelScale = Math.sqrt(Math.min(1, config.maxOutputPixels / outPixels));
  const cellScale = Math.sqrt(Math.min(1, config.maxCells / cellCount));
  const scale = Math.min(pixelScale, cellScale);
  if (scale < 1) {
    cols = Math.max(config.minCols, Math.floor(cols * scale));
    rows = Math.max(1, Math.floor(rows * scale));
  }

  // Step 1: per-cell average colors of the source image via downsampling.
  const { data: gridPixels, info } = await sharp(sourceBuffer)
    .rotate()
    .resize(cols, rows, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels; // 3 (RGB) after removeAlpha

  // Step 2: precompute tile average colors + square thumbnails.
  const tiles = await Promise.all(
    tileBuffers.map(async (buf) => {
      const [color, thumb] = await Promise.all([
        averageColor(buf),
        tileThumbnail(buf, tileSize),
      ]);
      return { color, thumb };
    })
  );

  // Step 3: match + build composite list.
  const composites = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) * channels;
      const r = gridPixels[idx];
      const g = gridPixels[idx + 1];
      const b = gridPixels[idx + 2];

      let best = 0;
      let bestDist = Infinity;
      for (let t = 0; t < tiles.length; t++) {
        const [tr, tg, tb] = tiles[t].color;
        const dr = tr - r;
        const dg = tg - g;
        const db = tb - b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          best = t;
          if (dist === 0) break;
        }
      }

      composites.push({
        input: tiles[best].thumb,
        left: col * tileSize,
        top: row * tileSize,
      });
    }
  }

  // Step 4: composite onto a blank canvas.
  const png = await sharp({
    create: {
      width: cols * tileSize,
      height: rows * tileSize,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return { png, cols, rows, tileSize };
}

export class MosaicError extends Error {}
