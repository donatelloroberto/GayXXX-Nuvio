import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const addon = require("../server/addon.js");

const pageUrl = "https://besthdgayporn.com/video/sample-video/";
const catalogHtml = `
<html><body>
  <div class="aiovg-item-video">
    <a href="${pageUrl}" title="Sample Video"><img data-src="https://cdn.example/poster.jpg" alt="Sample Video"></a>
    <h3>Sample Video</h3>
  </div>
</body></html>`;
const metaHtml = `
<html><head>
  <meta property="og:title" content="Sample Video">
  <meta property="og:image" content="https://cdn.example/poster.jpg">
  <meta property="og:description" content="Fixture description">
</head><body><h1>Sample Video</h1><video><source src="https://cdn.example/video-1080.mp4"></video></body></html>`;

const parsed = addon.parseCatalogPage(
  { id: "besthdgayporn", name: "BestHDgayporn", baseUrl: "https://besthdgayporn.com", origin: "https://besthdgayporn.com", itemSelector: "div.aiovg-item-video", logo: "" },
  catalogHtml,
  "https://besthdgayporn.com/"
);
assert.equal(parsed.length, 1);
assert.equal(parsed[0].name, "Sample Video");
const decoded = addon.decodeContentId(parsed[0].id);
assert.equal(decoded.sourceUrl, pageUrl);

const originalFetch = global.fetch;
global.fetch = async (url) => {
  const target = String(url);
  const body = target === "https://besthdgayporn.com" ? catalogHtml : metaHtml;
  return {
    ok: true,
    status: 200,
    url: target,
    headers: { get: (name) => name.toLowerCase() === "content-type" ? "text/html" : null },
    text: async () => body,
    json: async () => JSON.parse(body)
  };
};

try {
  const catalog = await addon.getCatalog({ genre: "BestHDgayporn" });
  assert.equal(catalog.metas.length, 1);
  const meta = await addon.getMeta(catalog.metas[0].id);
  assert.equal(meta.meta.name, "Sample Video");
  const streams = await addon.getStreams(catalog.metas[0].id);
  assert.equal(streams.streams.length, 1);
  assert.equal(streams.streams[0].url, "https://cdn.example/video-1080.mp4");
  assert.equal(addon.addonManifest.resources.length, 3);
  console.log("Addon catalog/meta/stream fixtures passed.");
} finally {
  global.fetch = originalFetch;
}
