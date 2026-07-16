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

const originalFetch = global.fetch;
global.fetch = async (url) => {
  const target = String(url);
  if (target === "https://fixture.example/video") {
    return new Response(`
      <video><source src="https://cdn.example/direct-1080.mp4"></video>
      <script type="application/ld+json">{"contentUrl":"https://cdn.example/json-720.m3u8"}</script>
      <iframe src="https://player.example/embed/123"></iframe>
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
