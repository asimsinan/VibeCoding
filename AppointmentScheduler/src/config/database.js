/**
 * Database Configuration
 * 
 * Handles database connection for both development and production environments
 */

const { Pool } = require('pg');

class DatabaseConfig {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      const config = this.getDatabaseConfig();
      
      this.pool = new Pool(config);
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      
      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Get database configuration based on environment
   */
  getDatabaseConfig() {
    // For Vercel, use DATABASE_URL (your existing setup)
    if (process.env.DATABASE_URL) {
      return {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Vercel PostgreSQL
      };
    }

    // For local development
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'appointment_scheduler',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: false
    };
  }

  /**
   * Get database pool
   */
  getPool() {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Check if database is connected
   */
  isDatabaseConnected() {
    return this.isConnected;
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('Database connection closed');
    }
  }
}

module.exports = DatabaseConfig;