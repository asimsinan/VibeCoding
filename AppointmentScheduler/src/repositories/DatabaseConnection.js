#!/usr/bin/env node
/**
 * Database Connection
 * 
 * Wrapper for database connection management:
 * - Connection pooling and management
 * - Query execution with error handling
 * - Transaction support
 * - Health monitoring
 * 
 * Maps to TASK-009: Implement Core Library
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Anti-Abstraction Gate, Traceability Gate
 */

const { Pool } = require('pg');

class DatabaseConnection {
  constructor(config) {
    this.config = config;
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   */
  async connect() {
    try {
      if (this.pool) {
        return this.pool;
      }

      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        max: this.config.maxConnections || 20,
        min: this.config.minConnections || 5,
        idleTimeoutMillis: this.config.idleTimeout || 30000,
        connectionTimeoutMillis: this.config.connectionTimeout || 10000,
        ssl: this.config.ssl || false
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.isConnected = true;
      return this.pool;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  }

  /**
   * Execute a query
   * @param {string} query - SQL query
   * @param {Array} values - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(query, values = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const startTime = Date.now();
      const result = await this.pool.query(query, values);
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms): ${query.substring(0, 100)}...`);
      }

      return result;
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Begin a transaction
   * @returns {Promise<Object>} Transaction object
   */
  async beginTransaction() {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const client = await this.pool.connect();
      await client.query('BEGIN');
      
      return {
        client,
        query: async (query, values = []) => {
          return await client.query(query, values);
        },
        commit: async () => {
          await client.query('COMMIT');
          client.release();
        },
        rollback: async () => {
          await client.query('ROLLBACK');
          client.release();
        }
      };
    } catch (error) {
      throw new Error(`Failed to begin transaction: ${error.message}`);
    }
  }

  /**
   * Commit a transaction
   * @param {Object} transaction - Transaction object
   */
  async commitTransaction(transaction) {
    try {
      await transaction.commit();
    } catch (error) {
      throw new Error(`Failed to commit transaction: ${error.message}`);
    }
  }

  /**
   * Rollback a transaction
   * @param {Object} transaction - Transaction object
   */
  async rollbackTransaction(transaction) {
    try {
      await transaction.rollback();
    } catch (error) {
      throw new Error(`Failed to rollback transaction: ${error.message}`);
    }
  }

  /**
   * Execute query within transaction
   * @param {Function} callback - Function to execute within transaction
   * @returns {Promise<any>} Result of callback function
   */
  async withTransaction(callback) {
    const transaction = await this.beginTransaction();
    
    try {
      const result = await callback(transaction);
      await this.commitTransaction(transaction);
      return result;
    } catch (error) {
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }

  /**
   * Get connection pool status
   * @returns {Object} Pool status
   */
  getPoolStatus() {
    if (!this.pool) {
      return {
        connected: false,
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0
      };
    }

    return {
      connected: this.isConnected,
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.pool) {
        return {
          healthy: false,
          error: 'Not connected to database'
        };
      }

      const startTime = Date.now();
      const result = await this.pool.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
        poolStatus: this.getPoolStatus()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        poolStatus: this.getPoolStatus()
      };
    }
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
      }
    } catch (error) {
      throw new Error(`Failed to close database connection: ${error.message}`);
    }
  }

  /**
   * Execute multiple queries in sequence
   * @param {Array} queries - Array of {query, values} objects
   * @returns {Promise<Array>} Results of all queries
   */
  async executeMultiple(queries) {
    try {
      const results = [];
      
      for (const { query, values } of queries) {
        const result = await this.query(query, values);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to execute multiple queries: ${error.message}`);
    }
  }

  /**
   * Execute query with retry logic
   * @param {string} query - SQL query
   * @param {Array} values - Query parameters
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<Object>} Query result
   */
  async queryWithRetry(query, values = [], maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.query(query, values);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`Query failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Get database version
   * @returns {Promise<string>} Database version
   */
  async getVersion() {
    try {
      const result = await this.query('SELECT version()');
      return result.rows[0].version;
    } catch (error) {
      throw new Error(`Failed to get database version: ${error.message}`);
    }
  }

  /**
   * Check if table exists
   * @param {string} tableName - Table name
   * @returns {Promise<boolean>} Table existence
   */
  async tableExists(tableName) {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `;
      
      const result = await this.query(query, [tableName]);
      return result.rows[0].exists;
    } catch (error) {
      throw new Error(`Failed to check table existence: ${error.message}`);
    }
  }

  /**
   * Get table information
   * @param {string} tableName - Table name
   * @returns {Promise<Object>} Table information
   */
  async getTableInfo(tableName) {
    try {
      const query = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `;
      
      const result = await this.query(query, [tableName]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get table info: ${error.message}`);
    }
  }
}

module.exports = DatabaseConnection;
