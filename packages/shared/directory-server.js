"use strict";

const http = require("node:http");
const { handleSharedRequest } = require("./router");

const port = Number(process.env.PORT || 7000);
const server = http.createServer((req, res) => Promise.resolve(handleSharedRequest(req, res)));
server.listen(port, () => console.log(`Addon directory: http://localhost:${port}`));

