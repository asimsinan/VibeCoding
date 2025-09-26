#!/usr/bin/env node
/**
 * Knex.js Configuration for AppointmentScheduler
 * 
 * This file configures Knex.js for database migrations and queries
 * with environment-specific settings and proper security.
 * 
 * Maps to TASK-006: Migration Setup
 * TDD Phase: Contract
 * Constitutional Compliance: Integration-First Testing Gate, Security Gate
 */

require('dotenv').config();

const config = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'appointment_scheduler_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'js'
    },
    seeds: {
      directory: './seeds',
      extension: 'js'
    },
    debug: process.env.NODE_ENV === 'development'
  },

  staging: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      min: 2,
      max: 15,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'js'
    },
    seeds: {
      directory: './seeds',
      extension: 'js'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: true },
      application_name: 'appointment-scheduler'
    },
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'js'
    },
    seeds: {
      directory: './seeds',
      extension: 'js'
    }
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'appointment_scheduler_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    pool: {
      min: 1,
      max: 5,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'js'
    },
    seeds: {
      directory: './seeds',
      extension: 'js'
    }
  }
};

// Validate required environment variables for non-development environments
const validateEnvironment = (env) => {
  if (env !== 'development' && env !== 'test') {
    const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables for ${env}: ${missingVars.join(', ')}`);
    }
  }
};

// Get current environment
const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

// Validate environment and return configuration
const env = getEnvironment();
validateEnvironment(env);

module.exports = config;
