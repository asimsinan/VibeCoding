#!/usr/bin/env node
"use strict";
/**
 * Request Logger Middleware
 *
 * Custom request logging for the API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding, cb) {
        const duration = Date.now() - start;
        console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        return originalEnd.call(this, chunk, encoding, cb);
    };
    next();
};
exports.requestLogger = requestLogger;
