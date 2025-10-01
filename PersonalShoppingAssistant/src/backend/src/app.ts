/**
 * Express Application - Main application setup
 * TASK-014: Express Server Setup - FR-001 through FR-007
 * 
 * This file sets up the Express application with all middleware,
 * routes, and error handling for the Personal Shopping Assistant API.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import { config } from 'dotenv';

// Import services
import { DatabaseService } from './services/DatabaseService';
import { UserService } from '../../lib/services/UserService';
import { ProductService } from '../../lib/services/ProductService';
import { RecommendationEngine } from '../../lib/services/RecommendationEngine';
import { InteractionService } from '../../lib/services/InteractionService';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/authMiddleware';
import { errorMonitoringMiddleware, performanceMonitoring, requestValidation } from './middleware/errorMonitoring';

// Import routes
import { registerRoutes } from './routes';
import { healthRoutes } from './routes/healthRoutes';

// Load environment variables
config();

export class App {
  public app: express.Application;
  private dbService!: DatabaseService;
  private userService!: UserService;
  private productService!: ProductService;
  private recommendationEngine!: RecommendationEngine;
  private interactionService!: InteractionService;

  constructor() {
    this.app = express();
    this.initializeDatabase();
    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Parse DATABASE_URL if available (for production deployments like Vercel)
      let poolConfig;
      if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        poolConfig = {
          user: url.username,
          host: url.hostname,
          database: url.pathname.slice(1), // Remove leading slash
          password: url.password,
          port: parseInt(url.port || '5432', 10),
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        };
      } else {
        poolConfig = {
          user: process.env.DB_USER || 'postgres',
          host: process.env.DB_HOST || 'localhost',
          database: process.env.DB_NAME || 'personal_shopping_assistant',
          password: process.env.DB_PASSWORD || 'postgres',
          port: parseInt(process.env.DB_PORT || '5432', 10),
        };
      }
      
      const pool = new Pool({
        ...poolConfig,
        max: parseInt(process.env.DB_POOL_SIZE || '2', 10), // Very small pool for serverless
        min: 0, // No minimum connections for serverless
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '5000', 10), // Very short for serverless
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '15000', 10), // Increased timeout
        statement_timeout: 30000, // 30 second statement timeout
        query_timeout: 30000, // 30 second query timeout
        allowExitOnIdle: true, // Allow pool to close when idle
      });

      this.dbService = new DatabaseService(pool);
      
      // Add retry logic for initial connection
      let retries = 3;
      while (retries > 0) {
        try {
          await this.dbService.healthCheck();
          console.log('✅ Database connected successfully');
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          console.log(`⚠️ Database connection attempt failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      // Don't exit process in serverless environment, just log the error
      // The health check will handle this gracefully
    }
  }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    this.userService = new UserService(this.dbService);
    this.productService = new ProductService(this.dbService);
    this.recommendationEngine = new RecommendationEngine(this.dbService);
    this.interactionService = new InteractionService(this.dbService);
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // Robust CORS configuration - Handle all scenarios
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const method = req.method;
      
      console.log(`CORS Request: ${method} from origin: ${origin}`);
      
      // Set CORS headers for all responses
      if (origin) {
        // Echo back the origin if it exists
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        // Allow all origins if no origin header
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      
      // Essential CORS headers
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Prevent caching of CORS headers
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Handle preflight OPTIONS requests
      if (method === 'OPTIONS') {
        console.log('Handling preflight OPTIONS request');
        res.status(200).end();
        return;
      }
      
      console.log('CORS headers set successfully');
      next();
    });

    // Serve static files with cache-busting headers
    this.app.use(express.static('src/backend/public', {
      setHeaders: (res, path) => {
        // Disable caching for JavaScript and CSS files
        if (path.endsWith('.js') || path.endsWith('.css')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Error monitoring
    this.app.use(errorMonitoringMiddleware);

    // Performance monitoring
    this.app.use(performanceMonitoring);

    // Request validation
    this.app.use(requestValidation);

    // Request logging
    this.app.use(requestLogger);

    // Rate limiting
    this.app.use(rateLimiter);

    // Health check endpoint (no auth required)
    this.app.use('/health', healthRoutes(this.dbService));
  }

  /**
   * Initialize all routes
   */
  private initializeRoutes(): void {
    // API versioning
    const apiVersion = process.env.API_VERSION || 'v1';
    const basePath = `/api/${apiVersion}`;

    // Register all API routes
    const apiRoutes = registerRoutes(
      this.userService,
      this.productService,
      this.interactionService,
      this.recommendationEngine
    );
    this.app.use(basePath, apiRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Personal Shopping Assistant API',
        version: apiVersion,
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          users: `${basePath}/users`,
          products: `${basePath}/products`,
          interactions: `${basePath}/interactions`,
          recommendations: `${basePath}/recommendations`,
          documentation: `${basePath}/docs`
        }
      });
    });

    // API documentation endpoint
    this.app.get(`${basePath}/docs`, (req, res) => {
      res.json({
        message: 'API Documentation',
        openapi: '3.0.0',
        info: {
          title: 'Personal Shopping Assistant API',
          version: apiVersion,
          description: 'A virtual personal shopping assistant that suggests products based on user preferences'
        },
        servers: [
          {
            url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
            description: 'Development server'
          }
        ],
        paths: {
          '/users': {
            post: {
              summary: 'Register a new user',
              description: 'Create a new user account with email and password'
            }
          },
          '/products': {
            get: {
              summary: 'Get products',
              description: 'Retrieve products with optional filtering'
            }
          }
        }
      });
    });

    // Handle missing images with a proper 404
    this.app.get('*.jpg', (req, res) => {
      res.status(404).json({
        error: 'Image not found',
        message: `Image ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('*.png', (req, res) => {
      res.status(404).json({
        error: 'Image not found',
        message: `Image ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(port: number = parseInt(process.env.PORT || '3001', 10)): Promise<void> {
    try {
      this.app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
        console.log(`🏥 Health Check: http://localhost:${port}/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('🔄 Shutting down server...');
      // Add any cleanup logic here
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get the Express app instance
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * Get database service
   */
  public getDatabaseService(): DatabaseService {
    return this.dbService;
  }

  /**
   * Get user service
   */
  public getUserService(): UserService {
    return this.userService;
  }

  /**
   * Get product service
   */
  public getProductService(): ProductService {
    return this.productService;
  }

  /**
   * Get recommendation engine
   */
  public getRecommendationEngine(): RecommendationEngine {
    return this.recommendationEngine;
  }

  /**
   * Get interaction service
   */
  public getInteractionService(): InteractionService {
    return this.interactionService;
  }
}

// Export app instance for testing
export const app = new App();
