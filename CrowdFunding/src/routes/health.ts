import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /health - Health check endpoint
router.get('/',
  asyncHandler(async (req, res) => {
    // Check database connection
    let dbStatus = 'OK';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'ERROR';
    }

    const healthStatus = {
      status: dbStatus === 'OK' ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    const statusCode = dbStatus === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  })
);

export default router;