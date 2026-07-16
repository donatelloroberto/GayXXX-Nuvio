"use strict";

const { handleSharedRequest } = require("../packages/shared/router");
module.exports = (req, res) => Promise.resolve(handleSharedRequest(req, res));

