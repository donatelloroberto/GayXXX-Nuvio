import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
process.env.DIAGNOSTICS_SILENT = "true";
const require = createRequire(import.meta.url);
const configs = require("../packages/shared/provider-configs");
const { renderDirectoryPage } = require("../packages/shared/directory-page");
const { restoreRewrittenPath } = require("../api/index");
const netlify = require("../netlify/functions/index");
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
const vercelConfig = require("../vercel.json");
if (vercelConfig.rewrites[0].source !== "/" || vercelConfig.rewrites[0].destination !== "/api/index?route=") {
  throw new Error("Vercel root GUI rewrite is missing");
}
if (netlify.requestUrl({ queryStringParameters: { route: "gxtapes/manifest.json" } }) !== "/gxtapes/manifest.json") {
  throw new Error("Netlify route restoration is missing");
}
const netlifyRoot = await netlify.handler({
  httpMethod: "GET",
  headers: { host: "fixture.netlify.app", "x-forwarded-proto": "https" },
  queryStringParameters: { route: "" }
});
if (netlifyRoot.statusCode !== 200 || !netlifyRoot.body.includes("GayXXX Stremio Addons")) {
  throw new Error("Netlify root GUI function is missing");
}
const runtimeTestPath = fileURLToPath(new URL("./test-runtime.mjs", import.meta.url));
const runtime = spawnSync(process.execPath, [runtimeTestPath], {
  stdio: "inherit",
  env: { ...process.env, DIAGNOSTICS_SILENT: "true" }
});
if (runtime.status !== 0) process.exit(runtime.status || 1);
for (const config of configs) {
  const run = spawnSync(process.execPath, [addonTestPath, config.id], {
    stdio: "inherit",
    env: { ...process.env, DIAGNOSTICS_SILENT: "true" }
  });
  if (run.status !== 0) process.exit(run.status || 1);
}
console.log(`All ${configs.length} addon contracts passed.`);
