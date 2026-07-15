/*
 * Gaypornvidsxxx — Nuvio local scraper
 * Converted from the CloudStream package Gaypornvidsxxx.
 * Original source domain: https://www.gaypornvidsxxx.com
 * Contract: module.exports.getStreams(tmdbId, mediaType, season, episode)
 * Runtime dependencies: Nuvio fetch shim + cheerio-without-node-native.
 */
var cheerio = require("cheerio-without-node-native");

var CONFIG = {"id":"gaypornvidsxxx","name":"Gaypornvidsxxx","baseUrl":"https://www.gaypornvidsxxx.com","origin":"https://www.gaypornvidsxxx.com","searchTemplates":["/?s=%q%"],"itemSelector":"div.item, div.video-item, article.blog-entry","mode":"generic","supportedTypes":["movie"]};
var TMDB_API_KEY = "68e094699525b18a70bab2f86b1fa706";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
var DEFAULT_HEADERS = {
  "User-Agent": UA,
  "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.8"
};

function mergeHeaders(a, b) {
  var out = {}, k;
  a = a || {}; b = b || {};
  for (k in a) out[k] = a[k];
  for (k in b) out[k] = b[k];
  return out;
}

function fetchResponse(url, options) {
  options = options || {};
  return fetch(url, {
    method: options.method || "GET",
    headers: mergeHeaders(DEFAULT_HEADERS, options.headers || {}),
    body: options.body,
    redirect: "follow"
  }).then(function (res) {
    if (!res.ok && res.status !== 301 && res.status !== 302) {
      throw new Error("HTTP " + res.status + " for " + url);
    }
    return res;
  });
}

function fetchText(url, options) {
  return fetchResponse(url, options).then(function (res) {
    return res.text().then(function (text) {
      return { text: text, response: res, finalUrl: res.url || url };
    });
  });
}

function fetchJson(url, options) {
  return fetchResponse(url, options).then(function (res) { return res.json(); });
}

function absoluteUrl(value, base) {
  if (!value) return "";
  value = decodeEntities(String(value).trim());
  if (value.indexOf("javascript:") === 0 || value.indexOf("data:") === 0 || value === "#") return "";
  if (value.indexOf("//") === 0) return "https:" + value;
  if (/^https?:\/\//i.test(value)) return value;
  try { return new URL(value, base || CONFIG.baseUrl).toString(); } catch (e) { return ""; }
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\\\//g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/\\u003d/g, "=")
    .replace(/\\u002f/gi, "/");
}

function normalize(value) {
  return String(value || "").toLowerCase()
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^a-z0-9\u00c0-\u024f]+/g, " ")
    .replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function unique(values) {
  var seen = {}, out = [], i, v;
  for (i = 0; i < values.length; i += 1) {
    v = values[i];
    if (!v || seen[v]) continue;
    seen[v] = true;
    out.push(v);
  }
  return out;
}

function titleScore(candidate, wanted, year) {
  var c = normalize(candidate), w = normalize(wanted);
  if (!c || !w) return 0;
  if (c === w) return 100;
  var score = 0;
  if (c.indexOf(w) !== -1 || w.indexOf(c) !== -1) score += 55;
  var tokens = w.split(" "), matched = 0, i;
  for (i = 0; i < tokens.length; i += 1) {
    if (tokens[i].length > 1 && c.indexOf(tokens[i]) !== -1) matched += 1;
  }
  score += Math.round((matched / Math.max(tokens.length, 1)) * 40);
  if (year && c.indexOf(String(year)) !== -1) score += 5;
  return score;
}

function qualityFrom(value) {
  var s = String(value || "").toLowerCase(), m;
  m = s.match(/(?:^|[^0-9])(2160|1440|1080|720|540|480|360|240)p?(?:[^0-9]|$)/);
  if (m) return m[1] + "p";
  if (/\b4k\b|\buhd\b/.test(s)) return "2160p";
  if (/\bfhd\b/.test(s)) return "1080p";
  if (/\bhd\b/.test(s)) return "720p";
  return "Auto";
}

