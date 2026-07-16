import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

function response(body, url, contentType = "text/html") {
  return {
    ok: true, status: 200, url,
    headers: { get(name) { return name.toLowerCase() === "content-type" ? contentType : ""; } },
    text() { return Promise.resolve(body); },
    json() { return Promise.resolve(JSON.parse(body)); }
  };
}

let failed = [];
for (const scraper of manifest.scrapers) {
  const code = fs.readFileSync(path.join(root, scraper.filename), "utf8");
  const module = { exports: {} };
  const fetch = (url) => {
    if (String(url).includes("api.themoviedb.org")) {
      return Promise.resolve(response(JSON.stringify({ title: "Fixture Title", release_date: "2024-01-01" }), url, "application/json"));
    }
    if (/search|\?s=|\?q=|\?k=|search-videos|home\?search/.test(String(url))) {
      return Promise.resolve(response(`<html><body><article><a href="https://fixture.invalid/watch"><h2>Fixture Title</h2></a></article><div class="item video-item video-card thumb-block grid-item aiovg-item-video col-xl-4 mobile-video-thumb card border-0 blog-entry phimitem videopost"><a href="https://fixture.invalid/watch" title="Fixture Title">Fixture Title</a></div></body></html>`, url));
    }
    return Promise.resolve(response(`<html><body><video><source src="https://cdn.fixture.invalid/video-1080.mp4"></video></body></html>`, url));
  };
  const context = vm.createContext({ module, exports: module.exports, require, fetch, URL, URLSearchParams, console, Promise, JSON, encodeURIComponent, decodeURIComponent, setTimeout, clearTimeout });
  try {
    new vm.Script(code, { filename: scraper.filename }).runInContext(context);
    if (typeof module.exports.getStreams !== "function") throw new Error("getStreams is not a function");
    const streams = await module.exports.getStreams(1, "movie");
    if (!Array.isArray(streams)) throw new Error("result is not an array");
    if (streams.length === 0) throw new Error("fixture produced no streams");
    if (!streams[0].url || !streams[0].url.includes("cdn.fixture.invalid")) throw new Error("unexpected stream URL");
  } catch (e) {
    failed.push(`${scraper.id}: ${e.message}`);
  }
}
if (failed.length) {
  console.error(failed.join("\n"));
  process.exit(1);
}
console.log(`OK: loaded and invoked ${manifest.scrapers.length} providers with fixture HTTP responses.`);
