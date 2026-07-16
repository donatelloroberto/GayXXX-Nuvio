import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.DIAGNOSTICS_SILENT = "true";
const require = createRequire(import.meta.url);
const configs = require("../packages/shared/provider-configs");
const { createProviderAddon } = require("../packages/shared/addon");
const { extractStreams } = require("../packages/shared/universal-extractor");
const { recordDiagnostic, diagnosticsSnapshot } = require("../packages/shared/diagnostics");

const gaycock = configs.find((item) => item.id === "gaycock4u");
const gaycockAddon = createProviderAddon(gaycock.id);
const filtered = gaycockAddon.parseCatalogPage(gaycock, `
  <article><a href="/categories/"><img src="/category.jpg" alt="Categories"></a></article>
  <article><a href="/this-is-a-real-video-title/"><img src="/video.jpg" alt="Playable title"></a></article>
`, gaycock.baseUrl);
assert.equal(filtered.length, 1, "navigation links must not become catalog videos");
assert.equal(filtered[0].name, "Playable title");

const eporner = configs.find((item) => item.id === "geporner");
const epornerAddon = createProviderAddon(eporner.id);
const epornerItems = epornerAddon.parseCatalogPage(eporner, `
  <div class="mb"><a href="/parentalcontrol/"><img src="/parental.jpg" alt="Parental control"></a></div>
  <div class="mb"><a href="/video-AB12CD34/a-long-playable-title/"><img src="/poster.jpg" alt="A playable title"></a></div>
`, eporner.baseUrl);
assert.equal(epornerItems.length, 1, "Eporner utility pages must be rejected");

const besthd = configs.find((item) => item.id === "besthdgayporn");
const besthdAddon = createProviderAddon(besthd.id);
const besthdItems = besthdAddon.parseCatalogPage(besthd, `
  <div class="aiovg-item-video"><a href="/2026/07/daniel-justice-fucks-pheremosa-cockyboys/"><img data-src="/wp-content/uploads/2026/07/daniel-justice-pheremosa-cockyboys.png" alt="9” Daniel Justice Fucks Pheremosa - CockyBoys"></a></div>
`, besthd.baseUrl);
assert.equal(besthdItems.length, 1);
assert.equal(besthdItems[0].poster, "https://besthdgayporn.com/wp-content/uploads/2026/07/daniel-justice-pheremosa-cockyboys.png");

const requestedId = gaycockAddon.createContentId(gaycock.id, "https://gaycock4u.com/this-is-a-real-video-title/", "Catalog title");
const parsedMeta = gaycockAddon.parseMetaPage(gaycock, "https://gaycock4u.com/this-is-a-real-video-title/", `
  <meta property="og:title" content="Canonical page title">
  <meta property="og:image" content="/poster.jpg">
  <meta property="og:description" content="Page description">
  <meta property="article:published_time" content="2025-04-03T12:00:00Z">
  <meta property="video:duration" content="3670">
`, "Catalog title", requestedId);
assert.equal(parsedMeta.id, requestedId, "metadata must preserve the catalog content ID");
assert.equal(parsedMeta.behaviorHints.defaultVideoId, requestedId);
assert.equal(parsedMeta.releaseInfo, "2025");
assert.equal(parsedMeta.runtime, "62 min");

const nurgay = configs.find((item) => item.id === "nurgay");
const nurgayAddon = createProviderAddon(nurgay.id);
const nurgayMeta = nurgayAddon.parseMetaPage(nurgay, "https://nurgay.to/fixture-video/", `
  <meta property="og:title" content="Nurgay Fixture">
  <meta itemprop="thumbnailUrl" content="/wp-content/uploads/poster.jpg">
  <meta itemprop="duration" content="P0DT2H10M0S">
`, "Nurgay Fixture");
assert.equal(nurgayMeta.poster, "https://nurgay.to/wp-content/uploads/poster.jpg");
assert.equal(nurgayMeta.runtime, "130 min");

