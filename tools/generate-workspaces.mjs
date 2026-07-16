import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const configs = require("../packages/shared/provider-configs");
const root = path.resolve(import.meta.dirname, "..");

for (const config of configs) {
  const dir = path.join(root, "addons", config.id);
  fs.mkdirSync(dir, { recursive: true });
  const pkg = {
    name: `@gayxxx/${config.id}`,
    version: "1.0.0",
    private: true,
    scripts: {
      start: `node ../../packages/shared/server.js ${config.id}`,
      dev: `node ../../packages/shared/server.js ${config.id}`,
      build: "node ../../tools/build-addon.mjs",
      test: `node ../../tools/test-addon.mjs ${config.id}`
    }
  };
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "README.md"), `# ${config.name}\n\nIndependent Stremio addon for ${config.name}.\n\n- Manifest ID: \`community.${config.id}\`\n- Resources: catalog, meta, stream\n- Content type: movie\n- Local run: \`npm run dev --workspace addons/${config.id}\`\n- Local manifest: \`http://localhost:7000/manifest.json\`\n- Shared deployment manifest: \`https://DEPLOYED-HOST/${config.id}/manifest.json\`\n- Environment: \`PORT\`, \`FETCH_TIMEOUT_MS\`, \`PROVIDER_TIMEOUT_MS\`, \`CACHE_TTL_MS\`, optional \`TMDB_API_KEY\`\n\nDeploy the repository to Vercel with the root configuration. Upstream markup or host protection can require extractor maintenance.\n`);
}
