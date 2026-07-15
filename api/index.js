"use strict";

const { handleRequest } = require("../server/addon");

module.exports = async function handler(req, res) {
  const route = req.query && req.query.route;
  if (route !== undefined) {
    const path = Array.isArray(route) ? route.join("/") : String(route || "");
    req.url = "/" + path.replace(/^\/+/, "");
  }
  return handleRequest(req, res);
};
