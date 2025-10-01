/**
 * Database Configuration - PostgreSQL connection setup
 * TASK-004: Database Setup - FR-001 through FR-007
 * 
 * This module handles database connection configuration and pool management
 * with proper error handling, retry logic, and connection monitoring.
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  private constructor() {
    // Parse DATABASE_URL if available (for production deployments like Vercel)
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      this.config = {
        host: url.hostname,
        port: parseInt(url.port || '5432'),
        database: url.pathname.slice(1), // Remove leading slash
        username: url.username,
        password: url.password,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } as any : false,
        poolSize: parseInt(process.env.DB_POOL_SIZE || '5'), // Reduced for serverless
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // Increased timeout
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '10000') // Shorter for serverless
      };
    } else {
      // Fallback to individual environment variables
      this.config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'personal_shopping_assistant',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } as any : false,
        poolSize: parseInt(process.env.DB_POOL_SIZE || '5'), // Reduced for serverless
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // Increased timeout
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '10000') // Shorter for serverless
      };
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Initialize database connection pool
   */
  public async initialize(): Promise<Pool> {
    if (this.pool) {
      return this.pool;
    }

    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      max: this.config.poolSize,
      connectionTimeoutMillis: this.config.connectionTimeout,
      idleTimeoutMillis: this.config.idleTimeout,
      allowExitOnIdle: true,
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }

    return this.pool;
  }

  /**
   * Get database pool
   */
  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection closed');
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    if (!this.pool) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  /**
   * Get configuration
   */
  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();

// Export convenience function
export const getDatabasePool = (): Pool => {
  return databaseConnection.getPool();
};
