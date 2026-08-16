"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_COLS = 40;
const DEFAULT_TILE_SIZE = 24;

export default function MosaicApp() {
  const [apiInfo, setApiInfo] = useState(null);

  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState(null);

  const [tileMode, setTileMode] = useState("upload"); // "upload" | "topic"
  const [tileFiles, setTileFiles] = useState([]);
  const [tilePreviews, setTilePreviews] = useState([]);
  const [topic, setTopic] = useState("");
  const [tileCount, setTileCount] = useState(40);

  const [cols, setCols] = useState(DEFAULT_COLS);
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);

  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState({ state: "idle", message: "" }); // idle | working | error | done
  const [result, setResult] = useState(null); // { url, cols, rows, tileSize, credit }

  const sourceInputRef = useRef(null);
  const tilesInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/generate")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setApiInfo(data);
        setTileCount(extractDefault(data.fields.tileCount) ?? 40);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sourceFile) {
      setSourcePreview(null);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setSourcePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  useEffect(() => {
    const urls = tileFiles.slice(0, 24).map((f) => URL.createObjectURL(f));
    setTilePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [tileFiles]);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const pexelsAvailable = apiInfo?.pexelsAvailable ?? true; // assume yes until we know otherwise
  const minTiles = apiInfo?.fields?.tiles ? extractMin(apiInfo.fields.tiles) : 3;
  const maxTiles = apiInfo?.fields?.tiles ? extractMax(apiInfo.fields.tiles) : 120;

  const handleSourcePick = useCallback((files) => {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) setSourceFile(file);
  }, []);

  const handleTilesPick = useCallback((files) => {
    const imgs = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    setTileFiles((prev) => [...prev, ...imgs]);
  }, []);

  const clearTiles = () => setTileFiles([]);

  const tilesReady = tileMode === "upload" ? tileFiles.length >= minTiles : topic.trim().length > 0;
  const canGenerate = sourceFile && tilesReady && status.state !== "working";

  async function handleGenerate() {
    if (!canGenerate) return;
    setStatus({ state: "working", message: "Matching tiles and compositing…" });
    setResult(null);

    try {
      const form = new FormData();
      form.set("source", sourceFile);
      form.set("cols", String(cols));
      form.set("tileSize", String(tileSize));
      if (tileMode === "upload") {
        tileFiles.forEach((f) => form.append("tiles", f));
      } else {
        form.set("topic", topic.trim());
        form.set("tileCount", String(tileCount));
      }

      const res = await fetch("/api/generate", { method: "POST", body: form });

      if (!res.ok) {
        let message = `Request failed (${res.status}).`;
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // ignore parse failure, keep generic message
        }
        setStatus({ state: "error", message });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const grid = res.headers.get("X-Mosaic-Grid") || "";
      const [gc, gr] = grid.split("x");
      const rawCredit = res.headers.get("X-Mosaic-Tile-Credit");
      const credit = rawCredit ? decodeURIComponent(rawCredit) : null;
      setResult({ url, cols: gc, rows: gr, tileSize: res.headers.get("X-Mosaic-Tile-Size"), credit });
      setStatus({ state: "done", message: "Done." });
    } catch {
      setStatus({ state: "error", message: "Network error — is the server reachable?" });
    }
  }

  return (
    <div>
      <h1>Turn a photo into a photomosaic</h1>
      <p className="subtitle">
        Upload a source photo, then supply tile images — either your own, or auto-fetched from
        Pexels by topic. Mosaic measures the average color of each region of your photo and
        rebuilds it out of the closest-matching tile. Nothing you upload is stored; it's processed
        in memory and discarded once your mosaic comes back.
      </p>

      <section className="card">
        <h2>1. Source photo</h2>
        <Dropzone
          active={dragging === "source"}
          onDragStateChange={(v) => setDragging(v ? "source" : false)}
          onFiles={handleSourcePick}
          inputRef={sourceInputRef}
          accept="image/*"
          multiple={false}
          label={sourceFile ? sourceFile.name : "Drop a photo here, or click to choose one"}
          hint={apiInfo ? `Up to ${apiInfo.limits.maxSourceMB}MB.` : ""}
        />
        {sourcePreview && <img className="source-preview" src={sourcePreview} alt="Source preview" />}
      </section>

      <section className="card">
        <h2>2. Tile images</h2>
        <div className="mode-toggle" role="tablist">
          <button
            type="button"
            className={`mode-btn ${tileMode === "upload" ? "active" : ""}`}
            onClick={() => setTileMode("upload")}
          >
            Upload my own
          </button>
          <button
            type="button"
            className={`mode-btn ${tileMode === "topic" ? "active" : ""}`}
            onClick={() => setTileMode("topic")}
            disabled={!pexelsAvailable}
            title={!pexelsAvailable ? "Auto-fetch isn't configured on this server" : undefined}
          >
            Auto-fetch by topic
          </button>
        </div>

        {tileMode === "upload" ? (
          <>
            <Dropzone
              active={dragging === "tiles"}
              onDragStateChange={(v) => setDragging(v ? "tiles" : false)}
              onFiles={handleTilesPick}
              inputRef={tilesInputRef}
              accept="image/*"
              multiple
              label="Drop tile images here, or click to add more"
              hint={`${minTiles}–${maxTiles} images, up to ${apiInfo?.limits.maxTileMB ?? 5}MB each. More tiles = better color matches.`}
            />
            <p className={`tile-count ${tileFiles.length >= minTiles ? "ok" : ""}`}>
              {tileFiles.length} tile image{tileFiles.length === 1 ? "" : "s"} selected
              {tileFiles.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <button type="button" className="link-btn" onClick={clearTiles} style={linkBtnStyle}>
                    clear
                  </button>
                </>
              )}
            </p>
            {tilePreviews.length > 0 && (
              <div className="preview-strip">
                {tilePreviews.map((u, i) => (
                  <img key={i} src={u} alt="" />
                ))}
                {tileFiles.length > tilePreviews.length && (
                  <span className="tile-count">+{tileFiles.length - tilePreviews.length} more</span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="topic-fields">
            <div className="field">
              <label htmlFor="topic-input">
                <span>Search topic</span>
              </label>
              <input
                id="topic-input"
                type="text"
                className="text-input"
                placeholder="e.g. autumn leaves, city skylines, house cats"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="field">
              <label>
                <span>Tile count</span>
                <span>{tileCount}</span>
              </label>
              <input
                type="range"
                min={minTiles}
                max={maxTiles}
                value={tileCount}
                onChange={(e) => setTileCount(Number(e.target.value))}
              />
            </div>
            <p className="hint">
              Tile photos are pulled from{" "}
              <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
                Pexels
              </a>{" "}
              for your search topic and used only to build this mosaic — see{" "}
              <a href="/privacy">Privacy</a> for details.
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <h2>3. Grid settings</h2>
        <div className="controls-grid">
          <div className="field">
            <label>
              <span>Columns</span>
              <span>{cols}</span>
            </label>
            <input
              type="range"
              min={5}
              max={apiInfo ? extractMax(apiInfo.fields.cols) : 120}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>
              <span>Tile size</span>
              <span>{tileSize}px</span>
            </label>
            <input
              type="range"
              min={6}
              max={apiInfo ? extractMax(apiInfo.fields.tileSize) : 64}
              value={tileSize}
              onChange={(e) => setTileSize(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <div className="actions">
        <button className="primary" disabled={!canGenerate} onClick={handleGenerate}>
          {status.state === "working" ? "Generating…" : "Generate mosaic"}
        </button>
        <span className={`status ${status.state === "error" ? "error" : ""}`}>{status.message}</span>
      </div>

      {result && (
        <section className="card result" style={{ marginTop: "1.5rem" }}>
          <h2>Result</h2>
          <img src={result.url} alt="Generated photomosaic" />
          <div className="result-meta">
            <span className="status">
              {result.cols}×{result.rows} tiles at {result.tileSize}px
            </span>
            <a className="secondary" href={result.url} download="mosaic.png">
              Download PNG
            </a>
          </div>
          {result.credit && <p className="api-hint">{result.credit}</p>}
        </section>
      )}

      <p className="api-hint">
        Prefer to call it directly? <code>POST /api/generate</code> as{" "}
        <code>multipart/form-data</code> with <code>source</code>, plus either <code>tiles</code>{" "}
        (repeated file field) or <code>topic</code> — see{" "}
        <a href="/api/generate">GET /api/generate</a> for the full spec.
      </p>
    </div>
  );
}

function extractMin(fieldDesc) {
  const m = /(\d+)-(\d+)/.exec(fieldDesc);
  return m ? Number(m[1]) : 3;
}
function extractMax(fieldDesc) {
  const m = /(\d+)-(\d+)/.exec(fieldDesc);
  return m ? Number(m[2]) : 120;
}
function extractDefault(fieldDesc) {
  const m = /default (\d+)/.exec(fieldDesc || "");
  return m ? Number(m[1]) : null;
}

const linkBtnStyle = {
  background: "none",
  border: "none",
  padding: 0,
  color: "inherit",
  textDecoration: "underline",
  cursor: "pointer",
  font: "inherit",
};

function Dropzone({ active, onDragStateChange, onFiles, inputRef, accept, multiple, label, hint }) {
  return (
    <div
      className={`dropzone ${active ? "dragging" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        onDragStateChange(true);
      }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDragStateChange(false);
        onFiles(e.dataTransfer.files);
      }}
    >
      <div>{label}</div>
      {hint && <div className="hint">{hint}</div>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
