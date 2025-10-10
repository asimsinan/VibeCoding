/**
 * Database Configuration
 * Centralized database configuration for different environments
 */

import { DatabaseConfig, RedisConfig } from '../src/lib/video-conferencing/services/database.service';

// Environment-specific configurations
const configurations = {
  development: {
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'videoconference_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    } as DatabaseConfig,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    } as RedisConfig,
  },
  test: {
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'videoconference_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: false,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 1000,
    } as DatabaseConfig,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 1, // Use different DB for tests
      retryDelayOnFailover: 50,
      maxRetriesPerRequest: 1,
    } as RedisConfig,
  },
  production: {
    database: {
      connectionString: process.env.DATABASE_URL,
      ssl: true,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    } as DatabaseConfig,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    } as RedisConfig,
  },
};

// Get current environment
const environment = (process.env.NODE_ENV || 'development') as keyof typeof configurations;

// Export current configuration
export const dbConfig = configurations[environment];

// Export all configurations for testing
export { configurations };

// Database connection string for migrations
export const getConnectionString = (): string => {
  const config = dbConfig.database;
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}${config.ssl ? '?sslmode=require' : ''}`;
};

// Redis connection string
export const getRedisConnectionString = (): string => {
  const config = dbConfig.redis;
  const auth = config.password ? `:${config.password}@` : '';
  return `redis://${auth}${config.host}:${config.port}/${config.db}`;
};

// Validation function
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = dbConfig;

  // Validate database config
  if (!config.database.host) errors.push('Database host is required');
  if (!config.database.port || config.database.port < 1 || config.database.port > 65535) {
    errors.push('Database port must be between 1 and 65535');
  }
  if (!config.database.database) errors.push('Database name is required');
  if (!config.database.user) errors.push('Database user is required');
  if (!config.database.password) errors.push('Database password is required');
  if (config.database.max < 1 || config.database.max > 100) {
    errors.push('Database pool max connections must be between 1 and 100');
  }

  // Validate Redis config
  if (!config.redis.host) errors.push('Redis host is required');
  if (!config.redis.port || config.redis.port < 1 || config.redis.port > 65535) {
    errors.push('Redis port must be between 1 and 65535');
  }
  if (config.redis.db < 0 || config.redis.db > 15) {
    errors.push('Redis database must be between 0 and 15');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Performance monitoring configuration
export const performanceConfig = {
  slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'), // ms
  enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000'), // ms
};

// Security configuration
export const securityConfig = {
  enableSSL: process.env.NODE_ENV === 'production',
  sslRejectUnauthorized: process.env.SSL_REJECT_UNAUTHORIZED !== 'false',
  connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '2000'), // ms
  queryTimeout: parseInt(process.env.QUERY_TIMEOUT || '30000'), // ms
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.RETRY_DELAY || '1000'), // ms
};

// Cache configuration
export const cacheConfig = {
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'), // seconds
  maxTTL: parseInt(process.env.CACHE_MAX_TTL || '86400'), // seconds
  enableCompression: process.env.CACHE_ENABLE_COMPRESSION !== 'false',
  compressionThreshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD || '1024'), // bytes
};
