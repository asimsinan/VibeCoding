/**
 * Health Routes
 * TASK-014: Express Server Setup - FR-001 through FR-007
 * 
 * This file defines health check endpoints for monitoring
 * and system status verification.
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';

export const healthRoutes = (dbService?: DatabaseService) => {
  const router = Router();

  /**
   * GET /health
   * Basic health check endpoint
   */
  router.get('/', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Personal Shopping Assistant API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy'
    });
  });

  /**
   * GET /health/detailed
   * Detailed health check with database status
   */
  router.get('/detailed', async (req: Request, res: Response) => {
    const health = {
      success: true,
      message: 'System health check',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        api: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid
        },
        database: {
          status: 'unknown',
          connected: false
        }
      }
    };

    if (dbService) {
      try {
        const isHealthy = await dbService.healthCheck();
        health.services.database = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          connected: isHealthy
        };
      } catch (error) {
        health.services.database = {
          status: 'unhealthy',
          connected: false,
          ...(error instanceof Error && { error: error.message })
        };
      }
    }

    const allHealthy = health.services.api.status === 'healthy' && 
                      health.services.database.status === 'healthy';

    res.status(allHealthy ? 200 : 503).json(health);
  });

  return router;
};
