/**
 * Express App Implementation
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Implementation (GREEN phase)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { SQLiteDatabase } from '../lib/database/SQLiteDatabase';
import { createRecipeRoutes } from './routes/recipeRoutes';
import { createIngredientRoutes } from './routes/ingredientRoutes';
import { ErrorMiddleware } from './middleware/ErrorMiddleware';
import { SecurityMiddleware } from './middleware/SecurityMiddleware';

export function createApp(database: SQLiteDatabase): express.Application {
  const app = express();
  const errorMiddleware = new ErrorMiddleware();
  const securityMiddleware = new SecurityMiddleware();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

  // Request logging
  app.use(morgan('combined'));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom security middleware
  app.use(securityMiddleware.setupSecurity.bind(securityMiddleware));
  app.use(securityMiddleware.rateLimit.bind(securityMiddleware));

  // API routes
  app.use('/api/v1/recipes', createRecipeRoutes(database));
  app.use('/api/v1/ingredients', createIngredientRoutes(database));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use(errorMiddleware.handleNotFound.bind(errorMiddleware));

  // Error handler
  app.use(errorMiddleware.handleError.bind(errorMiddleware));

  return app;
}