const decorated = gaycockAddon.decoratePosterFields(parsedMeta, "https://addon.example");
assert.match(decorated.poster, /^https:\/\/addon\.example\/gaycock4u\/poster\//);
assert.equal(decorated.background, decorated.poster);

async function invoke(addon, url, method = "GET") {
  const headers = {};
  let body;
  const res = {
    statusCode: 0,
    setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
    end(value) { body = value; }
  };
  await addon.handleRequest({ url, method, headers: { host: "addon.example", "x-forwarded-proto": "https" } }, res);
  return { status: res.statusCode, headers, body };
}

const originalFetch = global.fetch;
global.fetch = async () => new Response("<title>Site Unavailable</title>", { status: 200, headers: { "Content-Type": "text/html" } });
try {
  const posterPath = new URL(decorated.poster).pathname.replace(/^\/gaycock4u/, "");
  const posterResponse = await invoke(gaycockAddon, posterPath);
  assert.equal(posterResponse.status, 200);
  assert.match(posterResponse.headers["content-type"], /^image\/svg\+xml/);
  assert.match(String(posterResponse.body), /Nurgay Fixture|Canonical page title/);
  const manifestResponse = await invoke(gaycockAddon, "/manifest.json");
  assert.equal(JSON.parse(String(manifestResponse.body)).logo, "https://addon.example/gaycock4u/logo.svg");
} finally {
  global.fetch = originalFetch;
}

const fetchedUrls = [];
global.fetch = async (url) => {
  const target = String(url);
  fetchedUrls.push(target);
  if (target === "https://fixture.example/video") {
    return new Response(`
      <video><source src="https://cdn.example/direct-1080.mp4"></video>
      <script type="application/ld+json">{"contentUrl":"https://cdn.example/json-720.m3u8"}</script>
      <iframe src="https://player.example/embed/123"></iframe>
      <a href="https://bsky.app/profile/gaystream.example">Social profile</a>
    `, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://player.example/embed/123") {
    return new Response(`<script>const source = "https://media.example/iframe-480.mp4";</script><ul id="mirrorMenu"><li><a class="mirror-opt" data-url="https://mirror.example/e/456">Mirror</a></li></ul>`, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  }
  if (target === "https://mirror.example/e/456") {
    return new Response(`<video src="https://media.example/mirror-360.mp4"></video>`, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  }
  throw new Error("unexpected fixture URL: " + target);
};
try {
  const streams = await extractStreams({ id: "fixture", name: "Fixture", baseUrl: "https://fixture.example/" }, "https://fixture.example/video", "runtime-test");
  assert.deepEqual(new Set(streams.map((item) => item.url)), new Set([
    "https://cdn.example/direct-1080.mp4",
    "https://cdn.example/json-720.m3u8",
    "https://media.example/iframe-480.mp4",
    "https://media.example/mirror-360.mp4"
  ]));
  assert.ok(!fetchedUrls.some((url) => url.includes("bsky.app")), "social links must not be probed as video players");
} finally {
  global.fetch = originalFetch;
}

global.fetch = async (url) => {
  const target = String(url);
  if (target.startsWith("https://nurgay.to/?filter=")) {
    return new Response("blocked", { status: 403, headers: { "Content-Type": "text/html" } });
  }
  if (target.startsWith("https://r.jina.ai/http://nurgay.to/?filter=")) {
    return new Response(`
      <article class="loop-video"><a href="https://nurgay.to/bel-ami-xl-files-2/"><img src="https://nurgay.to/poster.jpg" alt="Bel Ami XL Files 2"><h2>Bel Ami XL Files 2</h2></a></article>
    `, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://nurgay.to/bel-ami-xl-files-2/") {
    return new Response("blocked", { status: 403, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://r.jina.ai/http://nurgay.to/bel-ami-xl-files-2/") {
    return new Response(`
      <main><article itemprop="video">
        <meta itemprop="thumbnailUrl" content="https://nurgay.to/poster.jpg">
        <meta itemprop="embedUrl" content="https://listmirror.com/embed/U2iq7lwqt9">
        <div class="video-player"><iframe src="https://listmirror.com/embed/U2iq7lwqt9"></iframe></div>
      </article></main>
      <a data-trailer="https://cdn.example/related-trailer.mp4">Related video</a>
    `, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://listmirror.com/embed/U2iq7lwqt9") {
    return new Response(`<video src="https://media.example/nurgay-720.mp4"></video>`, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  throw new Error("unexpected Nurgay fixture URL: " + target);
};
try {
  const fallbackAddon = createProviderAddon("nurgay");
  const catalog = await fallbackAddon.getCatalog({}, "nurgay-catalog-test");
  assert.equal(catalog.metas.length, 1);
  assert.equal(catalog.metas[0].name, "Bel Ami XL Files 2");
  const meta = await fallbackAddon.getMeta(catalog.metas[0].id, "nurgay-meta-test");
  assert.equal(meta.meta.poster, "https://nurgay.to/poster.jpg");
  const streams = await extractStreams(nurgay, "https://nurgay.to/bel-ami-xl-files-2/", "nurgay-runtime-test");
  assert.deepEqual(streams.map((item) => item.url), ["https://media.example/nurgay-720.mp4"]);
} finally {
  global.fetch = originalFetch;
}

recordDiagnostic({
  level: "warn",
  provider: "fixture",
  stage: "stream",
  code: "FIXTURE_FAILURE",
  message: "token=secret-value authorization: Bearer also-secret failed at https://fixture.example/video?token=secret-value",
  url: "https://fixture.example/video?token=secret-value",
  status: 502,
  requestId: "fixture-request"
});
const snapshot = diagnosticsSnapshot({ provider: "fixture", stage: "stream", limit: 10 });
assert.equal(snapshot.matchingRecentCount, 1);
assert.equal(snapshot.recent[0].upstreamHost, "fixture.example");
assert.ok(!JSON.stringify(snapshot).includes("secret-value"), "diagnostics must redact secrets and URL paths");
assert.ok(!JSON.stringify(snapshot).includes("also-secret"));
assert.ok(!JSON.stringify(snapshot).includes("/video"));
assert.equal(snapshot.recent[0].status, 502);

console.log("Shared parser, metadata, extractor, and diagnostics fixtures passed.");
