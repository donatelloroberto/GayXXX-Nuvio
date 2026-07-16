"use strict";

const cheerio = require("cheerio-without-node-native");
const { recordDiagnostic } = require("./diagnostics");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
const TIMEOUT_MS = Math.max(5000, Number(process.env.EXTRACTOR_FETCH_TIMEOUT_MS || 12000));
const MEDIA_RE = /\.(?:m3u8|mp4|mkv|webm)(?:[?#]|$)/i;
const EMBED_RE = /(?:embed|player|watch|stream|dood|d000d|mixdrop|streamtape|voe|filemoon|vidhide|vidguard|upstream|uqload|lulustream|myvid|jgvcdn|onecdn|ninjastream|ok\.ru)/i;
const AD_RE = /(?:doubleclick|googlesyndication|google-analytics|exoclick|juicyads|trafficjunky|banner|popads)/i;
const ASSET_RE = /\.(?:js|css|mjs|map|jpg|jpeg|png|gif|webp|svg|ico|woff2?|ttf)(?:[?#]|$)/i;

function isEmbedUrl(url, base) {
  try {
    const parsed = new URL(url);
    const parent = new URL(base);
    if (parsed.toString() === parent.toString() || AD_RE.test(url) || ASSET_RE.test(url) || MEDIA_RE.test(url)) return false;
    if (parsed.origin === parent.origin) return /\/(?:embed|player|watch|stream)(?:\/|$)/i.test(parsed.pathname);
    return EMBED_RE.test(parsed.hostname + parsed.pathname);
  } catch (_) { return false; }
}

function absoluteUrl(value, base) {
  if (!value) return "";
  let raw = String(value).trim().replace(/&amp;/gi, "&").replace(/\\u0026/gi, "&").replace(/\\\//g, "/");
  raw = raw.replace(/^["']|["']$/g, "");
  if (!raw || /^(?:javascript|data|blob):/i.test(raw)) return "";
  if (raw.startsWith("//")) raw = "https:" + raw;
  try { return new URL(raw, base).toString(); } catch (_) { return ""; }
}

function qualityFrom(value) {
  const match = String(value || "").match(/(?:^|[^0-9])(2160|1440|1080|720|540|480|360|240)p?(?:[^0-9]|$)/);
  return match ? match[1] + "p" : /\b4k\b/i.test(String(value || "")) ? "2160p" : "Auto";
}

function stream(url, referer, name, label) {
  return {
    url,
    name: name || "Direct",
    quality: qualityFrom((label || "") + " " + url),
    size: "Unknown",
    headers: { "User-Agent": UA, Referer: referer, Origin: new URL(referer).origin }
  };
}

async function fetchText(url, referer, providerId, requestId, options = {}) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      body: options.body,
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8",
        ...(referer ? { Referer: referer } : {}),
        ...(options.headers || {})
      }
    });
    const text = await response.text();
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return { text, finalUrl: response.url || url, response, durationMs: Date.now() - started };
  } catch (error) {
    recordDiagnostic({
      provider: providerId, stage: "extractor-fetch", code: error.name === "TimeoutError" ? "TIMEOUT" : "HTTP_FAILURE",
      message: error.message, url, status: error.status, durationMs: Date.now() - started, requestId
    });
    throw error;
  }
}

function addUrl(found, raw, base, label = "Direct") {
  const url = absoluteUrl(raw, base);
  if (!url || AD_RE.test(url) || !MEDIA_RE.test(url)) return;
  if (!found.has(url)) found.set(url, { label, referer: base });
}

function walkJson(value, found, base, depth = 0) {
  if (depth > 8 || value == null) return;
  if (typeof value === "string") {
    scanText(value, found, base);
    if (/^[A-Za-z0-9+/]{80,}={0,2}$/.test(value)) {
      try { scanText(Buffer.from(value, "base64").toString("utf8"), found, base); } catch (_) {}
    }
    return;
  }
  if (Array.isArray(value)) return value.forEach((item) => walkJson(item, found, base, depth + 1));
  if (typeof value === "object") Object.values(value).forEach((item) => walkJson(item, found, base, depth + 1));
}

function scanText(value, found, base) {
  const text = String(value || "").replace(/\\\//g, "/").replace(/&amp;/gi, "&").replace(/\\u0026/gi, "&");
  const patterns = [
    /https?:\/\/[^\s'"<>\\]+?\.(?:m3u8|mp4|mkv|webm)(?:\?[^\s'"<>\\]*)?/gi,
    /(?:file|src|url|contentUrl|video_url2?|video_alt_url|hls|hlsAuto|downloadUrl|html5video|media_url)\s*["']?\s*[:=]\s*["']([^"']+)["']/gi,
    /["']([^"']+\.(?:m3u8|mp4|mkv|webm)(?:\?[^"']*)?)["']/gi
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) addUrl(found, match[1] || match[0], base);
  }
}

function scanEmbeds(value, embeds, base) {
  const text = String(value || "").replace(/\\\//g, "/").replace(/&amp;/gi, "&").replace(/\\u0026/gi, "&");
  const candidates = [];
  const patterns = [
    /(?:changeServer|loadPlayer|setPlayer|openPlayer)\([^)]*?["'](https?:\/\/[^"']+)["']/gi,
    /(?:embedUrl|embed_url|playerUrl|player_url|iframe|embed)\s*["']?\s*[:=]\s*["']([^"']+)["']/gi,
    /https?:\/\/[^\s'"<>\\]+/gi
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) candidates.push(match[1] || match[0]);
  }
  for (const raw of candidates) {
    const url = absoluteUrl(raw, base);
    if (url && isEmbedUrl(url, base)) embeds.add(url);
  }
}

function unpackPacker(source) {
  try {
    const match = String(source).match(/eval\(function\(p,a,c,k,e,(?:d|r)\)[\s\S]*?\}\(['"]([\s\S]*?)['"],\s*(\d+),\s*(\d+),\s*['"]([\s\S]*?)['"]\.split\(['"]\|['"]\)/);
    if (!match) return "";
    let payload = match[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
    const radix = Number(match[2]);
    const count = Number(match[3]);
    const table = match[4].split("|");
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const encode = (number) => {
      if (number === 0) return "0";
      let output = "";
      while (number > 0) { output = alphabet[number % radix] + output; number = Math.floor(number / radix); }
      return output;
    };
    for (let index = count - 1; index >= 0; index -= 1) {
      if (table[index]) payload = payload.replace(new RegExp(`\\b${encode(index)}\\b`, "g"), table[index]);
    }
    return payload;
  } catch (_) { return ""; }
}

function base36Hash(hex) {
  try {
    if (!hex || hex.length < 32) return "";
    return [0, 8, 16, 24].map((offset) => BigInt("0x" + hex.slice(offset, offset + 8)).toString(36)).join("");
  } catch (_) { return ""; }
}

async function resolveEporner(html, pageUrl, found, context) {
  const vid = html.match(/EP\.video\.player\.vid\s*=\s*['"]([^'"]+)/i)?.[1];
  const rawHash = html.match(/EP\.video\.player\.hash\s*=\s*['"]([^'"]+)/i)?.[1];
  if (!vid || !rawHash) return;
  const hash = base36Hash(rawHash) || rawHash;
  try {
    const response = await fetchText(`https://www.eporner.com/xhr/video/${encodeURIComponent(vid)}?hash=${encodeURIComponent(hash)}`, pageUrl, context.providerId, context.requestId, { headers: { "X-Requested-With": "XMLHttpRequest" } });
    try { walkJson(JSON.parse(response.text), found, pageUrl); } catch (_) { scanText(response.text, found, pageUrl); }
  } catch (_) {}
}

async function resolveDood(url, referer, context) {
  try {
    const page = await fetchText(url, referer, context.providerId, context.requestId);
    const pass = page.text.match(/(\/pass_md5\/[^'"\s]+)/)?.[1];
    if (!pass) return [];
    const passUrl = new URL(pass, page.finalUrl).toString();
    const token = new URL(passUrl).searchParams.get("token") || "";
    const result = await fetchText(passUrl, page.finalUrl, context.providerId, context.requestId);
    const suffix = Math.random().toString(36).slice(2, 12);
    return [stream(result.text.trim() + suffix + `?token=${encodeURIComponent(token)}&expiry=${Date.now()}`, page.finalUrl, "DoodStream")];
  } catch (_) { return []; }
}

async function resolveStreamTape(url, referer, context) {
  try {
    const page = await fetchText(url, referer, context.providerId, context.requestId);
    const expression = page.text.match(/(?:robotlink|norobotlink)[\s\S]{0,600}?innerHTML\s*=\s*([^;]+);/i)?.[1] || "";
    const parts = Array.from(expression.matchAll(/['"]([^'"]+)['"]/g), (item) => item[1]);
    const candidate = parts.join("").replace(/^https:/, "");
    const finalUrl = absoluteUrl(candidate.startsWith("//") ? "https:" + candidate : candidate, page.finalUrl);
    return finalUrl ? [stream(finalUrl, "https://streamtape.com/", "StreamTape")] : [];
  } catch (_) { return []; }
}

async function resolveWordPressPlayers(html, pageUrl, found, embeds, context) {
  const $ = cheerio.load(html);
  const jobs = [];
  $("ul#playeroptionsul li[data-post][data-nume][data-type]").each((_, element) => {
    const node = $(element);
    const body = new URLSearchParams({ action: "doo_player_ajax", post: node.attr("data-post"), nume: node.attr("data-nume"), type: node.attr("data-type") }).toString();
    jobs.push(fetchText(new URL("/wp-admin/admin-ajax.php", pageUrl).toString(), pageUrl, context.providerId, context.requestId, {
      method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" }
    }).then((response) => collect(response.text, response.finalUrl, found, embeds)).catch(() => {}));
  });
  await Promise.all(jobs.slice(0, 6));
}

function collect(html, pageUrl, found, embeds) {
  const $ = cheerio.load(html || "");
  scanText(html, found, pageUrl);
  scanEmbeds(html, embeds, pageUrl);
  const unpacked = unpackPacker(html);
  if (unpacked) scanText(unpacked, found, pageUrl);
  $("script").each((_, element) => {
    const code = $(element).html() || "";
    scanText(code, found, pageUrl);
    scanEmbeds(code, embeds, pageUrl);
    const trimmed = code.replace(/^\s*(?:window\.[\w$]+\s*=|var\s+[\w$]+\s*=)\s*/, "").replace(/;\s*$/, "");
    if (/^[{[]/.test(trimmed)) { try { walkJson(JSON.parse(trimmed), found, pageUrl); } catch (_) {} }
  });
  $("video[src],video source[src],source[src],[data-file],[data-video],[data-url],[data-link],[data-hls],[data-mp4],a.download-link[href],a.download-button[href]").each((_, element) => {
    const node = $(element);
    ["src", "href", "data-src", "data-file", "data-video", "data-url", "data-link", "data-hls", "data-mp4"].forEach((attribute) => addUrl(found, node.attr(attribute), pageUrl));
  });
  $("iframe[src],iframe[data-src],[data-embed],[data-player],meta[itemprop=embedUrl],meta[property='og:video'],meta[property='og:video:url']").each((_, element) => {
    const node = $(element);
    const url = absoluteUrl(node.attr("src") || node.attr("data-src") || node.attr("data-embed") || node.attr("data-player") || node.attr("content"), pageUrl);
    if (url && !AD_RE.test(url) && !ASSET_RE.test(url)) embeds.add(url);
  });
  $("ul#mirrorMenu a[data-url],[data-player-url],[data-embed-url],[data-iframe],button[onclick],[onclick]").each((_, element) => {
    const node = $(element);
    const isMirror = node.closest("ul#mirrorMenu").length > 0;
    const raw = node.attr("data-url") || node.attr("data-player-url") || node.attr("data-embed-url") || node.attr("data-iframe") || node.attr("onclick") || "";
    scanText(raw, found, pageUrl);
    scanEmbeds(raw, embeds, pageUrl);
    const url = absoluteUrl(raw, pageUrl);
    if (url && !AD_RE.test(url) && !ASSET_RE.test(url) && !MEDIA_RE.test(url) && (isEmbedUrl(url, pageUrl) || isMirror)) embeds.add(url);
  });
}

async function resolveEmbed(url, referer, depth, visited, context) {
  if (!url || depth > 2 || visited.has(url)) return [];
  visited.add(url);
  if (/dood|d000d/i.test(new URL(url).hostname)) return resolveDood(url, referer, context);
  if (/streamtape/i.test(new URL(url).hostname)) return resolveStreamTape(url, referer, context);
  if (MEDIA_RE.test(url)) return [stream(url, referer, context.providerName)];
  try {
    const page = await fetchText(url, referer, context.providerId, context.requestId);
    const type = String(page.response.headers.get("content-type") || "");
    if (/^(?:video|audio)\//i.test(type) || /mpegurl/i.test(type)) return [stream(page.finalUrl, referer, context.providerName)];
    const found = new Map();
    const embeds = new Set();
    collect(page.text, page.finalUrl, found, embeds);
    const streams = Array.from(found, ([mediaUrl, info]) => stream(mediaUrl, info.referer, context.providerName, info.label));
    for (const next of Array.from(embeds).slice(0, 6)) streams.push(...await resolveEmbed(next, page.finalUrl, depth + 1, visited, context));
    return streams;
  } catch (_) { return []; }
}

async function extractStreams(config, pageUrl, requestId) {
  const context = { providerId: config.id, providerName: config.name, requestId };
  const started = Date.now();
  try {
    const page = await fetchText(pageUrl, config.baseUrl, config.id, requestId);
    const found = new Map();
    const embeds = new Set();
    collect(page.text, page.finalUrl, found, embeds);
    if (config.mode === "eporner") await resolveEporner(page.text, page.finalUrl, found, context);
    await resolveWordPressPlayers(page.text, page.finalUrl, found, embeds, context);
    const output = Array.from(found, ([mediaUrl, info]) => stream(mediaUrl, info.referer, config.name, info.label));
    for (const embed of Array.from(embeds).slice(0, 8)) output.push(...await resolveEmbed(embed, page.finalUrl, 0, new Set(), context));
    const unique = Array.from(new Map(output.filter((item) => item?.url).map((item) => [item.url, item])).values());
    if (!unique.length) recordDiagnostic({ level: "warn", provider: config.id, stage: "stream", code: "NO_PLAYABLE_URLS", message: `No direct media in page or ${embeds.size} embeds`, url: pageUrl, durationMs: Date.now() - started, requestId });
    return unique;
  } catch (error) {
    recordDiagnostic({ provider: config.id, stage: "stream", code: "EXTRACTION_FAILED", message: error.message, url: pageUrl, durationMs: Date.now() - started, requestId });
    return [];
  }
}

module.exports = { extractStreams, absoluteUrl, scanText, scanEmbeds, unpackPacker };
