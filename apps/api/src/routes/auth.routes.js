"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var authControllers_1 = require("../controllers/authControllers");
var router = (0, express_1.Router)();
router.post("/session", authControllers_1.createSession);
exports.default = router;
