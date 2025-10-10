/**
 * API Server
 * Basic Express server for testing purposes
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (placeholder implementations for testing)
app.post('/api/v1/rooms', (_req, res) => {
  // This will fail in tests - that's expected in Red phase
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/rooms', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/rooms/:roomId', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/rooms/:roomId/join', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/rooms/:roomId/leave', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/rooms/:roomId/messages', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/rooms/:roomId/messages', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

app.delete('/api/v1/rooms/:roomId', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

// WebSocket endpoint (placeholder)
app.get('/ws/rooms/:roomId', (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

export { app };
