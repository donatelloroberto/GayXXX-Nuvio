import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.DIAGNOSTICS_SILENT = "true";
const require = createRequire(import.meta.url);
const { createProviderAddon } = require("../packages/shared/addon");
const providers = require("../packages/shared/providers");
const providerId = process.argv[2];
assert.ok(providerId, "provider id is required");

const originalFetch = global.fetch;
const originalScrape = providers[providerId].scrape;
const pageUrlByHost = new Map();
const config = require("../packages/shared/provider-configs").find((item) => item.id === providerId);
const detailUrl = new URL("/fixture-video", config.baseUrl).toString();
const catalogHtml = `<article class="video-item item thumb-block aiovg-item-video"><a href="${detailUrl}" title="Fixture Video"><img src="https://img.example/poster.jpg" alt="Fixture Video"></a><h3>Fixture Video</h3></article>`;
const metaHtml = `<meta property="og:title" content="Fixture Video"><meta property="og:image" content="https://img.example/poster.jpg"><meta property="og:description" content="Fixture description"><h1>Fixture Video</h1>`;

global.fetch = async (url) => ({
  ok: true, status: 200, url: String(url),
  text: async () => String(url).includes("fixture-video") ? metaHtml : catalogHtml,
  json: async () => ({})
});
providers[providerId].scrape = async () => [{
  name: config.name, quality: "1080p", url: "https://media.example/video.mp4",
  headers: { Referer: detailUrl, Origin: new URL(config.baseUrl).origin }
}];

try {
  const addon = createProviderAddon(providerId);
  assert.equal(addon.addonManifest.id, `community.${providerId}`);
  assert.equal(addon.addonManifest.catalogs[0].id, `community.${providerId}.catalog`);
  const catalog = await addon.getCatalog({});
  assert.ok(Array.isArray(catalog.metas));
  assert.equal(catalog.metas.length, 1);
  const meta = await addon.getMeta(catalog.metas[0].id);
  assert.equal(meta.meta.name, "Fixture Video");
  const streams = await addon.getStreams(catalog.metas[0].id);
  assert.equal(streams.streams[0].url, "https://media.example/video.mp4");
  assert.equal(streams.streams[0].behaviorHints.proxyHeaders.request.Referer, detailUrl);
  assert.notEqual(streams.streams[0].behaviorHints.notWebReady, true, "request headers must not hide playable streams from Stremio Web");
  assert.throws(() => addon.decodeContentId("invalid:id"));
  global.fetch = async () => { throw new Error("fixture network failure"); };
  const failedCatalog = await createProviderAddon(providerId).getCatalog({});
  assert.deepEqual(failedCatalog, { metas: [] });
  console.log(`${providerId}: manifest/catalog/meta/stream/invalid-id fixtures passed`);
} finally {
  global.fetch = originalFetch;
  providers[providerId].scrape = originalScrape;
}
