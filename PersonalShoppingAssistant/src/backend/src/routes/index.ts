/**
 * Routes Index
 * TASK-016: API Routes - FR-001 through FR-007
 * 
 * This file exports all route modules and provides a centralized
 * way to register all API routes with the Express application.
 */

import { Router } from 'express';
import { userRoutes } from './userRoutes';
import { productRoutes } from './productRoutes';
import { interactionRoutes } from './interactionRoutes';
import { recommendationRoutes } from './recommendationRoutes';
import { documentationRoutes } from './documentationRoutes';
import { UserService } from '../../../lib/services/UserService';
import { ProductService } from '../../../lib/services/ProductService';
import { InteractionService } from '../../../lib/services/InteractionService';
import { RecommendationEngine } from '../../../lib/services/RecommendationEngine';

/**
 * Register all API routes
 * @param userService - User service instance
 * @param productService - Product service instance
 * @param interactionService - Interaction service instance
 * @param recommendationEngine - Recommendation engine instance
 * @returns Express router with all routes registered
 */
export const registerRoutes = (
  userService: UserService,
  productService: ProductService,
  interactionService: InteractionService,
  recommendationEngine: RecommendationEngine
): Router => {
  const router = Router();

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Personal Shopping Assistant API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // API documentation endpoint
  router.get('/docs', (req, res) => {
    res.json({
      success: true,
      message: 'API Documentation',
      documentation: {
        openapi: '/api/v1/openapi.json',
        swagger: '/api/v1/swagger',
        endpoints: {
          users: '/api/v1/users',
          products: '/api/v1/products',
          interactions: '/api/v1/interactions',
          recommendations: '/api/v1/recommendations'
        }
      }
    });
  });

  // Register all route modules
  router.use('/users', userRoutes(userService));
  router.use('/products', productRoutes(productService));
  router.use('/interactions', interactionRoutes(interactionService));
  router.use('/recommendations', recommendationRoutes(recommendationEngine, productService));
  router.use('/docs', documentationRoutes());

  return router;
};

// Export individual route modules for testing
export { userRoutes } from './userRoutes';
export { productRoutes } from './productRoutes';
export { interactionRoutes } from './interactionRoutes';
export { recommendationRoutes } from './recommendationRoutes';
