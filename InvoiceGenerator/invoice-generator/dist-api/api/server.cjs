#!/usr/bin/env node
"use strict";
/**
 * Invoice Generator API Server
 *
 * Express.js server implementing RESTful API endpoints
 * for invoice management and PDF generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const invoiceRoutes_1 = require("./routes/invoiceRoutes.cjs");
const errorHandler_1 = require("./middleware/errorHandler.cjs");
const requestLogger_1 = require("./middleware/requestLogger.cjs");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://invoice-generator-three-weld.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));
// Compression middleware
app.use((0, compression_1.default)());
// Request logging
app.use((0, morgan_1.default)('combined'));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Custom request logger
app.use(requestLogger_1.requestLogger);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
    });
});
// API routes
app.use('/api/v1', invoiceRoutes_1.invoiceRoutes);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        error: 'NotFoundError',
        message: 'Endpoint not found',
        code: 'ENDPOINT_NOT_FOUND'
    });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Invoice Generator API server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`📚 API docs: http://localhost:${PORT}/api/v1`);
    });
}
exports.default = app;
