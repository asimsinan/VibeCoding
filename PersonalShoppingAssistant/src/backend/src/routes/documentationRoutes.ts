/**
 * Documentation Routes
 * TASK-018: API Documentation - FR-001 through FR-007
 * 
 * This file defines all documentation-related API endpoints including
 * Swagger UI, OpenAPI specification, and Postman collection.
 */

import { Router, Request, Response } from 'express';
import { 
  swaggerUI, 
  serveSwaggerUI, 
  serveOpenAPISpec, 
  apiDocumentation, 
  generatePostmanCollection,
  documentationHealth 
} from '../middleware/swaggerMiddleware';

export const documentationRoutes = () => {
  const router = Router();

  /**
   * GET /api/v1/docs
   * API documentation overview
   */
  router.get('/', apiDocumentation);

  /**
   * GET /api/v1/docs/health
   * Documentation health check
   */
  router.get('/health', documentationHealth);

  /**
   * GET /api/v1/openapi.json
   * OpenAPI 3.0 specification
   */
  router.get('/openapi.json', serveOpenAPISpec);

  /**
   * GET /api/v1/swagger
   * Swagger UI interface
   */
  router.get('/swagger', serveSwaggerUI, swaggerUI);

  /**
   * GET /api/v1/postman.json
   * Postman collection
   */
  router.get('/postman.json', generatePostmanCollection);

  return router;
};
