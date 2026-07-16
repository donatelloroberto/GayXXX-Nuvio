"use strict";

const cheerio = require("cheerio-without-node-native");
const allProviderConfigs = require("./provider-configs");
const providers = require("./providers");
const { recordDiagnostic } = require("./diagnostics");
const { extractStreams } = require("./universal-extractor");

function createProviderAddon(providerId) {
const selectedConfig = allProviderConfigs.find((item) => item.id === providerId);
if (!selectedConfig) throw new Error("Unknown provider: " + providerId);
const providerConfigs = [selectedConfig];
const ADDON_ID = "community." + selectedConfig.id;
const CATALOG_ID = ADDON_ID + ".catalog";
const ID_PREFIX = ADDON_ID + ":";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 12000);
const PROVIDER_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS || 35000);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 5 * 60 * 1000);
const MAX_CATALOG_ITEMS = Number(process.env.MAX_CATALOG_ITEMS || 80);

const configById = Object.fromEntries(providerConfigs.map((config) => [config.id, config]));
const providerNameToId = Object.fromEntries(providerConfigs.map((config) => [config.name.toLowerCase(), config.id]));
const cache = new Map();

const addonManifest = {
  id: ADDON_ID,
  version: "2.2.0",
  name: selectedConfig.name,
  description: selectedConfig.description || (selectedConfig.name + " independent Stremio addon."),
  logo: selectedConfig.logo || undefined,
  resources: [
    { name: "catalog", types: ["movie"] },
    { name: "meta", types: ["movie"], idPrefixes: [ID_PREFIX] },
    { name: "stream", types: ["movie"], idPrefixes: [ID_PREFIX] }
  ],
  types: ["movie"],
  idPrefixes: [ID_PREFIX],
  catalogs: [
    {
      type: "movie",
      id: CATALOG_ID,
      name: selectedConfig.name,
      extra: [
        { name: "search", isRequired: false },
        { name: "skip", isRequired: false }
      ]
    }
  ],
  behaviorHints: {
    adult: true,
    configurable: false,
    configurationRequired: false,
    p2p: false
  }
};

function json(res, status, payload, cacheControl = "public, max-age=60") {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", cacheControl);
  res.end(JSON.stringify(payload));
}

