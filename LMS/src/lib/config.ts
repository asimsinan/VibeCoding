import { z } from 'zod';

// Environment configuration schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NextAuth URL must be a valid URL').optional(),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  
  // API Configuration
  API_BASE_URL: z.string().url().optional(),
  API_RATE_LIMIT: z.string().regex(/^\d+$/).transform(Number).default('100'),
  
  // Security
  JWT_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  
  // External Services
  EMAIL_SERVICE_URL: z.string().url().optional(),
  EMAIL_API_KEY: z.string().optional(),
  
  // File Storage
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('10485760'), // 10MB
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),
  
  // Monitoring
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('false'),
  METRICS_PORT: z.string().regex(/^\d+$/).transform(Number).default('9090'),
  
  // Feature Flags
  ENABLE_REGISTRATION: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Environment-specific configurations
export const config = {
  // Application
  app: {
    name: 'Multi-Tenant LMS',
    version: '1.0.0',
    environment: env.NODE_ENV,
    port: env.PORT,
    url: env.NEXTAUTH_URL || `http://localhost:${env.PORT}`,
  },
  
  // Database
  database: {
    url: env.DATABASE_URL,
    maxConnections: 10,
    connectionTimeout: 30000,
    queryTimeout: 30000,
  },
  
  // Authentication
  auth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL || `http://localhost:${env.PORT}`,
    sessionMaxAge: 30 * 24 * 60 * 60, // 30 days
    jwtMaxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // API
  api: {
    baseUrl: env.API_BASE_URL || `http://localhost:${env.PORT}/api`,
    rateLimit: env.API_RATE_LIMIT,
    timeout: 30000,
  },
  
  // Security
  security: {
    jwtSecret: env.JWT_SECRET || env.NEXTAUTH_SECRET,
    encryptionKey: env.ENCRYPTION_KEY || env.NEXTAUTH_SECRET,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    sessionCookieSecure: env.NODE_ENV === 'production',
    sessionCookieSameSite: 'lax' as const,
  },
  
  // File Upload
  upload: {
    directory: env.UPLOAD_DIR,
    maxFileSize: env.MAX_FILE_SIZE,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
    format: env.NODE_ENV === 'production' ? 'json' : 'pretty',
    enableConsole: true,
  },
  
  // Monitoring
  monitoring: {
    enabled: env.ENABLE_METRICS,
    port: env.METRICS_PORT,
    healthCheckInterval: 30000, // 30 seconds
  },
  
  // Feature Flags
  features: {
    registration: env.ENABLE_REGISTRATION,
    analytics: env.ENABLE_ANALYTICS,
    notifications: env.ENABLE_NOTIFICATIONS,
  },
  
  // External Services
  services: {
    email: {
      url: env.EMAIL_SERVICE_URL,
      apiKey: env.EMAIL_API_KEY,
      fromAddress: 'noreply@lms.example.com',
    },
  },
} as const;

// Environment validation
export function validateEnvironment(): void {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment configuration validated successfully');
  } catch (error) {
    console.error('❌ Environment configuration validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Configuration helpers
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};

// Security helpers
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
});

// CORS configuration
export const getCorsConfig = () => ({
  origin: isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:3001']
    : [config.app.url],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID'],
});

// Rate limiting configuration
export const getRateLimitConfig = () => ({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.api.rateLimit,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Database connection string validation
export const validateDatabaseUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Environment-specific database configuration
export const getDatabaseConfig = () => {
  const isPostgres = env.DATABASE_URL.startsWith('postgresql://');
  const isSqlite = env.DATABASE_URL.startsWith('file:');
  
  if (isPostgres) {
    return {
      provider: 'postgresql' as const,
      connectionLimit: 20,
      poolTimeout: 30000,
      statementTimeout: 30000,
    };
  } else if (isSqlite) {
    return {
      provider: 'sqlite' as const,
      connectionLimit: 1,
      poolTimeout: 30000,
      statementTimeout: 30000,
    };
  } else {
    throw new Error('Unsupported database provider');
  }
};

// Export types
export type Config = typeof config;
export type Environment = z.infer<typeof envSchema>;
export type FeatureFlag = keyof typeof config.features;

// Default export
export default config;
