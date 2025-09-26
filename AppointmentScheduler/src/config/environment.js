/**
 * Environment Configuration
 * 
 * Manages environment-specific configurations for the application
 * 
 * Maps to TASK-012: Application Layer
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Security Gate
 */

const path = require('path');
// Load environment variables from .env.local first, then .env
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class EnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.loadConfig();
  }

  loadConfig() {
    this.config = {
      // Server configuration
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || 'localhost',
      
      // Database configuration
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'appointment_scheduler_dev',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        pool: {
          min: parseInt(process.env.DB_POOL_MIN) || 2,
          max: parseInt(process.env.DB_POOL_MAX) || 10,
          acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT) || 30000,
          createTimeoutMillis: parseInt(process.env.DB_POOL_CREATE_TIMEOUT) || 30000,
          destroyTimeoutMillis: parseInt(process.env.DB_POOL_DESTROY_TIMEOUT) || 5000,
          idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
          reapIntervalMillis: parseInt(process.env.DB_POOL_REAP_INTERVAL) || 1000,
          createRetryIntervalMillis: parseInt(process.env.DB_POOL_CREATE_RETRY_INTERVAL) || 200
        }
      },

      // CORS configuration
      cors: {
        origin: process.env.ALLOWED_ORIGINS ? 
          process.env.ALLOWED_ORIGINS.split(',') : 
          ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      },

      // Security configuration
      security: {
        helmet: {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"]
            }
          },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          }
        }
      },

      // Logging configuration
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        skipHealthCheck: process.env.LOG_SKIP_HEALTH_CHECK === 'true'
      },

      // Business configuration
      business: {
        defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Europe/Istanbul',
        businessHours: {
          start: parseInt(process.env.BUSINESS_HOURS_START) || 6,  // 6 AM UTC = 9 AM UTC+3
          end: parseInt(process.env.BUSINESS_HOURS_END) || 17     // 5 PM UTC = 8 PM UTC+3
        },
        defaultDuration: parseInt(process.env.DEFAULT_DURATION) || 60,
        minDuration: parseInt(process.env.MIN_DURATION) || 15,
        maxDuration: parseInt(process.env.MAX_DURATION) || 480
      },

      // Performance configuration
      performance: {
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
        responseTimeout: parseInt(process.env.RESPONSE_TIMEOUT) || 30000,
        bodyLimit: process.env.BODY_LIMIT || '10mb',
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limit each IP to 100 requests per windowMs
        }
      },

      // Feature flags
      features: {
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        enableDebug: process.env.ENABLE_DEBUG === 'true',
        enableCaching: process.env.ENABLE_CACHING === 'true',
        enableCompression: process.env.ENABLE_COMPRESSION === 'true'
      }
    };

    // Environment-specific overrides
    this.applyEnvironmentOverrides();
  }

  applyEnvironmentOverrides() {
    switch (this.env) {
      case 'production':
        this.config.logging.level = 'warn';
        this.config.logging.format = 'combined';
        this.config.security.helmet.hsts.maxAge = 31536000;
        this.config.features.enableDebug = false;
        this.config.features.enableMetrics = true;
        break;

      case 'staging':
        this.config.logging.level = 'info';
        this.config.logging.format = 'combined';
        this.config.features.enableDebug = false;
        this.config.features.enableMetrics = true;
        break;

      case 'test':
        this.config.database.database = process.env.DB_NAME_TEST || 'appointment_scheduler_test';
        this.config.logging.level = 'error';
        this.config.logging.format = 'tiny';
        this.config.features.enableDebug = false;
        this.config.features.enableMetrics = false;
        break;

      case 'development':
      default:
        this.config.logging.level = 'debug';
        this.config.logging.format = 'dev';
        this.config.features.enableDebug = true;
        this.config.features.enableMetrics = false;
        break;
    }
  }

  get(key) {
    return key ? this.config[key] : this.config;
  }

  getDatabaseConfig() {
    return this.config.database;
  }

  getCorsConfig() {
    return this.config.cors;
  }

  getSecurityConfig() {
    return this.config.security;
  }

  getLoggingConfig() {
    return this.config.logging;
  }

  getBusinessConfig() {
    return this.config.business;
  }

  getPerformanceConfig() {
    return this.config.performance;
  }

  getFeatureFlags() {
    return this.config.features;
  }

  isProduction() {
    return this.env === 'production';
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isTest() {
    return this.env === 'test';
  }

  isStaging() {
    return this.env === 'staging';
  }

  getEnvironment() {
    return this.env;
  }

  getConfig() {
    return this.config;
  }

  validate() {
    const errors = [];

    // Validate required environment variables
    if (!process.env.DB_HOST) {
      errors.push('DB_HOST is required');
    }

    if (!process.env.DB_NAME) {
      errors.push('DB_NAME is required');
    }

    if (!process.env.DB_USER) {
      errors.push('DB_USER is required');
    }

    if (!process.env.DB_PASSWORD) {
      errors.push('DB_PASSWORD is required');
    }

    // Validate port
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    // Validate database port
    if (this.config.database.port < 1 || this.config.database.port > 65535) {
      errors.push('DB_PORT must be between 1 and 65535');
    }

    // Validate business hours
    if (this.config.business.businessHours.start < 0 || this.config.business.businessHours.start > 23) {
      errors.push('BUSINESS_HOURS_START must be between 0 and 23');
    }

    if (this.config.business.businessHours.end < 0 || this.config.business.businessHours.end > 23) {
      errors.push('BUSINESS_HOURS_END must be between 0 and 23');
    }

    if (this.config.business.businessHours.start >= this.config.business.businessHours.end) {
      errors.push('BUSINESS_HOURS_START must be less than BUSINESS_HOURS_END');
    }

    // Validate duration limits
    if (this.config.business.minDuration < 1) {
      errors.push('MIN_DURATION must be at least 1 minute');
    }

    if (this.config.business.maxDuration > 1440) {
      errors.push('MAX_DURATION must be at most 1440 minutes (24 hours)');
    }

    if (this.config.business.minDuration >= this.config.business.maxDuration) {
      errors.push('MIN_DURATION must be less than MAX_DURATION');
    }

    if (errors.length > 0) {
      throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  toString() {
    return JSON.stringify({
      environment: this.env,
      port: this.config.port,
      database: {
        host: this.config.database.host,
        port: this.config.database.port,
        database: this.config.database.database,
        user: this.config.database.user
      },
      features: this.config.features
    }, null, 2);
  }
}

module.exports = EnvironmentConfig;
