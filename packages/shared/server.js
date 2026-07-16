"use strict";

const http = require("node:http");
const { createProviderAddon } = require("./addon");

const providerId = process.argv[2] || process.env.PROVIDER_ID;
if (!providerId) throw new Error("Pass a provider id as the first argument or PROVIDER_ID");
const { handleRequest, addonManifest } = createProviderAddon(providerId);
const port = Number(process.env.PORT || 7000);
const server = http.createServer((req, res) => Promise.resolve(handleRequest(req, res)));
server.listen(port, () => console.log(`${addonManifest.name}: http://localhost:${port}/manifest.json`));

