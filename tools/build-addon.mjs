import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../packages/shared/addon");
require("../packages/shared/router");
require("../packages/shared/directory-page");
require("node:fs").accessSync(new URL("../packages/shared/directory-server.js", import.meta.url));
console.log("Shared addon runtime loaded successfully.");
