"use strict";

const MAX_EVENTS = Math.max(25, Number(process.env.DIAGNOSTIC_BUFFER_SIZE || 200));
const events = [];
const counters = new Map();

function safeHost(value) {
  try { return new URL(String(value || "")).hostname; } catch (_) { return ""; }
}

function safeMessage(value) {
  return String(value || "unknown failure")
    .replace(/https?:\/\/[^\s'"<>]+/gi, (url) => `[url:${safeHost(url) || "redacted"}]`)
    .replace(/\b(authorization|cookie|token|api[_-]?key)\b\s*[:=]?\s*(?:bearer\s+)?[^\s,&;]+/gi, "$1=[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 300);
}

function recordDiagnostic(input) {
  const event = {
    timestamp: new Date().toISOString(),
    level: input.level === "info" ? "info" : input.level === "warn" ? "warn" : "error",
    provider: String(input.provider || "system"),
    stage: String(input.stage || "unknown"),
    code: String(input.code || "UNSPECIFIED"),
    message: safeMessage(input.message),
    upstreamHost: safeHost(input.url),
    status: Number(input.status || 0) || undefined,
    durationMs: Number(input.durationMs || 0) || undefined,
    requestId: String(input.requestId || "").slice(0, 100) || undefined
  };
  events.push(event);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  const key = `${event.provider}:${event.stage}:${event.code}`;
  counters.set(key, (counters.get(key) || 0) + 1);
  const line = JSON.stringify({ service: "stremio-provider-diagnostics", ...event });
  if (process.env.DIAGNOSTICS_SILENT !== "true") {
    if (event.level === "error") console.error(line);
    else if (event.level === "warn") console.warn(line);
    else if (process.env.LOG_SUCCESS === "true") console.info(line);
  }
  return event;
}

function diagnosticsSnapshot(filters = {}) {
  const provider = String(filters.provider || "").toLowerCase();
  const stage = String(filters.stage || "").toLowerCase();
  const level = String(filters.level || "").toLowerCase();
  const requestedLimit = Number.parseInt(filters.limit || "100", 10);
  const limit = Math.min(MAX_EVENTS, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 100));
  const matches = (event) => (!provider || event.provider.toLowerCase() === provider) &&
    (!stage || event.stage.toLowerCase() === stage) && (!level || event.level === level);
  const recent = events.filter(matches).slice(-limit).reverse();
  const counterRows = Array.from(counters, ([key, count]) => ({ key, count }))
    .filter(({ key }) => (!provider || key.toLowerCase().startsWith(provider + ":")) &&
      (!stage || key.toLowerCase().split(":")[1] === stage))
    .sort((a, b) => b.count - a.count);
  return {
    generatedAt: new Date().toISOString(),
    service: "stremio-provider-diagnostics",
    filters: { provider: provider || null, stage: stage || null, level: level || null, limit },
    retention: {
      recentWindow: `Latest ${MAX_EVENTS} events in this running function instance`,
      durableLog: "Vercel Runtime Logs (search service=stremio-provider-diagnostics)",
      note: "The recent window resets on a serverless cold start; structured console events follow the Vercel project's log retention policy."
    },
    recordedCount: Array.from(counters.values()).reduce((total, count) => total + count, 0),
    matchingRecentCount: recent.length,
    counters: counterRows,
    recent
  };
}

module.exports = { recordDiagnostic, diagnosticsSnapshot };