function text(res, status, payload, contentType) {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType || "text/plain; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(payload);
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createContentId(providerId, sourceUrl, title) {
  return ID_PREFIX + providerId + ":" + base64UrlEncode(JSON.stringify({ u: sourceUrl, n: title || "" }));
}

function decodeContentId(contentId) {
  const value = decodeURIComponent(String(contentId || ""));
  if (!value.startsWith(ID_PREFIX)) throw new Error("Unsupported content id");
  const rest = value.slice(ID_PREFIX.length);
  const separator = rest.indexOf(":");
  if (separator < 1) throw new Error("Malformed content id");
  const providerId = rest.slice(0, separator);
  const config = configById[providerId];
  if (!config) throw new Error("Unknown provider");
  const payload = JSON.parse(base64UrlDecode(rest.slice(separator + 1)));
  if (!payload || typeof payload.u !== "string") throw new Error("Malformed content payload");
  const sourceUrl = normalizeUrl(payload.u);
  if (!sourceUrl || !isAllowedSourceUrl(config, sourceUrl)) throw new Error("Source URL is not allowed for this provider");
  return { providerId, config, sourceUrl, title: String(payload.n || "") };
}

function normalizeUrl(value, base) {
  if (!value) return "";
  let raw = String(value).trim().replace(/&amp;/gi, "&").replace(/\\\//g, "/");
  if (!raw || raw.startsWith("javascript:") || raw.startsWith("data:") || raw === "#") return "";
  if (raw.startsWith("//")) raw = "https:" + raw;
  try {
    return new URL(raw, base).toString();
  } catch (_) {
    return "";
  }
}

function allowedHosts(config) {
  const hosts = new Set();
  const values = [config.baseUrl, config.origin].concat(config.searchTemplates || [], config.allowedHosts || []);
  for (const value of values) {
    if (!/^https?:\/\//i.test(String(value || ""))) continue;
    try { hosts.add(new URL(value).hostname.toLowerCase()); } catch (_) {}
  }
  return hosts;
}

function isAllowedSourceUrl(config, sourceUrl, pageUrl) {
  try {
    const host = new URL(sourceUrl).hostname.toLowerCase();
    const normalized = host.replace(/^www\./, "");
    const hosts = allowedHosts(config);
    if (pageUrl) {
      try { hosts.add(new URL(pageUrl).hostname.toLowerCase()); } catch (_) {}
    }
    return Array.from(hosts).some((allowed) => allowed.replace(/^www\./, "") === normalized);
  } catch (_) {
    return false;
  }
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugTitle(sourceUrl) {
  try {
    const pathname = new URL(sourceUrl).pathname.replace(/\/$/, "");
    const slug = pathname.substring(pathname.lastIndexOf("/") + 1);
    return decodeURIComponent(slug).replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "Video";
  } catch (_) {
    return "Video";
  }
}

function selectFirst($, selectors, attribute) {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (!element.length) continue;
    const value = attribute ? element.attr(attribute) : element.text();
    if (cleanText(value)) return cleanText(value);
  }
  return "";
}

function extractCandidateTitle($, element) {
  const node = $(element);
  const selectors = ["h1", "h2", "h3", "h4", ".title", ".name", ".entry-title", ".video-title", ".item-title", "a[title]", "img[alt]"];
  for (const selector of selectors) {
    const found = node.find(selector).first();
    const value = found.attr("title") || found.attr("alt") || found.text();
    if (cleanText(value)) return cleanText(value);
  }
  return cleanText(node.attr("title") || node.attr("data-title") || node.text());
}

function extractCandidateUrl($, element, pageUrl) {
  const node = $(element);
  const href = node.attr("href") || node.find("a[href]").first().attr("href");
  return normalizeUrl(href, pageUrl);
}

function extractCandidatePoster($, element, pageUrl) {
  const node = $(element);
  const image = node.is("img") ? node : node.find("img").first();
  const attributes = ["data-src", "data-lazy-src", "data-original", "data-thumb", "data-poster", "src", "poster"];
  for (const attribute of attributes) {
    const value = image.attr(attribute);
    if (!value || String(value).startsWith("data:")) continue;
    const resolved = normalizeUrl(value, pageUrl);
    if (resolved) return resolved;
  }
  const srcset = image.attr("data-srcset") || image.attr("srcset");
  if (srcset) {
    const value = srcset.split(",").pop().trim().split(/\s+/)[0];
    const resolved = normalizeUrl(value, pageUrl);
    if (resolved) return resolved;
  }
  return "";
}

function isProbablyVideoUrl(config, sourceUrl) {
  try {
    const parsed = new URL(sourceUrl);
    const path = (parsed.pathname + parsed.search).toLowerCase();
    if (!path || path === "/") return false;
    if (/(?:\/|^)(?:tag|tags|category|categories|studio|channels?|creators?|pornstars?|models?|login|register|upload|search|page|privacy|terms|dmca|contact|parentalcontrol|about)(?:\/|\?|$)/i.test(path)) return false;
    if (/[?&](?:s|search|filter|sort|page|paged)=/i.test(path)) return false;
    if (/\.(?:jpg|jpeg|png|gif|webp|svg|css|js|xml|pdf)(?:$|\?)/i.test(path)) return false;
    if (config.detailUrlPattern) return new RegExp(config.detailUrlPattern, "i").test(path);
    return /\/videos?\/|\/watch\/|\/embed\/|\/movie\/|\/20\d{2}\/\d{1,2}\/|\/\d{5,}(?:\/|$)|\/[a-z0-9-]{10,}\/?$|\.html(?:$|\?)/i.test(path);
  } catch (_) {
    return false;
  }
}

function isChallengePage(html) {
  const sample = String(html || "").slice(0, 10000);
  return !sample || /<title>\s*(?:just a moment|access denied|attention required|site unavailable|security check)/i.test(sample) || /cf-chl-|captcha-container|enable javascript and cookies to continue/i.test(sample);
}

function expandSearchTemplate(config, template, query) {
  const encoded = encodeURIComponent(query);
  const slug = encodeURIComponent(cleanText(query).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  return normalizeUrl(String(template).replace(/%q%/g, encoded).replace(/%slug%/g, slug), config.origin || config.baseUrl);
}

function parseCatalogPage(config, html, pageUrl) {
  if (isChallengePage(html)) return [];
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();
  const add = (element) => {
    const sourceUrl = extractCandidateUrl($, element, pageUrl);
    if (!sourceUrl || !isAllowedSourceUrl(config, sourceUrl, pageUrl) || !isProbablyVideoUrl(config, sourceUrl) || seen.has(sourceUrl)) return;
    const title = extractCandidateTitle($, element) || slugTitle(sourceUrl);
    if (!title || title.length < 2) return;
    seen.add(sourceUrl);
    const poster = extractCandidatePoster($, element, pageUrl);
    items.push({
      id: createContentId(config.id, sourceUrl, title),
      type: "movie",
      name: title,
      poster: poster || config.logo || undefined,
      posterShape: "poster",
      description: config.name,
      website: sourceUrl,
      genres: ["Adult", config.name]
    });
  };

  $(config.itemSelector || "article, .video-item, .item").each((_, element) => add(element));
  if (items.length < 8) {
    $("article, .video-item, .item, .thumb-block, .video, .post, .entry, [class*='video-card'], [class*='video-item']").each((_, element) => add(element));
  }
  if (items.length < 8) {
    $("a[href]").each((_, anchor) => {
      const node = $(anchor);
      if (!node.find("img,[data-src],[data-thumb],[style*='background']").length && !node.is("[data-src],[data-thumb]")) return;
      add(anchor);
    });
  }
  return items.sort((a, b) => Number(Boolean(b.poster)) - Number(Boolean(a.poster))).slice(0, 60);
}

async function fetchText(url, referer) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8",
        ...(referer ? { Referer: referer } : {})
      }
    });
    if (!response.ok) {
      const error = new Error("HTTP " + response.status);
      error.status = response.status;
      error.url = url;
      throw error;
    }
    return { html: await response.text(), finalUrl: response.url || url, status: response.status, durationMs: Date.now() - started };
  } catch (error) {
    error.url = error.url || url;
    error.durationMs = Date.now() - started;
    if (error.name === "AbortError") error.code = "TIMEOUT";
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function cacheGet(key) {
  const item = cache.get(key);
  if (!item || Date.now() - item.createdAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function cacheSet(key, value) {
  cache.set(key, { createdAt: Date.now(), value });
  if (cache.size > 250) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  return value;
}

async function fetchProviderCatalog(config, query, requestId) {
  const cacheKey = "catalog:" + config.id + ":" + (query || "").toLowerCase();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const targets = query
    ? (config.searchTemplates || []).slice(0, 2).map((template) => expandSearchTemplate(config, template, query))
    : (config.homeUrls || [config.baseUrl]).slice(0, 2).map((target) => normalizeUrl(target, config.baseUrl));
  const results = await Promise.allSettled(targets.map(async (target) => {
    const page = await fetchText(target, config.baseUrl);
    const items = parseCatalogPage(config, page.html, page.finalUrl);
    if (!items.length) {
      recordDiagnostic({ level: "warn", provider: config.id, stage: query ? "search" : "catalog", code: isChallengePage(page.html) ? "CHALLENGE_OR_UNAVAILABLE" : "NO_ITEMS_PARSED", message: `No video cards parsed from ${page.html.length} bytes`, url: page.finalUrl, status: page.status, durationMs: page.durationMs, requestId });
    }
    return items;
  }));
  const merged = [];
  const seen = new Set();
  for (const result of results) {
    if (result.status !== "fulfilled") {
      const error = result.reason || {};
      recordDiagnostic({ provider: config.id, stage: query ? "search" : "catalog", code: error.code || "UPSTREAM_FETCH_FAILED", message: error.message, url: error.url || config.baseUrl, status: error.status, durationMs: error.durationMs, requestId });
      continue;
    }
    for (const item of result.value) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  if (!merged.length) recordDiagnostic({ level: "warn", provider: config.id, stage: query ? "search" : "catalog", code: "EMPTY_RESULT", message: "All upstream targets returned no usable videos", url: config.baseUrl, requestId });
  return cacheSet(cacheKey, merged.slice(0, 30));
}

function resolveProviderSelection(genre) {
  if (!genre) return providerConfigs;
  const normalized = String(genre).trim().toLowerCase();
  const id = configById[normalized] ? normalized : providerNameToId[normalized];
  return id && configById[id] ? [configById[id]] : providerConfigs;
}

async function getCatalog(extra, requestId) {
  const query = cleanText(extra.search || "");
  const skip = Math.max(0, Number.parseInt(extra.skip || "0", 10) || 0);
  const selected = resolveProviderSelection(extra.genre);
  const settled = await Promise.allSettled(selected.map((config) => fetchProviderCatalog(config, query, requestId)));
  const groups = settled.filter((group) => group.status === "fulfilled").map((group) => group.value);
  const metas = [];
  const seen = new Set();
  const longest = groups.reduce((max, group) => Math.max(max, group.length), 0);
  for (let index = 0; index < longest; index += 1) {
    for (const group of groups) {
      const item = group[index];
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      metas.push(item);
    }
  }
  return { metas: metas.slice(skip, skip + MAX_CATALOG_ITEMS) };
}

function parseMetaPage(config, sourceUrl, html, fallbackTitle, requestedId) {
  const $ = cheerio.load(html);
  const title = selectFirst($, ["meta[property='og:title']"], "content") ||
    selectFirst($, ["h1", ".entry-title", ".video-title", "title"]) || fallbackTitle || slugTitle(sourceUrl);
  const poster = selectFirst($, ["meta[property='og:image']", "meta[name='twitter:image']"], "content") ||
    selectFirst($, ["video[poster]"], "poster") ||
    selectFirst($, ["img[data-src]"], "data-src") ||
    selectFirst($, ["img[src]"], "src") || config.logo || "";
  const description = selectFirst($, ["meta[property='og:description']", "meta[name='description']"], "content") || config.description || config.name;
  const published = selectFirst($, ["meta[property='article:published_time']", "meta[itemprop='uploadDate']", "time[datetime]"], "content") || selectFirst($, ["time[datetime]"], "datetime");
  const duration = selectFirst($, ["meta[property='video:duration']", "meta[itemprop='duration']"], "content");
  const meta = {
    id: requestedId || createContentId(config.id, sourceUrl, title),
    type: "movie",
    name: title,
    poster: normalizeUrl(poster, sourceUrl) || undefined,
    background: normalizeUrl(poster, sourceUrl) || undefined,
    description,
    genres: ["Adult", config.name],
    language: config.language || "en",
    website: sourceUrl,
    releaseInfo: published ? String(published).slice(0, 4) : undefined,
    runtime: duration && /^\d+$/.test(duration) ? Math.ceil(Number(duration) / 60) + " min" : duration || undefined,
    behaviorHints: { defaultVideoId: requestedId || createContentId(config.id, sourceUrl, title) }
  };
  return Object.fromEntries(Object.entries(meta).filter(([, value]) => value !== undefined && value !== ""));
}

async function getMeta(contentId, requestId) {
  const decoded = decodeContentId(contentId);
  const cacheKey = "meta:" + contentId;
  const cached = cacheGet(cacheKey);
  if (cached) return { meta: cached };
  try {
    const page = await fetchText(decoded.sourceUrl, decoded.config.baseUrl);
    if (isChallengePage(page.html)) {
      const error = new Error("Challenge or unavailable page returned");
      error.code = "CHALLENGE_OR_UNAVAILABLE";
      error.status = page.status;
      error.durationMs = page.durationMs;
      throw error;
    }
    return { meta: cacheSet(cacheKey, parseMetaPage(decoded.config, decoded.sourceUrl, page.html, decoded.title, contentId)) };
  } catch (error) {
    recordDiagnostic({ level: "warn", provider: decoded.providerId, stage: "metadata", code: error.code || "FALLBACK_METADATA", message: error.message, url: decoded.sourceUrl, status: error.status, durationMs: error.durationMs, requestId });
    const fallback = {
      id: contentId,
      type: "movie",
      name: decoded.title || slugTitle(decoded.sourceUrl),
      poster: decoded.config.logo || undefined,
      description: decoded.config.description || decoded.config.name,
      genres: ["Adult", decoded.config.name],
      language: decoded.config.language || "en",
      website: decoded.sourceUrl
    };
    return { meta: fallback };
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message || "Timed out")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function sanitizeHeaders(headers) {
  const result = {};
  const blocked = new Set(["host", "content-length", "range", "connection"]);
  for (const [key, value] of Object.entries(headers || {})) {
    if (!key || value == null || blocked.has(String(key).toLowerCase())) continue;
    result[String(key)] = String(value);
  }
  return result;
}

function mapProviderStream(config, sourceUrl, item) {
  const headers = sanitizeHeaders(item.headers);
  const quality = cleanText(item.quality || "Auto");
  const size = cleanText(item.size && item.size !== "Unknown" ? item.size : "");
  const description = [quality, size].filter(Boolean).join(" • ") || config.name;
  return {
    name: cleanText(item.name || config.name),
    title: description,
    description,
    url: item.url,
    type: "direct",
    behaviorHints: {
      notWebReady: Object.keys(headers).length > 0,
      bingeGroup: ADDON_ID + ":" + config.id,
      proxyHeaders: Object.keys(headers).length > 0 ? { request: headers } : undefined,
      filename: item.filename || undefined
    }
  };
}

async function getStreams(contentId, requestId) {
  const decoded = decodeContentId(contentId);
  const provider = providers[decoded.providerId];
  const jobs = [withTimeout(
    extractStreams(decoded.config, decoded.sourceUrl, requestId),
    PROVIDER_TIMEOUT_MS,
    decoded.config.name + " universal extraction timed out"
  )];
  if (provider && typeof provider.scrape === "function") jobs.push(withTimeout(
    Promise.resolve(provider.scrape({
      title: decoded.title || slugTitle(decoded.sourceUrl),
      name: decoded.title || slugTitle(decoded.sourceUrl),
      url: decoded.sourceUrl,
      type: "movie"
    })),
    PROVIDER_TIMEOUT_MS,
    decoded.config.name + " provider extraction timed out"
  ));

  const attempts = await Promise.allSettled(jobs);
  const raw = [];
  for (const attempt of attempts) {
    if (attempt.status === "fulfilled" && Array.isArray(attempt.value)) raw.push(...attempt.value);
    else if (attempt.status === "rejected") recordDiagnostic({ provider: decoded.providerId, stage: "stream", code: /timed out/i.test(attempt.reason?.message || "") ? "TIMEOUT" : "EXTRACTOR_ERROR", message: attempt.reason?.message, url: decoded.sourceUrl, requestId });
  }

  const streams = [];
  const seen = new Set();
  for (const item of Array.isArray(raw) ? raw : []) {
    if (!item || !/^https?:\/\//i.test(String(item.url || "")) || seen.has(item.url)) continue;
    seen.add(item.url);
    streams.push(mapProviderStream(decoded.config, decoded.sourceUrl, item));
  }
  if (!streams.length) recordDiagnostic({ level: "warn", provider: decoded.providerId, stage: "stream", code: "EMPTY_STREAMS", message: `${attempts.length} extractor paths returned no valid URLs`, url: decoded.sourceUrl, requestId });
  return { streams };
}

function parseExtra(segment) {
  const extra = {};
  if (!segment) return extra;
  for (const pair of String(segment).split("&")) {
    const separator = pair.indexOf("=");
    const key = separator < 0 ? pair : pair.slice(0, separator);
    const value = separator < 0 ? "" : pair.slice(separator + 1);
    if (!key) continue;
    try { extra[decodeURIComponent(key)] = decodeURIComponent(value); } catch (_) { extra[key] = value; }
  }
  return extra;
}

function routeParts(requestUrl) {
  const parsed = new URL(requestUrl, "http://localhost");
  return parsed.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
}

async function handleRequest(req, res) {
  const requestId = String(req.headers?.["x-vercel-id"] || req.headers?.["x-request-id"] || `${selectedConfig.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
    res.end();
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const parts = routeParts(req.url || "/");
    if (!parts.length) {
      json(res, 200, {
        name: addonManifest.name,
        version: addonManifest.version,
        manifest: "/manifest.json",
        provider: selectedConfig.id
      });
      return;
    }
    if (parts.length === 1 && parts[0] === "health") {
      json(res, 200, { ok: true, version: addonManifest.version, service: addonManifest.id }, "no-store");
      return;
    }
    if (parts.length === 1 && parts[0] === "logo.svg") {
      text(res, 200, '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#111"/><path d="M102 132h308v248H102z" fill="#e91e63"/><path d="M218 190l120 66-120 66z" fill="#fff"/></svg>', "image/svg+xml; charset=utf-8");
      return;
    }
    if (parts.length === 1 && parts[0] === "manifest.json") {
      json(res, 200, addonManifest, "public, max-age=300");
      return;
    }

    const resource = parts[0];
    const type = parts[1];
    if (type !== "movie") {
      json(res, 200, resource === "catalog" ? { metas: [] } : resource === "stream" ? { streams: [] } : { meta: null });
      return;
    }

    if (resource === "catalog") {
      const id = String(parts[2] || "").replace(/\.json$/i, "");
      if (id !== CATALOG_ID) return json(res, 200, { metas: [] });
      let extraSegment = parts[3] || "";
      extraSegment = extraSegment.replace(/\.json$/i, "");
      json(res, 200, await getCatalog(parseExtra(extraSegment), requestId), "public, max-age=120");
      return;
    }

    if (resource === "meta") {
      const rawId = parts.slice(2).join("/").replace(/\.json$/i, "");
      json(res, 200, await getMeta(rawId, requestId), "public, max-age=300");
      return;
    }

    if (resource === "stream") {
      const rawId = parts.slice(2).join("/").replace(/\.json$/i, "");
      json(res, 200, await getStreams(rawId, requestId), "no-store");
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (error) {
    const resource = routeParts(req.url || "/")[0];
    recordDiagnostic({ provider: selectedConfig.id, stage: resource || "request", code: "REQUEST_FAILED", message: error?.message, requestId });
    if (resource === "catalog") return json(res, 200, { metas: [] }, "no-store");
    if (resource === "meta") return json(res, 200, { meta: null }, "no-store");
    if (resource === "stream") return json(res, 200, { streams: [] }, "no-store");
    json(res, 400, { error: error && error.message ? error.message : "Request failed" }, "no-store");
  }
}

return {
  addonManifest,
  createContentId,
  decodeContentId,
  parseCatalogPage,
  parseMetaPage,
  parseExtra,
  getCatalog,
  getMeta,
  getStreams,
  handleRequest
};
}

module.exports = { createProviderAddon, providerConfigs: allProviderConfigs };
