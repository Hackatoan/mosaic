#!/usr/bin/env node
// Translates app/dictionaries/en.json into each locale via Gemini, preserving
// the exact JSON structure (nested legal "blocks" arrays included) — only string
// leaves are translated, positionally. Inline HTML (<a>/<code>/<strong>/<em>),
// {params}, emoji and brand/technical terms are kept verbatim.
//   Usage: GEMINI_API_KEY=... node scripts/i18n-translate.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DICT = join(ROOT, "app/dictionaries");
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("GEMINI_API_KEY not set"); process.exit(1); }
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const LOCALES = ["es", "pt-br", "fr", "de", "vi", "th"];
const LANGNAME = { es: "Spanish", "pt-br": "Brazilian Portuguese", fr: "French", de: "German", vi: "Vietnamese", th: "Thai" };
const KEEP = ["Mosaic", "Pexels", "Google Drive", "Google", "Drive", "GitHub", "Hackatoa", "PNG", "API", "URL", "IP", "id", "Viewer"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const en = JSON.parse(readFileSync(join(DICT, "en.json"), "utf8"));

// Collect string leaves in deterministic order.
function collect(node, out) {
  if (typeof node === "string") { out.push(node); return; }
  if (Array.isArray(node)) { for (const v of node) collect(v, out); return; }
  if (node && typeof node === "object") { for (const k of Object.keys(node)) collect(node[k], out); }
}
// Rebuild a same-shaped object, pulling translations from `it` (iterator index).
function rebuild(node, tr, idx) {
  if (typeof node === "string") return tr[idx.i++];
  if (Array.isArray(node)) return node.map((v) => rebuild(v, tr, idx));
  if (node && typeof node === "object") {
    const o = {};
    for (const k of Object.keys(node)) o[k] = rebuild(node[k], tr, idx);
    return o;
  }
  return node;
}

async function translateBatch(strings, langName, code) {
  if (!strings.length) return [];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const prompt = `Translate each string in this JSON array from English into ${langName} (locale "${code}").
Return ONLY a JSON array of the same length and order — exactly one translation per input string.
Rules:
- Natural, idiomatic for native speakers. Context: a free photomosaic-generator web app + its privacy/terms pages. Keep legal prose precise.
- Preserve leading/trailing whitespace of each string.
- Keep EXACTLY, untranslated: any HTML tags and their attributes (<a href="...">, </a>, <code>, <strong>, <em>, <br>), HTML entities (&lt; &gt; &amp; &nbsp;), {param} placeholder tokens, emoji, symbols (× — · …), URLs, email addresses, and code tokens like POST /api/generate, multipart/form-data, /m/<id>, share=true.
- Do NOT translate brand/technical names: ${KEEP.join(", ")}. ("Anyone with the link" is a Google Drive UI label — translate it to that product's official wording in the target language if known, else keep English.)
- If a string is only a number/symbol/URL/token, return it unchanged.
Input:
${JSON.stringify(strings)}`;
  for (let a = 1; a <= 6; a++) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: "application/json" } }) });
    const data = await res.json().catch(() => ({}));
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (txt) { try { const arr = JSON.parse(txt); if (Array.isArray(arr) && arr.length === strings.length) return arr; } catch {} }
    const s = data?.error?.status || res.status;
    console.warn(`    batch retry ${a} (${s})`);
    await sleep(s === "RESOURCE_EXHAUSTED" ? 20000 : 2000 * a);
  }
  throw new Error("translateBatch failed");
}

const all = [];
collect(en, all);
console.log(`Source: ${all.length} strings.`);

for (const loc of LOCALES) {
  const tr = [];
  for (let i = 0; i < all.length; i += 10) {
    const part = await translateBatch(all.slice(i, i + 10), LANGNAME[loc], loc);
    tr.push(...part);
  }
  const out = rebuild(en, tr, { i: 0 });
  writeFileSync(join(DICT, `${loc}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log(`${loc.padEnd(5)} -> ${loc}.json`);
  await sleep(1000);
}
console.log("Done.");
