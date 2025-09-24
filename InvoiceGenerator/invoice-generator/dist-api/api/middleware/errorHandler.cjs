#!/usr/bin/env node
"use strict";
/**
 * Error Handler Middleware
 *
 * Centralized error handling for the API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, req, res, _next) => {
    console.error('API Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Handle validation errors
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: error.message,
            code: error.code,
            field: error.field
        });
        return;
    }
    // Handle validation errors from service layer
    if (error.message && error.message.includes('Validation failed')) {
        res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: error.message
        });
        return;
    }
    // Handle PDF generation errors
    if (error.message && error.message.includes('Failed to generate PDF')) {
        res.status(500).json({
            success: false,
            error: 'PDFGenerationError',
            message: 'Failed to generate PDF'
        });
        return;
    }
    // Handle not found errors
    if (error.message && error.message.includes('not found')) {
        res.status(404).json({
            success: false,
            error: 'NotFoundError',
            message: error.message
        });
        return;
    }
    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        res.status(400).json({
            success: false,
            error: 'InvalidJSONError',
            message: 'Invalid JSON in request body'
        });
        return;
    }
    // Default error response
    res.status(500).json({
        success: false,
        error: 'InternalServerError',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : error.message || 'An unexpected error occurred'
    });
};
exports.errorHandler = errorHandler;
