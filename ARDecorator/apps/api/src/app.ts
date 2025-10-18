import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './api/routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './lib/utils/logger.js';

export function createApp() {
  const app = express();

  // CORS configuration - MUST be first middleware
  const corsOptions = {
    origin: [
      'https://web-dun-ten-40.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Cache-Control',
      'Pragma',
      'Expires'
    ],
    optionsSuccessStatus: 200
  };
  
  // Apply CORS before any other middleware
  app.use(cors(corsOptions));
  
  // Handle preflight requests explicitly
  app.options('*', cors(corsOptions));

  // Middleware
  app.use(helmet());
  
  // Increase timeout for large image uploads
  app.use((req, res, next) => {
    req.setTimeout(300000); // 5 minutes timeout
    res.setTimeout(300000); // 5 minutes timeout
    next();
  });
  
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));

  // Request logging
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      ip: req.ip,
    });
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1', routes);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}

