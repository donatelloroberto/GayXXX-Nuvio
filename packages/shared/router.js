"use strict";

const { createProviderAddon, providerConfigs } = require("./addon");
const { renderDirectoryPage } = require("./directory-page");
const ids = new Set(providerConfigs.map((item) => item.id));
const instances = new Map();

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(body));
}

function sendHtml(res, body) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.end(body);
}

function handleSharedRequest(req, res) {
  const parsed = new URL(req.url || "/", "http://localhost");
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (!parts.length) {
    return sendHtml(res, renderDirectoryPage(providerConfigs));
  }
  if (parts.length === 1 && parts[0] === "addons.json") {
    return send(res, 200, {
      name: "GayXXX Individual Stremio Addons",
      addons: providerConfigs.map((item) => ({ id: item.id, name: item.name, manifest: `/${item.id}/manifest.json` }))
    });
  }
  const providerId = parts.shift();
  if (!ids.has(providerId)) return send(res, 404, { error: "Unknown addon" });
  if (!instances.has(providerId)) instances.set(providerId, createProviderAddon(providerId));
  parsed.pathname = "/" + parts.join("/");
  req.url = parsed.pathname + parsed.search;
  return instances.get(providerId).handleRequest(req, res);
}

module.exports = { handleSharedRequest };
