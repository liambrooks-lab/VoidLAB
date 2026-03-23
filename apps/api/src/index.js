"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
var express_1 = require("express");
var auth_routes_1 = require("./routes/auth.routes");
var execute_routes_1 = require("./routes/execute.routes");
dotenv_1.default.config();
var app = (0, express_1.default)();
var port = Number(process.env.PORT || 5000);
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: "2mb" }));
app.get("/", function (_req, res) {
    res.json({
        name: "VoidLAB API",
        status: "online",
    });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/execute", execute_routes_1.default);
app.listen(port, function () {
    console.log("VoidLAB API listening on http://localhost:".concat(port));
});
