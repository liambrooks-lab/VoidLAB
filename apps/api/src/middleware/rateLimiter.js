"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
var requestMap = new Map();
var windowMs = 60000;
var maxRequests = 30;
var rateLimiter = function (req, res, next) {
    var key = req.ip || "anonymous";
    var now = Date.now();
    var entry = requestMap.get(key);
    if (!entry || now - entry.start > windowMs) {
        requestMap.set(key, { count: 1, start: now });
        return next();
    }
    if (entry.count >= maxRequests) {
        return res.status(429).json({
            error: "Rate limit exceeded. Please wait a moment and try again.",
        });
    }
    entry.count += 1;
    requestMap.set(key, entry);
    return next();
};
exports.rateLimiter = rateLimiter;
