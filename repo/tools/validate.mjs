import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const errors = [];
const ids = new Set();

if (!Array.isArray(manifest.scrapers) || manifest.scrapers.length === 0) errors.push("manifest.scrapers is empty");
for (const scraper of manifest.scrapers || []) {
  if (!scraper.id || ids.has(scraper.id)) errors.push(`invalid/duplicate id: ${scraper.id}`);
  ids.add(scraper.id);
  const file = path.join(root, scraper.filename || "");
  if (!fs.existsSync(file)) { errors.push(`missing file: ${scraper.filename}`); continue; }
  const code = fs.readFileSync(file, "utf8");
  try { new vm.Script(code, { filename: scraper.filename }); } catch (e) { errors.push(`${scraper.filename}: ${e.message}`); }
  if (!/module\.exports\s*=/.test(code) || !/getStreams/.test(code)) errors.push(`${scraper.filename}: missing getStreams export`);
  if (/require\(["'](?!cheerio-without-node-native)/.test(code)) errors.push(`${scraper.filename}: unsupported require()`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${manifest.scrapers.length} scraper entries, unique IDs, valid JavaScript syntax, and supported imports.`);
