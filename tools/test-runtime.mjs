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
const blvietsub = configs.find((item) => item.id === "blvietsub");
const javmoviechudai = configs.find((item) => item.id === "javmoviechudai");
const jayboys = configs.find((item) => item.id === "jayboys");
const pinoymoviepedia = configs.find((item) => item.id === "pinoymoviepedia");
assert.deepEqual(besthd.searchTemplates, ["/?s=%q%"], "BestHD must use the CloudStream WordPress search route");
assert.equal(besthd.card.title, ".aiovg-link-title");
const besthdAddon = createProviderAddon(besthd.id);
const besthdItems = besthdAddon.parseCatalogPage(besthd, `
  <div class="aiovg-item-video"><a href="/2026/07/daniel-justice-fucks-pheremosa-cockyboys/"><img data-src="/wp-content/uploads/2026/07/daniel-justice-pheremosa-cockyboys.png" alt="9” Daniel Justice Fucks Pheremosa - CockyBoys"></a></div>
`, besthd.baseUrl);
assert.equal(besthdItems.length, 1);
assert.equal(besthdItems[0].poster, "https://besthdgayporn.com/wp-content/uploads/2026/07/daniel-justice-pheremosa-cockyboys.png");

const javmovieAddon = createProviderAddon(javmoviechudai.id);
const javmovieItems = javmovieAddon.parseCatalogPage(javmoviechudai, `
  <article class="video-card"><a href="/fixture-javmovie/"><div class="art-poster" style="background-image:url('/posters/javmovie.jpg')"></div><h3 class="card-title">Javmovie Fixture</h3></a></article>
`, javmoviechudai.baseUrl);
assert.equal(javmovieItems[0].poster, "https://www.javmoviechudai.com/posters/javmovie.jpg", "CSS poster URLs must be preserved");

const jayboysAddon = createProviderAddon(jayboys.id);
assert.equal(jayboysAddon.parseCatalogPage(jayboys, `
  <div class="list-item"><div class="video col-2"><a class="thumb-video" href="/fixture-jayboys/"><img src="/posters/jayboys.jpg"></a><a class="denomination"><span class="title">Jayboys Fixture</span></a></div></div>
`, jayboys.baseUrl).length, 1);

const pinoyAddon = createProviderAddon(pinoymoviepedia.id);
assert.equal(pinoyAddon.parseCatalogPage(pinoymoviepedia, `
  <div class="items normal"><article><div class="poster"><img data-wpfc-original-src="/posters/pinoy.jpg"><a href="/movies/pinoy-fixture/"></a></div><div class="data"><h3><a href="/movies/pinoy-fixture/">Pinoy Fixture</a></h3></div></article></div>
`, pinoymoviepedia.baseUrl)[0].poster, "https://pinoymoviepedia.ru/posters/pinoy.jpg");

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
assert.equal(nurgay.streamStrategy, "mirror-menu");
assert.equal(nurgay.readerCatalogFallback, true);
const gaystream = configs.find((item) => item.id === "gaystream");
assert.deepEqual(gaystream.searchTemplates, ["/?s=%q%&page=1", "/?s=%q%&page=2"]);
assert.equal(gaystream.streamStrategy, "tabs-buttons");
const nurgayAddon = createProviderAddon(nurgay.id);
const nurgayMeta = nurgayAddon.parseMetaPage(nurgay, "https://nurgay.to/fixture-video/", `
  <meta property="og:title" content="Nurgay Fixture">
  <meta itemprop="thumbnailUrl" content="/wp-content/uploads/poster.jpg">
  <meta itemprop="duration" content="P0DT2H10M0S">
`, "Nurgay Fixture");
assert.equal(nurgayMeta.poster, "https://nurgay.to/wp-content/uploads/poster.jpg");
assert.equal(nurgayMeta.runtime, "130 min");

const gayxx = configs.find((item) => item.id === "gayxx");
const gxtapes = configs.find((item) => item.id === "gxtapes");
const menxtube = configs.find((item) => item.id === "menxtube");
assert.equal(gayxx.baseUrl, "https://asiangaysex.net", "Gayxx must follow the current CloudStream artifact domain");
assert.ok(gayxx.allowedHosts.includes("https://boyplus.net"));
assert.equal(gxtapes.baseUrl, "https://gay.xtapes.tw", "GXtapes must follow the current CloudStream artifact domain");
assert.ok(gxtapes.allowedHosts.includes("https://gayxtapes.tw"), "GXtapes must accept its canonical redirect host");
assert.equal(gxtapes.readerFallback, true, "catalog reader recovery must also cover detail pages");
assert.equal(menxtube.baseUrl, "https://gayxfans.com", "MenXtube must follow its current canonical redirect");
assert.equal(menxtube.readerFallback, true);
assert.equal(menxtube.itemSelector, "div.thumb-video.item");

