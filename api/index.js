"use strict";

const { handleSharedRequest } = require("../packages/shared/router");

function restoreRewrittenPath(req) {
  const parsed = new URL(req.url || "/", "http://localhost");
  if (!parsed.searchParams.has("route")) return;
  const route = parsed.searchParams.get("route") || "";
  parsed.searchParams.delete("route");
  const search = parsed.searchParams.toString();
  req.url = "/" + route.replace(/^\/+/, "") + (search ? "?" + search : "");
}

module.exports = (req, res) => {
  restoreRewrittenPath(req);
  return Promise.resolve(handleSharedRequest(req, res));
};
module.exports.restoreRewrittenPath = restoreRewrittenPath;
