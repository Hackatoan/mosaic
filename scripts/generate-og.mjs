// One-off script that procedurally builds public/og.svg (a little mosaic
// grid) and rasterizes it to public/og.png (1200x630) for the Open Graph /
// Twitter card image. Run with: node scripts/generate-og.mjs
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, "..", "public", "og.svg");
const pngPath = path.join(__dirname, "..", "public", "og.png");

const W = 1200;
const H = 630;
const CELL = 30;
const PALETTE = ["#0b0d12", "#12151c", "#1f7a6c", "#146b5e", "#5eead4", "#0e9488"];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const rand = seededRandom(42);

let cells = "";
for (let y = 0; y < H; y += CELL) {
  for (let x = 0; x < W; x += CELL) {
    const color = PALETTE[Math.floor(rand() * PALETTE.length)];
    const pad = rand() < 0.15 ? 3 : 1;
    cells += `<rect x="${x + pad}" y="${y + pad}" width="${CELL - pad * 2}" height="${CELL - pad * 2}" fill="${color}"/>`;
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0b0d12"/>
  <g opacity="0.9">${cells}</g>
  <rect width="${W}" height="${H}" fill="#0b0d12" opacity="0.55"/>
  <text x="${W / 2}" y="${H / 2 - 20}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="88" font-weight="700" fill="#f4fffb">Mosaic</text>
  <text x="${W / 2}" y="${H / 2 + 45}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="30" fill="#9aa0ad">Turn any photo into a photomosaic</text>
</svg>
`;

await writeFile(svgPath, svg);
const png = await sharp(Buffer.from(svg)).resize(W, H).png().toBuffer();
await writeFile(pngPath, png);
console.log(`Wrote ${svgPath} and ${pngPath} (${png.length} bytes)`);
