"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var execute_1 = require("../controllers/execute");
var rateLimiter_1 = require("../middleware/rateLimiter");
var router = (0, express_1.Router)();
router.post("/", rateLimiter_1.rateLimiter, execute_1.executeCode);
exports.default = router;
