import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

// Import route handlers
import authRoutes from './routes/auth';
import campaignRoutes from './routes/campaigns';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';
import donationRoutes from './routes/donations';
import commentRoutes from './routes/comments';
import statsRoutes from './routes/stats';
import userCampaignRoutes from './routes/user-campaigns';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { validateRequest, rateLimit, securityHeaders } from './middleware/validation';
import logger, { morganStream } from './lib/logger';

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

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

// Custom security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
app.use(rateLimit(10000, 15 * 60 * 1000)); // 10000 requests per 15 minutes (extended for development)

// Logging middleware
app.use(morgan('combined', { stream: morganStream }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request validation middleware
app.use(validateRequest);

// Health check route (no auth required)
app.use('/health', healthRoutes);

// Stats route (no auth required)
app.use('/api/v1/stats', statsRoutes);

// Authentication routes (no auth required)
app.use('/api/v1/auth', authRoutes);

// API routes with authentication
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/user-campaigns', userCampaignRoutes);
app.use('/api/v1/users', authenticate, userRoutes);
app.use('/api/v1/admin', authenticate, adminRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/comments', commentRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Crowdfunding Platform API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Log application startup
logger.info('Application started', {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  timestamp: new Date().toISOString()
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
