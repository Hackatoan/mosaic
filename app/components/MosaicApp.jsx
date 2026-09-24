"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "../lib/i18n-client.js";
import { localizeLinks } from "../lib/localize-links.js";

const DEFAULT_COLS = 40;
const DEFAULT_TILE_SIZE = 24;

export default function MosaicApp() {
  const { t, locale } = useT();
  const htmlT = (k) => ({ __html: localizeLinks(t(k), locale) });
  const [apiInfo, setApiInfo] = useState(null);

  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState(null);

  const [tileMode, setTileMode] = useState("upload"); // "upload" | "topic" | "drive"
  const [tileFiles, setTileFiles] = useState([]);
  const [tilePreviews, setTilePreviews] = useState([]);
  const [topic, setTopic] = useState("");
  const [tileCount, setTileCount] = useState(40);
  const [driveFolder, setDriveFolder] = useState("");
  const [driveTileCount, setDriveTileCount] = useState(40);

  const [cols, setCols] = useState(DEFAULT_COLS);
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);
  const [wantsShare, setWantsShare] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState({ state: "idle", message: "" }); // idle | working | error | done
  const [result, setResult] = useState(null); // { url, cols, rows, tileSize, credit, shareUrl, shareError }
  const [copied, setCopied] = useState(false);

  const sourceInputRef = useRef(null);
  const tilesInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/generate")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setApiInfo(data);
        setTileCount(extractDefault(data.fields.tileCount) ?? 40);
        setDriveTileCount(extractDefault(data.fields.driveTileCount) ?? 40);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sourceFile) {
      // Syncing with browser object-URL lifecycle (create/revoke), not a derivable render value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSourcePreview(null);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setSourcePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  useEffect(() => {
    const urls = tileFiles.slice(0, 24).map((f) => URL.createObjectURL(f));
    // Syncing with browser object-URL lifecycle (create/revoke), not a derivable render value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTilePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [tileFiles]);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const pexelsAvailable = apiInfo?.pexelsAvailable ?? true; // assume yes until we know otherwise
  const driveAvailable = apiInfo?.driveAvailable ?? true;
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

  const tilesReady =
    tileMode === "upload"
      ? tileFiles.length >= minTiles
      : tileMode === "topic"
        ? topic.trim().length > 0
        : driveFolder.trim().length > 0;
  const canGenerate = sourceFile && tilesReady && status.state !== "working";

  async function handleGenerate() {
    if (!canGenerate) return;
    setStatus({ state: "working", message: t("app.working") });
    setResult(null);
    setCopied(false);

    try {
      const form = new FormData();
      form.set("source", sourceFile);
      form.set("cols", String(cols));
      form.set("tileSize", String(tileSize));
      if (wantsShare) form.set("share", "true");
      if (tileMode === "upload") {
        tileFiles.forEach((f) => form.append("tiles", f));
      } else if (tileMode === "topic") {
        form.set("topic", topic.trim());
        form.set("tileCount", String(tileCount));
      } else {
        form.set("driveFolder", driveFolder.trim());
        form.set("driveTileCount", String(driveTileCount));
      }

      const res = await fetch("/api/generate", { method: "POST", body: form });

      if (!res.ok) {
        let message = t("app.reqFailed", { status: res.status });
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
      const shareUrl = res.headers.get("X-Mosaic-Share-Url");
      const rawShareError = res.headers.get("X-Mosaic-Share-Error");
      const shareError = rawShareError ? decodeURIComponent(rawShareError) : null;
      setResult({
        url,
        cols: gc,
        rows: gr,
        tileSize: res.headers.get("X-Mosaic-Tile-Size"),
        credit,
        shareUrl,
        shareError,
      });
      setStatus({ state: "done", message: t("app.done") });
    } catch {
      setStatus({ state: "error", message: t("app.networkError") });
    }
  }

  function copyShareUrl() {
    if (!result?.shareUrl) return;
    navigator.clipboard?.writeText(result.shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <h1>{t("app.h1")}</h1>
      <p className="subtitle">{t("app.subtitle")}</p>

      <section className="card">
        <h2>{t("app.s1Title")}</h2>
        <Dropzone
          active={dragging === "source"}
          onDragStateChange={(v) => setDragging(v ? "source" : false)}
          onFiles={handleSourcePick}
          inputRef={sourceInputRef}
          accept="image/*"
          multiple={false}
          label={sourceFile ? sourceFile.name : t("app.sourceDrop")}
          hint={apiInfo ? t("app.sourceUpTo", { mb: apiInfo.limits.maxSourceMB }) : ""}
        />
        {sourcePreview && (
          <div className="source-preview-wrap">
            <img className="source-preview" src={sourcePreview} alt={t("app.sourcePreviewAlt")} />
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t("app.s2Title")}</h2>
        <div className="mode-toggle" role="tablist">
          <button
            type="button"
            className={`mode-btn ${tileMode === "upload" ? "active" : ""}`}
            onClick={() => setTileMode("upload")}
          >
            {t("app.modeUpload")}
          </button>
          <button
            type="button"
            className={`mode-btn ${tileMode === "topic" ? "active" : ""}`}
            onClick={() => setTileMode("topic")}
            disabled={!pexelsAvailable}
            title={!pexelsAvailable ? t("app.topicDisabledTitle") : undefined}
          >
            {t("app.modeTopic")}
          </button>
          <button
            type="button"
            className={`mode-btn ${tileMode === "drive" ? "active" : ""}`}
            onClick={() => setTileMode("drive")}
            disabled={!driveAvailable}
            title={!driveAvailable ? t("app.driveDisabledTitle") : undefined}
          >
            {t("app.modeDrive")}
          </button>
        </div>

        {tileMode === "upload" && (
          <>
            <Dropzone
              active={dragging === "tiles"}
              onDragStateChange={(v) => setDragging(v ? "tiles" : false)}
              onFiles={handleTilesPick}
              inputRef={tilesInputRef}
              accept="image/*"
              multiple
              label={t("app.tilesDrop")}
              hint={t("app.tilesHint", { min: minTiles, max: maxTiles, mb: apiInfo?.limits.maxTileMB ?? 5 })}
            />
            <p className={`tile-count ${tileFiles.length >= minTiles ? "ok" : ""}`}>
              {t("app.tilesSelected", { count: tileFiles.length })}
              {tileFiles.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <button type="button" className="link-btn" onClick={clearTiles} style={linkBtnStyle}>
                    {t("app.clear")}
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
                  <span className="tile-count">{t("app.moreCount", { n: tileFiles.length - tilePreviews.length })}</span>
                )}
              </div>
            )}
          </>
        )}

        {tileMode === "topic" && (
          <div className="topic-fields">
            <div className="field">
              <label htmlFor="topic-input">
                <span>{t("app.searchTopic")}</span>
              </label>
              <input
                id="topic-input"
                type="text"
                className="text-input"
                placeholder={t("app.topicPlaceholder")}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="field">
              <label>
                <span>{t("app.tileCount")}</span>
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
            <p className="hint" dangerouslySetInnerHTML={htmlT("app.pexelsHint")} />
          </div>
        )}

        {tileMode === "drive" && (
          <div className="topic-fields">
            <div className="field">
              <label htmlFor="drive-input">
                <span>{t("app.driveFolderLabel")}</span>
              </label>
              <input
                id="drive-input"
                type="text"
                className="text-input"
                placeholder={t("app.drivePlaceholder")}
                value={driveFolder}
                onChange={(e) => setDriveFolder(e.target.value)}
                maxLength={300}
              />
            </div>
            <div className="field">
              <label>
                <span>{t("app.tileCount")}</span>
                <span>{driveTileCount}</span>
              </label>
              <input
                type="range"
                min={minTiles}
                max={maxTiles}
                value={driveTileCount}
                onChange={(e) => setDriveTileCount(Number(e.target.value))}
              />
            </div>
            <p className="hint" dangerouslySetInnerHTML={htmlT("app.driveHint")} />
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t("app.s3Title")}</h2>
        <div className="controls-grid">
          <div className="field">
            <label>
              <span>{t("app.columns")}</span>
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
              <span>{t("app.tileSizeLabel")}</span>
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
        <label className="share-toggle">
          <input type="checkbox" checked={wantsShare} onChange={(e) => setWantsShare(e.target.checked)} />
          <span>{t("app.shareToggle")}</span>
        </label>
      </section>

      <div className="actions">
        <button className="primary" disabled={!canGenerate} onClick={handleGenerate}>
          {status.state === "working" ? t("app.generating") : t("app.generate")}
        </button>
        <span className={`status ${status.state === "error" ? "error" : ""}`}>{status.message}</span>
      </div>

      {result && (
        <section className="card result" style={{ marginTop: "1.5rem" }}>
          <h2>{t("app.resultTitle")}</h2>
          <div className="result-image-wrap">
            <img src={result.url} alt={t("app.resultAlt")} />
          </div>
          <div className="result-meta">
            <span className="status">
              {t("app.resultMeta", { cols: result.cols, rows: result.rows, size: result.tileSize })}
            </span>
            <a className="secondary" href={result.url} download="mosaic.png">
              {t("app.downloadPng")}
            </a>
          </div>
          {result.credit && <p className="api-hint">{result.credit}</p>}
          {result.shareUrl && (
            <div className="share-box">
              <input className="text-input" readOnly value={result.shareUrl} onFocus={(e) => e.target.select()} />
              <button type="button" className="secondary" onClick={copyShareUrl}>
                {copied ? t("app.copied") : t("app.copyLink")}
              </button>
            </div>
          )}
          {result.shareError && <p className="status error">{result.shareError}</p>}
        </section>
      )}

      <p className="api-hint" dangerouslySetInnerHTML={{ __html: t("app.apiHint") }} />
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
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
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
        tabIndex={-1}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
