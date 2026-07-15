const base = String(process.argv[2] || process.env.ADDON_URL || "https://gay-xxx-nuvio.vercel.app").replace(/\/+$/, "");

async function getJson(path, timeoutMs = 70000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(base + path, { signal: controller.signal, headers: { "Cache-Control": "no-cache" } });
    const text = await response.text();
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}: ${text.slice(0, 200)}`);
    try { return JSON.parse(text); } catch { throw new Error(`${path}: response is not JSON: ${text.slice(0, 200)}`); }
  } finally {
    clearTimeout(timer);
  }
}

const health = await getJson("/health", 15000);
if (health.ok !== true || health.service !== "com.donatelloroberto.gayxxx") throw new Error("Invalid health response");

const manifest = await getJson("/manifest.json", 15000);
if (manifest.id !== "com.donatelloroberto.gayxxx") throw new Error("Manifest is still the old plugin-only format");
if (!Array.isArray(manifest.scrapers) || manifest.scrapers.length !== 26) throw new Error("Plugin scraper registry is missing");
if (!Array.isArray(manifest.catalogs) || !manifest.catalogs.some((x) => x.id === "gayxxx")) throw new Error("Addon catalog declaration is missing");

const catalog = await getJson("/catalog/movie/gayxxx.json");
if (!Array.isArray(catalog.metas)) throw new Error("Catalog response does not contain metas[]");

console.log(`OK: ${base}`);
console.log(`health=${health.version}, scrapers=${manifest.scrapers.length}, catalogItems=${catalog.metas.length}`);