const xhamster = configs.find((item) => item.id === "xhamster");
const xhamsterAddon = createProviderAddon(xhamster.id);
const xhamsterItems = xhamsterAddon.parseCatalogPage(xhamster, `
  <script id="initials-script">window.initials={"layoutPage":{"videoListProps":{"videoThumbProps":[{"id":123,"title":"Initials fixture","pageURL":"https://vi.xhspot.com/videos/xhFixture","thumbURL":"https://img.example/xh.webp"}]}}};</script>
`, xhamster.baseUrl);
assert.equal(xhamsterItems.length, 1, "Xhamster catalog must parse its current initials JSON payload");
assert.equal(xhamsterItems[0].poster, "https://img.example/xh.webp");

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

global.fetch = async () => { throw new DOMException("fixture timeout", "TimeoutError"); };
try {
  const timedOut = await besthdAddon.getCatalog({}, "readonly-timeout-test");
  assert.deepEqual(timedOut.metas, [], "a provider timeout must degrade to an empty catalog response");
  const timeoutDiagnostics = diagnosticsSnapshot({ provider: "besthdgayporn", stage: "catalog", limit: 20 });
  assert.ok(timeoutDiagnostics.recent.some((item) => item.code === "TIMEOUT"), "read-only DOMException codes must be normalized without masking the timeout");
  assert.ok(!timeoutDiagnostics.recent.some((item) => /only a getter/i.test(item.message)), "timeout diagnostics must not contain the old read-only property error");
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

const readerCatalogRequests = [];
global.fetch = async (url, options = {}) => {
  const target = String(url);
  readerCatalogRequests.push({ target, headers: new Headers(options.headers || {}) });
  if (target.startsWith("https://www.eporner.com/cat/gay/")) {
    return new Response("<html><title>Consent</title></html>", { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target.startsWith("https://r.jina.ai/http://www.eporner.com/cat/gay/")) {
    return new Response(`
      <div id="div-search-results"><div class="mb"><div class="mbcontent"><a href="https://www.eporner.com/video-AB12CD34/reader-fixture/"><img src="https://img.example/reader.jpg"></a></div><div class="mbunder"><p class="mbtit"><a>Reader fixture</a></p></div></div></div>
    `, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  throw new Error("unexpected reader catalog fixture URL: " + target);
};
try {
  const recovered = await createProviderAddon("geporner").getCatalog({}, "reader-catalog-test");
  assert.equal(recovered.metas.length, 1, "an unparseable 200 response must retry through the catalog reader");
  assert.equal(recovered.metas[0].name, "Reader fixture");
  for (const request of readerCatalogRequests.filter((item) => item.target.startsWith("https://r.jina.ai/"))) {
    assert.equal(request.headers.get("user-agent"), null, "reader requests must not send the upstream browser fingerprint");
    assert.equal(request.headers.get("referer"), null, "reader requests must not send a synthetic reader referer");
  }
} finally {
  global.fetch = originalFetch;
}

const sourceFaithfulFetches = [];
global.fetch = async (url, options = {}) => {
  const target = String(url);
  sourceFaithfulFetches.push({ target, headers: new Headers(options.headers || {}) });
  if (target === "https://gaystream.pw/video/source-faithful/") {
    return new Response(`
      <div class="tabs-wrap"><button onclick="document.getElementById('ifr').src='https://listmirror.com/embed/source-list'">Mirror</button></div>
      <iframe id="ifr"></iframe>
    `, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://listmirror.com/embed/source-list") {
    return new Response(`<script>const sources = [
      {"url":"https://jilliandescribecompany.com/e/voe-fixture"},
      {"url":"https://vide0.net/e/dood-fixture"}
    ];</script>`, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://jilliandescribecompany.com/e/voe-fixture") {
    return new Response(`<script>const sources = {"hls":"https://cdn.example/voe-master.m3u8","video_height":720};</script>`, {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  }
  if (target === "https://vide0.net/e/dood-fixture") {
    return new Response(`<script>const pass='/pass_md5/fixture?token=dood-token';</script>`, {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  }
  if (target === "https://vide0.net/pass_md5/fixture?token=dood-token") {
    return new Response("https://cdn.example/dood-video-", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  if (target === "https://nurgay.to/source-faithful/") {
    return new Response(`
      <main><article itemprop="video"><div class="video-player"></div></article></main>
      <ul id="mirrorMenu"><li><a class="mirror-opt" data-url="https://tapepops.com/e/tape-fixture">Tape</a></li></ul>
    `, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://tapepops.com/e/tape-fixture") {
    return new Response(`<script>document.getElementById('norobotlink').innerHTML = '//delivery.example/get_video?id=' + ('XYZ').substring(1);</script>`, {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  }
  if (target === "https://besthdgayporn.com/source-faithful/") {
    return new Response(`<video><source src="https://cdn.example/besthd-1080.mp4"></video>`, {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  }
  if (target === "https://www.blvietsub.vip/source-faithful.html") {
    return new Response(`<div name="main-movie-list">[FULL|https://ssplay.net/v/source-fixture.html]</div>`, {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  }
  if (target === "https://ssplay.net/v/source-fixture.html") {
    return new Response(`<script>eval(function(p,a,c,k,e,d){return p}('0({1:[{"2":"3","4":"5"}]});',62,6,'setup|sources|file|/SU/source-fixture.html|label|1080p'.split('|')))</script>`, {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  }
  if (target === "https://ssplay.net/SU/source-fixture.html") {
    return new Response("#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=4000000\nhttps://cdn.example/blvietsub-1080.m3u8", {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  }
  if (target === "https://www.javmoviechudai.com/source-faithful/") {
    const encoded = Buffer.from(JSON.stringify({ servers: [{ label: "Server 1", url: "https://player.example/embed/javmovie" }] })).toString("base64");
    return new Response(`<video class="art-video" data-v="${encoded}"></video>`, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://player.example/embed/javmovie") {
    return new Response(`<video src="https://cdn.example/javmovie-720.mp4"></video>`, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://javboys.tv/source-faithful/") {
    return new Response(`<div id="player" data-src="https://player.example/embed/jayboys"></div>`, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://player.example/embed/jayboys") {
    return new Response(`<source src="https://cdn.example/jayboys-1080.mp4">`, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://pinoymoviepedia.ru/movies/source-faithful/") {
    return new Response(`<div class="pframe"><iframe src="https://streamhls.to/e/pinoy-fixture"></iframe></div>`, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (target === "https://streamhls.to/e/pinoy-fixture") {
    return new Response(`<script>const source={file:"https://cdn.example/pinoy-master.m3u8"};</script>`, { status: 200, headers: { "Content-Type": "text/html" } });
  }
  throw new Error("unexpected source-faithful fixture URL: " + target);
};
try {
  const gaystreamStreams = await extractStreams(gaystream, "https://gaystream.pw/video/source-faithful/", "gaystream-source-test");
  assert.ok(gaystreamStreams.some((item) => item.url === "https://cdn.example/voe-master.m3u8"), "GayStream must follow tab -> ListMirror -> Voe");
  assert.ok(gaystreamStreams.some((item) => item.url.startsWith("https://cdn.example/dood-video-") && item.url.includes("token=dood-token")), "GayStream must resolve the vide0/Dood pass_md5 flow");

  const nurgayStreams = await extractStreams(nurgay, "https://nurgay.to/source-faithful/", "nurgay-source-test");
  assert.ok(nurgayStreams.some((item) => item.url === "https://delivery.example/get_video?id=YZ"), "Nurgay must follow mirror-menu StreamTape aliases");

  const besthdStreams = await extractStreams(besthd, "https://besthdgayporn.com/source-faithful/", "besthd-source-test");
  assert.deepEqual(besthdStreams.map((item) => item.url), ["https://cdn.example/besthd-1080.mp4"]);
  const besthdRequest = sourceFaithfulFetches.find((item) => item.target === "https://besthdgayporn.com/source-faithful/");
  assert.match(besthdRequest.headers.get("user-agent") || "", /Firefox\/139\.0/);
  assert.equal(besthdRequest.headers.get("cookie"), "hasVisited=1; accessAgeDisclaimerPH=1");

  const blvietsubStreams = await extractStreams(blvietsub, "https://www.blvietsub.vip/source-faithful.html", "blvietsub-source-test");
  assert.deepEqual(blvietsubStreams.map((item) => item.url), ["https://ssplay.net/SU/source-fixture.html"], "BLvietsub must parse its literal episode token, unpack ssPlay, and recognize its mislabeled HLS response");

  assert.deepEqual((await extractStreams(javmoviechudai, "https://www.javmoviechudai.com/source-faithful/", "javmovie-source-test")).map((item) => item.url), ["https://cdn.example/javmovie-720.mp4"]);
  assert.deepEqual((await extractStreams(jayboys, "https://javboys.tv/source-faithful/", "jayboys-source-test")).map((item) => item.url), ["https://cdn.example/jayboys-1080.mp4"]);
  assert.deepEqual((await extractStreams(pinoymoviepedia, "https://pinoymoviepedia.ru/movies/source-faithful/", "pinoy-source-test")).map((item) => item.url), ["https://cdn.example/pinoy-master.m3u8"]);
} finally {
  global.fetch = originalFetch;
}

const nurgayReaderRequests = [];
global.fetch = async (url, options = {}) => {
  const target = String(url);
  if (target.startsWith("https://r.jina.ai/")) nurgayReaderRequests.push(new Headers(options.headers || {}));
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
  assert.ok(nurgayReaderRequests.length >= 2);
  for (const headers of nurgayReaderRequests) {
    assert.equal(headers.get("user-agent"), null);
    assert.equal(headers.get("accept-language"), null);
    assert.equal(headers.get("referer"), null);
  }
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
