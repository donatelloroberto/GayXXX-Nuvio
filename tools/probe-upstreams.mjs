import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const cheerio = require("cheerio-without-node-native");
const configs = require("../packages/shared/provider-configs");
const timeoutMs = Number(process.env.PROBE_TIMEOUT_MS || 20000);
const concurrency = Math.max(1, Number(process.env.PROBE_CONCURRENCY || 4));
const output = process.env.PROBE_OUTPUT || "upstream-probe.json";
const rows = [];
let cursor = 0;

async function probe(config) {
  const started = Date.now();
  try {
    const response = await fetch(config.baseUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8"
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $("title").first().text().replace(/\s+/g, " ").trim();
    const configured = $(config.itemSelector).length;
    const generic = $("article, .video-item, .item, .thumb-block, li").length;
    const row = {
      id: config.id,
      status: response.status,
      finalUrl: response.url,
      bytes: Buffer.byteLength(html),
      ms: Date.now() - started,
      title,
      configured,
      generic,
      links: $("a[href]").length,
      iframes: $("iframe[src],iframe[data-src]").length,
      challenge: /cloudflare|just a moment|captcha|access denied|attention required/i.test(title + " " + html.slice(0, 5000))
    };
    console.log(`${row.id.padEnd(18)} ${String(row.status).padStart(3)} cfg=${String(configured).padStart(3)} generic=${String(generic).padStart(3)} bytes=${String(row.bytes).padStart(7)} ${row.challenge ? "CHALLENGE " : ""}${title.slice(0, 55)}`);
    return row;
  } catch (error) {
    const row = { id: config.id, status: 0, error: error.message, ms: Date.now() - started };
    console.log(`${row.id.padEnd(18)} ERR ${row.error}`);
    return row;
  }
}

async function worker() {
  while (cursor < configs.length) rows.push(await probe(configs[cursor++]));
}
await Promise.all(Array.from({ length: concurrency }, () => worker()));
rows.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2) + "\n");
console.log(`Report: ${output}`);