function isDirectMedia(url) {
  return /\.(?:m3u8|mp4|mkv|webm)(?:[?#]|$)/i.test(String(url || ""));
}

function isProbablyEmbed(url) {
  var s = String(url || "").toLowerCase();
  if (!/^https?:\/\//.test(s) || isDirectMedia(s)) return false;
  return /embed|player|video|watch|stream|dood|mixdrop|streamtape|voe|filemoon|vid|ok\.ru|dailymotion|upstream|uqload|lulustream|myvid|jgvcdn|onecdn|1069jp|ninjastream/.test(s);
}

function makeStream(url, referer, label) {
  return {
    name: CONFIG.name + " - " + qualityFrom((label || "") + " " + url),
    title: label || CONFIG.name,
    url: url,
    quality: qualityFrom((label || "") + " " + url),
    size: "Unknown",
    headers: {
      "User-Agent": UA,
      "Referer": referer || CONFIG.baseUrl,
      "Origin": originOf(referer || CONFIG.baseUrl)
    },
    provider: CONFIG.id
  };
}

function originOf(url) {
  try { return new URL(url).origin; } catch (e) { return CONFIG.origin || CONFIG.baseUrl; }
}

function getTmdbMetadata(tmdbId, mediaType, season, episode) {
  var kind = mediaType === "tv" ? "tv" : "movie";
  var url = "https://api.themoviedb.org/3/" + kind + "/" + encodeURIComponent(tmdbId) +
    "?api_key=" + TMDB_API_KEY + "&language=en-US";
  return fetchJson(url).then(function (data) {
    var title = data.title || data.name || data.original_title || data.original_name || String(tmdbId);
    var date = data.release_date || data.first_air_date || "";
    var result = { title: title, originalTitle: data.original_title || data.original_name || "", year: date ? String(date).slice(0, 4) : "", type: kind, season: season, episode: episode };
    if (kind === "tv" && season != null && episode != null) {
      var epUrl = "https://api.themoviedb.org/3/tv/" + encodeURIComponent(tmdbId) + "/season/" + season + "/episode/" + episode +
        "?api_key=" + TMDB_API_KEY + "&language=en-US";
      return fetchJson(epUrl).then(function (ep) {
        result.episodeTitle = ep.name || "";
        return result;
      }).catch(function () { return result; });
    }
    return result;
  }).catch(function () {
    return { title: String(tmdbId), year: "", type: kind, season: season, episode: episode };
  });
}

function expandSearchTemplate(template, title) {
  var q = encodeURIComponent(title);
  var slug = encodeURIComponent(slugify(title));
  var value = template.replace(/%q%/g, q).replace(/%slug%/g, slug);
  return absoluteUrl(value, CONFIG.origin || CONFIG.baseUrl);
}

function extractCandidateTitle($, el) {
  var node = $(el), title = "";
  var selectors = ["h1", "h2", "h3", "h4", ".title", ".name", ".entry-title", ".video-title", ".item-title", "a[title]", "img[alt]"];
  for (var i = 0; i < selectors.length && !title; i += 1) {
    var found = node.find(selectors[i]).first();
    title = found.attr("title") || found.attr("alt") || found.text();
  }
  return String(title || node.attr("title") || node.attr("data-title") || node.text() || "").replace(/\s+/g, " ").trim();
}

function extractCandidateLink($, el, baseUrl) {
  var node = $(el), href = node.attr("href") || "";
  if (!href) href = node.find("a[href]").first().attr("href") || "";
  return absoluteUrl(href, baseUrl);
}

function parseSearchPage(html, searchUrl, wanted, year) {
  var $ = cheerio.load(html), candidates = [];
  $(CONFIG.itemSelector).each(function (_, el) {
    var url = extractCandidateLink($, el, searchUrl);
    if (!url) return;
    var title = extractCandidateTitle($, el);
    candidates.push({ url: url, title: title, score: titleScore(title, wanted, year) });
  });
  if (!candidates.length) {
    $("a[href]").each(function (_, el) {
      var url = absoluteUrl($(el).attr("href"), searchUrl);
      if (!url || /\/tag\/|\/category\/|\/author\/|[?&](?:page|paged)=/i.test(url)) return;
      var title = ($(el).attr("title") || $(el).text() || $(el).find("img").attr("alt") || "").replace(/\s+/g, " ").trim();
      var score = titleScore(title, wanted, year);
      if (score > 10) candidates.push({ url: url, title: title, score: score });
    });
  }
  candidates.sort(function (a, b) { return b.score - a.score; });
  candidates = candidates.filter(function (c) { return c.score >= 20; });
  var seen = {}, out = [];
  for (var i = 0; i < candidates.length && out.length < 3; i += 1) {
    if (seen[candidates[i].url]) continue;
    seen[candidates[i].url] = true;
    out.push(candidates[i]);
  }
  return out;
}

function collectStringUrls(value, out, depth) {
  if (depth > 7 || value == null) return;
  if (typeof value === "string") {
    var decoded = decodeEntities(value);
    if (/^https?:\/\//i.test(decoded)) out.push(decoded);
    return;
  }
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i += 1) collectStringUrls(value[i], out, depth + 1);
    return;
  }
  if (typeof value === "object") {
    for (var key in value) collectStringUrls(value[key], out, depth + 1);
  }
}

function extractUrlsFromHtml(html, pageUrl) {
  var $ = cheerio.load(html), direct = [], embeds = [], all = [];
  var mediaSelector = "video[src], video source[src], source[src], [data-file-link], [data-player-url], [data-link], [data-url], a.download-link[href], a.download-button[href], #gvhotDownloadBtn, #btnDownload";
  $(mediaSelector).each(function (_, el) {
    var node = $(el);
    var attrs = ["src", "data-src", "data-file-link", "data-player-url", "data-link", "data-url", "href"];
    for (var i = 0; i < attrs.length; i += 1) {
      var u = absoluteUrl(node.attr(attrs[i]), pageUrl);
      if (u) all.push(u);
    }
  });
  $("iframe[src], iframe[data-src], meta[itemprop=embedUrl], meta[property='og:video'], meta[property='og:video:url']").each(function (_, el) {
    var node = $(el);
    var u = absoluteUrl(node.attr("src") || node.attr("data-src") || node.attr("content"), pageUrl);
    if (u) embeds.push(u);
  });

  // JSON-LD and embedded JSON/state payloads.
  $("script").each(function (_, el) {
    var body = $(el).html() || "";
    if (!body) return;
    var trimmed = body.replace(/^\s*window\.initials\s*=\s*/, "").replace(/;\s*$/, "").trim();
    if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") {
      try { collectStringUrls(JSON.parse(trimmed), all, 0); } catch (e) {}
    }
  });

  var decodedHtml = decodeEntities(html);
  var patterns = [
    /https?:\/\/[^\s'"<>\\]+?\.(?:m3u8|mp4|mkv|webm)(?:\?[^\s'"<>\\]*)?/gi,
    /https?:\\\/\\\/[^\s'"<>]+?\.(?:m3u8|mp4|mkv|webm)(?:\\?[^\s'"<>]*)?/gi,
    /(?:file|source|src|hlsAuto|video_url2?|video_alt_url|contentUrl)\s*["']?\s*[:=]\s*["'](https?:\/\/[^"']+)["']/gi,
    /changeServer\([^,]+,\s*["'](https?:\/\/[^"']+)["']\)/gi
  ];
  for (var p = 0; p < patterns.length; p += 1) {
    var match;
    while ((match = patterns[p].exec(decodedHtml)) !== null) {
      all.push(decodeEntities(match[1] || match[0]).replace(/\\\//g, "/"));
    }
  }
  $("a[href], button[onclick], [onclick]").each(function (_, el) {
    var node = $(el), raw = node.attr("href") || node.attr("onclick") || "";
    var matches = raw.match(/https?:\/\/[^\s'"<>]+/g) || [];
    for (var i = 0; i < matches.length; i += 1) all.push(matches[i]);
  });

  all = unique(all.map(function (u) { return absoluteUrl(u, pageUrl); }));
  for (var j = 0; j < all.length; j += 1) {
    if (isDirectMedia(all[j])) direct.push(all[j]);
    else if (isProbablyEmbed(all[j])) embeds.push(all[j]);
  }
  return { direct: unique(direct), embeds: unique(embeds).slice(0, 5) };
}

function specialEporner(html, pageUrl) {
  var vid = /EP\.video\.player\.vid\s*=\s*['"]([^'"]+)['"]/.exec(html);
  var hash = /EP\.video\.player\.hash\s*=\s*['"]([^'"]+)['"]/.exec(html);
  if (!vid || !hash) return Promise.resolve([]);
  var api = "https://www.eporner.com/xhr/video/" + encodeURIComponent(vid[1]) + "?hash=" + encodeURIComponent(hash[1]);
  return fetchJson(api, { headers: { Referer: pageUrl, "X-Requested-With": "XMLHttpRequest" } }).then(function (data) {
    var urls = []; collectStringUrls(data, urls, 0);
    return unique(urls.filter(isDirectMedia));
  }).catch(function () { return []; });
}

function specialKRX18(html, pageUrl) {
  var $ = cheerio.load(html), jobs = [];
  $("ul#playeroptionsul li").each(function (_, el) {
    var node = $(el), post = node.attr("data-post"), nume = node.attr("data-nume"), type = node.attr("data-type");
    if (!post || !nume || !type) return;
    var body = "action=doo_player_ajax&post=" + encodeURIComponent(post) + "&nume=" + encodeURIComponent(nume) + "&type=" + encodeURIComponent(type);
    jobs.push(fetchText(originOf(pageUrl) + "/wp-admin/admin-ajax.php", {
      method: "POST",
      headers: { Referer: pageUrl, "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
      body: body
    }).then(function (r) { return extractUrlsFromHtml(r.text, pageUrl); }).catch(function () { return { direct: [], embeds: [] }; }));
  });
  return Promise.all(jobs.slice(0, 5)).then(function (groups) {
    var direct = [], embeds = [];
    for (var i = 0; i < groups.length; i += 1) { direct = direct.concat(groups[i].direct); embeds = embeds.concat(groups[i].embeds); }
    return { direct: unique(direct), embeds: unique(embeds) };
  });
}

function specialNurgay(html, pageUrl) {
  var $ = cheerio.load(html), embed = absoluteUrl($("meta[itemprop=embedUrl]").attr("content"), pageUrl);
  if (!embed) return Promise.resolve({ direct: [], embeds: [] });
  return fetchText(embed, { headers: { Referer: pageUrl } }).then(function (r) {
    var found = extractUrlsFromHtml(r.text, r.finalUrl);
    var e$ = cheerio.load(r.text);
    e$("ul#mirrorMenu a.mirror-opt[data-url]").each(function (_, el) {
      var u = absoluteUrl(e$(el).attr("data-url"), r.finalUrl); if (u) found.embeds.push(u);
    });
    found.embeds = unique(found.embeds);
    return found;
  }).catch(function () { return { direct: [], embeds: [embed] }; });
}

function resolveEmbed(url, referer, depth, visited) {
  if (!url || depth > 2 || visited[url]) return Promise.resolve([]);
  visited[url] = true;
  if (isDirectMedia(url)) return Promise.resolve([makeStream(url, referer, CONFIG.name)]);
  return fetchText(url, { headers: { Referer: referer || CONFIG.baseUrl } }).then(function (r) {
    var contentType = r.response && r.response.headers && r.response.headers.get ? String(r.response.headers.get("content-type") || "") : "";
    if (/video\//i.test(contentType) || isDirectMedia(r.finalUrl)) return [makeStream(r.finalUrl, referer, CONFIG.name)];
    var found = extractUrlsFromHtml(r.text, r.finalUrl), streams = [];
    for (var i = 0; i < found.direct.length; i += 1) streams.push(makeStream(found.direct[i], r.finalUrl, CONFIG.name));
    var next = found.embeds.slice(0, 3).map(function (u) { return resolveEmbed(u, r.finalUrl, depth + 1, visited); });
    return Promise.all(next).then(function (groups) {
      for (var j = 0; j < groups.length; j += 1) streams = streams.concat(groups[j]);
      return streams;
    });
  }).catch(function () { return []; });
}

function resolvePage(candidate, metadata) {
  return fetchText(candidate.url, { headers: { Referer: CONFIG.baseUrl } }).then(function (r) {
    var found = extractUrlsFromHtml(r.text, r.finalUrl);
    var special = Promise.resolve({ direct: [], embeds: [] });
    if (CONFIG.mode === "eporner") {
      special = specialEporner(r.text, r.finalUrl).then(function (urls) { return { direct: urls, embeds: [] }; });
    } else if (CONFIG.mode === "krx18") {
      special = specialKRX18(r.text, r.finalUrl);
    } else if (CONFIG.mode === "nurgay") {
      special = specialNurgay(r.text, r.finalUrl);
    }
    return special.then(function (extra) {
      found.direct = unique(found.direct.concat(extra.direct || []));
      found.embeds = unique(found.embeds.concat(extra.embeds || []));
      var label = metadata.title + (metadata.year ? " (" + metadata.year + ")" : "");
      var streams = found.direct.map(function (u) { return makeStream(u, r.finalUrl, label); });
      var jobs = found.embeds.slice(0, 4).map(function (u) { return resolveEmbed(u, r.finalUrl, 0, {}); });
      return Promise.all(jobs).then(function (groups) {
        for (var i = 0; i < groups.length; i += 1) streams = streams.concat(groups[i]);
        return streams;
      });
    });
  }).catch(function () { return []; });
}

function dedupeStreams(streams) {
  var seen = {}, out = [];
  for (var i = 0; i < streams.length; i += 1) {
    var s = streams[i];
    if (!s || !s.url || seen[s.url]) continue;
    seen[s.url] = true;
    out.push(s);
  }
  out.sort(function (a, b) {
    var qa = parseInt(a.quality, 10) || 0, qb = parseInt(b.quality, 10) || 0;
    return qb - qa;
  });
  return out;
}

function searchByMetadata(metadata) {
  var title = metadata.title || metadata.name || "";
  if (!title) return Promise.resolve([]);
  var directPage = metadata.url || (/^https?:\/\//i.test(title) ? title : "");
  if (directPage) return resolvePage({ url: directPage, title: title, score: 100 }, metadata).then(dedupeStreams);
  var queries = unique([title, metadata.originalTitle || ""]).slice(0, 2);
  var searchJobs = [];
  for (var qi = 0; qi < queries.length; qi += 1) {
    for (var ti = 0; ti < CONFIG.searchTemplates.length; ti += 1) {
      (function (query, url) {
        searchJobs.push(fetchText(url, { headers: { Referer: CONFIG.baseUrl } }).then(function (r) {
          return parseSearchPage(r.text, r.finalUrl, query, metadata.year);
        }).catch(function () { return []; }));
      })(queries[qi], expandSearchTemplate(CONFIG.searchTemplates[ti], queries[qi]));
    }
  }
  return Promise.all(searchJobs).then(function (groups) {
    var candidates = [], seen = {};
    for (var i = 0; i < groups.length; i += 1) {
      for (var j = 0; j < groups[i].length; j += 1) {
        if (!seen[groups[i][j].url]) { seen[groups[i][j].url] = true; candidates.push(groups[i][j]); }
      }
    }
    candidates.sort(function (a, b) { return b.score - a.score; });
    return Promise.all(candidates.slice(0, 2).map(function (c) { return resolvePage(c, metadata); })).then(function (results) {
      var streams = [];
      for (var k = 0; k < results.length; k += 1) streams = streams.concat(results[k]);
      return dedupeStreams(streams);
    });
  }).catch(function () { return []; });
}

function getStreams(tmdbId, mediaType, season, episode) {
  if (CONFIG.supportedTypes.indexOf(mediaType || "movie") === -1) return Promise.resolve([]);
  return getTmdbMetadata(tmdbId, mediaType || "movie", season, episode).then(searchByMetadata).catch(function () { return []; });
}

// Fuller Nuvio local-scraper contract used by runtimes that provide metadata directly.
function scrape(metadata) {
  metadata = metadata || {};
  return searchByMetadata({
    title: metadata.title || metadata.name || "",
    originalTitle: metadata.originalTitle || metadata.original_name || "",
    url: metadata.url || "",
    year: metadata.year || "",
    type: metadata.type || "movie",
    season: metadata.season,
    episode: metadata.episode
  });
}

module.exports = {
  getStreams: getStreams,
  scrape: scrape,
  searchByMetadata: searchByMetadata
};
