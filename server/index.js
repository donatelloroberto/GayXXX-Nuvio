"use strict";

const http = require("node:http");
const { handleRequest } = require("./addon");

const port = Number(process.env.PORT || 7000);
const server = http.createServer((req, res) => {
  Promise.resolve(handleRequest(req, res)).catch((error) => {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: error.message || "Internal server error" }));
  });
});

server.listen(port, () => {
  console.log(`GayXXX addon listening on http://localhost:${port}/manifest.json`);
});
