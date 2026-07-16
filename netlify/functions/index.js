"use strict";

const { handleSharedRequest } = require("../../packages/shared/router");

function requestUrl(event) {
  const query = new URLSearchParams(event.queryStringParameters || {});
  const route = query.get("route") || "";
  query.delete("route");
  const search = query.toString();
  return "/" + route.replace(/^\/+/, "") + (search ? "?" + search : "");
}

function isBinaryResponse(headers) {
  const contentType = String(headers["Content-Type"] || headers["content-type"] || "");
  return !/^text\//i.test(contentType) && !/(?:json|javascript|xml|svg)/i.test(contentType);
}

exports.handler = async function handler(event) {
  const headers = {};
  let payload = Buffer.alloc(0);
  const req = {
    method: event.httpMethod || "GET",
    headers: event.headers || {},
    url: requestUrl(event)
  };
  const res = {
    statusCode: 200,
    setHeader(name, value) {
      headers[name] = Array.isArray(value) ? value.join(", ") : String(value);
    },
    end(value) {
      payload = value == null ? Buffer.alloc(0) : Buffer.isBuffer(value) ? value : Buffer.from(String(value));
    }
  };

  await Promise.resolve(handleSharedRequest(req, res));
  const binary = isBinaryResponse(headers);
  return {
    statusCode: res.statusCode,
    headers,
    body: payload.toString(binary ? "base64" : "utf8"),
    isBase64Encoded: binary
  };
};

exports.requestUrl = requestUrl;
