import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const configs = require("../packages/shared/provider-configs");
const { renderDirectoryPage } = require("../packages/shared/directory-page");
const { restoreRewrittenPath } = require("../api/index");
const addonTestPath = fileURLToPath(new URL("./test-addon.mjs", import.meta.url));
const manifests = configs.map((config) => require("../packages/shared/addon").createProviderAddon(config.id).addonManifest);
if (new Set(manifests.map((item) => item.id)).size !== manifests.length) throw new Error("Duplicate manifest ids");
if (new Set(manifests.map((item) => item.catalogs[0].id)).size !== manifests.length) throw new Error("Duplicate catalog ids");
const directory = renderDirectoryPage(configs);
if (!directory.includes("Install in Stremio") || !directory.includes("navigator.clipboard")) throw new Error("Directory actions are missing");
for (const config of configs) {
  if (!directory.includes(`community.${config.id}`)) throw new Error(`Directory is missing ${config.id}`);
}
const rewrittenManifest = { url: "/api/index?route=gxtapes/manifest.json" };
restoreRewrittenPath(rewrittenManifest);
if (rewrittenManifest.url !== "/gxtapes/manifest.json") throw new Error("Vercel manifest rewrite was not restored");
const rewrittenCatalog = { url: "/api/index?route=gxtapes/catalog/movie/community.gxtapes.catalog/search=demo.json&skip=0" };
restoreRewrittenPath(rewrittenCatalog);
if (!rewrittenCatalog.url.startsWith("/gxtapes/catalog/")) throw new Error("Vercel catalog rewrite was not restored");
for (const config of configs) {
  const run = spawnSync(process.execPath, [addonTestPath, config.id], { stdio: "inherit" });
  if (run.status !== 0) process.exit(run.status || 1);
}
console.log(`All ${configs.length} addon contracts passed.`);
