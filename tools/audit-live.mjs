import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const configs = require("../packages/shared/provider-configs");
const host = String(process.argv[2] || "https://gay-xxx-nuvio.vercel.app").replace(/\/$/, "");
const timeoutMs = Number(process.env.AUDIT_TIMEOUT_MS || 30000);
const concurrency = Math.max(1, Number(process.env.AUDIT_CONCURRENCY || 3));
const sampleLimit = Math.max(1, Math.min(5, Number(process.env.AUDIT_SAMPLE_LIMIT || 3)));
const results = [];

async function requestJson(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: "application/json" } });
    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch (_) { throw new Error(`invalid JSON (${response.status}): ${text.slice(0, 80)}`); }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { ok: true, body, ms: Date.now() - started };
  } catch (error) {
    return { ok: false, error: error.message, ms: Date.now() - started };
  }
}

async function requestImage(url) {
  if (!url) return { ok: false, error: "missing poster", ms: 0 };
  const started = Date.now();
  try {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(timeoutMs), headers: { Accept: "image/*" } });
    const contentType = String(response.headers.get("content-type") || "");
    if (!response.ok || !contentType.startsWith("image/")) throw new Error(`HTTP ${response.status} ${contentType || "without image content type"}`);
    return { ok: true, contentType, ms: Date.now() - started };
  } catch (error) {
    return { ok: false, error: error.message, ms: Date.now() - started };
  }
}

async function audit(config) {
  const prefix = `${host}/${config.id}`;
  const manifest = await requestJson(`${prefix}/manifest.json`);
  const catalog = await requestJson(`${prefix}/catalog/movie/community.${config.id}.catalog.json`);
  const metas = catalog.ok && Array.isArray(catalog.body.metas) ? catalog.body.metas : [];
  const samples = await Promise.all(metas.slice(0, sampleLimit).map(async (catalogMeta) => {
    const encodedId = encodeURIComponent(catalogMeta.id);
    const [meta, streams] = await Promise.all([
      requestJson(`${prefix}/meta/movie/${encodedId}.json`),
      requestJson(`${prefix}/stream/movie/${encodedId}.json`)
    ]);
    const streamItems = streams.ok && Array.isArray(streams.body.streams) ? streams.body.streams : [];
    const posterUrl = meta.body?.meta?.poster || catalogMeta.poster || "";
    const poster = await requestImage(posterUrl);
    return {
      id: catalogMeta.id,
      name: catalogMeta.name,
      website: catalogMeta.website,
      metadata: Boolean(meta.ok && meta.body?.meta),
      metadataMs: meta.ms,
      metadataError: meta.error || "",
      poster: posterUrl,
      posterReady: poster.ok,
      posterMs: poster.ms,
      posterError: poster.error || "",
      streamCount: streamItems.length,
      webReadyStreamCount: streamItems.filter((item) => item?.behaviorHints?.notWebReady !== true).length,
      streamMs: streams.ms,
      streamError: streams.error || ""
    };
  }));
  const metadataCount = samples.filter((item) => item.metadata).length;
  const playableSamples = samples.filter((item) => item.webReadyStreamCount > 0).length;
  const streamCount = samples.reduce((total, item) => total + item.streamCount, 0);
  const webReadyStreamCount = samples.reduce((total, item) => total + item.webReadyStreamCount, 0);
  const posterSamples = samples.filter((item) => item.posterReady).length;
  const row = {
    id: config.id,
    baseUrl: config.baseUrl,
    manifest: manifest.ok,
    catalogCount: metas.length,
    catalogMs: catalog.ms,
    catalogError: catalog.error || "",
    samplesTested: samples.length,
    metadataCount,
    metadata: metadataCount > 0,
    playableSamples,
    streamCount,
    webReadyStreamCount,
    posterSamples,
    samples
  };
  console.log(`${row.id.padEnd(18)} catalog=${String(row.catalogCount).padStart(2)} meta=${String(row.metadataCount).padStart(1)}/${String(row.samplesTested).padEnd(1)} posters=${String(row.posterSamples).padStart(1)}/${String(row.samplesTested).padEnd(1)} web=${String(row.playableSamples).padStart(1)}/${String(row.samplesTested).padEnd(1)} streams=${String(row.webReadyStreamCount).padStart(2)}/${String(row.streamCount).padStart(2)} ${row.catalogError}`);
  return row;
}

let cursor = 0;
async function worker() {
  while (cursor < configs.length) {
    const config = configs[cursor++];
    results.push(await audit(config));
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
results.sort((a, b) => a.id.localeCompare(b.id));
const diagnostics = await requestJson(`${host}/diagnostics.json?limit=200`);
const report = { generatedAt: new Date().toISOString(), host, sampleLimit, results, diagnostics: diagnostics.ok ? diagnostics.body : { error: diagnostics.error } };
const output = process.env.AUDIT_OUTPUT || "live-audit.json";
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(`Report: ${output}`);
if (results.some((item) => !item.catalogCount || !item.metadataCount || !item.playableSamples || (item.samplesTested > 0 && !item.posterSamples))) process.exitCode = 2;
