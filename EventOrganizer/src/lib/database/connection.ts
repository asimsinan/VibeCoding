import { DatabaseManager, getDatabaseManager } from './config'
import { validateEnvironment } from '../../../config/environment.example'

export interface ConnectionResult {
  success: boolean
  message: string
  healthStatus?: any
  error?: string
}

interface ConnectionOptions {
  retries?: number
  timeout?: number
  validateEnv?: boolean
}

class DatabaseConnectionService {
  private dbManager: DatabaseManager
  private isConnected: boolean = false
  private connectionAttempts: number = 0
  private lastConnectionTime: Date | null = null

  constructor() {
    this.dbManager = getDatabaseManager()
  }

  /**
   * Establish database connection with validation
   */
  async connect(options: ConnectionOptions = {}): Promise<ConnectionResult> {
    const {
      retries = 3,
      timeout = 30000,
      validateEnv = true
    } = options

    try {
      // Validate environment variables if requested
      if (validateEnv) {
        const envValidation = validateEnvironment()
        if (!envValidation.isValid) {
          return {
            success: false,
            message: 'Environment validation failed',
            error: `Missing required environment variables: ${envValidation.missing.join(', ')}`
          }
        }
      }

      // Test connection with retries
      const connectionSuccess = await this.dbManager.testConnection(retries)
      
      if (!connectionSuccess) {
        throw new Error('Failed to establish database connection after retries')
      }

      // Perform health check
      const healthStatus = await this.dbManager.performHealthCheck()
      
      if (healthStatus.status !== 'healthy') {
        throw new Error(`Database health check failed: ${healthStatus.error}`)
      }

      this.isConnected = true
      this.connectionAttempts++
      this.lastConnectionTime = new Date()

      return {
        success: true,
        message: 'Database connection established successfully',
        healthStatus
      }

    } catch (error) {
      this.isConnected = false
      
      return {
        success: false,
        message: 'Failed to establish database connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if database is currently connected
   */
  isDatabaseConnected(): boolean {
    return this.isConnected
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    isConnected: boolean
    attempts: number
    lastConnectionTime: Date | null
    healthStatus: any
    connectionPool: any
  } {
    return {
      isConnected: this.isConnected,
      attempts: this.connectionAttempts,
      lastConnectionTime: this.lastConnectionTime,
      healthStatus: this.dbManager.getHealthStatus(),
      connectionPool: this.dbManager.getConnectionPool()
    }
  }

  /**
   * Perform periodic health check
   */
  async performHealthCheck(): Promise<ConnectionResult> {
    try {
      const healthStatus = await this.dbManager.performHealthCheck()
      
      if (healthStatus.status === 'healthy') {
        this.isConnected = true
        return {
          success: true,
          message: 'Database health check passed',
          healthStatus
        }
      } else {
        this.isConnected = false
        return {
          success: false,
          message: 'Database health check failed',
          healthStatus,
          error: healthStatus.error
        }
      }
    } catch (error) {
      this.isConnected = false
      return {
        success: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reconnect to database
   */
  async reconnect(): Promise<ConnectionResult> {
    try {
      // Close existing connection
      await this.dbManager.closeConnection()
      
      // Wait a moment before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Attempt to reconnect
      return await this.connect({ retries: 5, validateEnv: false })
    } catch (error) {
      return {
        success: false,
        message: 'Reconnection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<ConnectionResult> {
    try {
      await this.dbManager.closeConnection()
      this.isConnected = false
      
      return {
        success: true,
        message: 'Database connection closed successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to close database connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get database client for direct access
   */
  getClient() {
    if (!this.isConnected) {
      throw new Error('Database is not connected. Call connect() first.')
    }
    return this.dbManager.getClient()
  }

  /**
   * Execute a simple query to test connection
   */
  async testQuery(): Promise<ConnectionResult> {
    try {
      if (!this.isConnected) {
        throw new Error('Database is not connected')
      }

      const client = this.getClient()
      
      // Simple query to test connection
      const { data, error } = await client
        .from('events')
        .select('count')
        .limit(1)

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
        throw new Error(`Query test failed: ${error.message}`)
      }

      return {
        success: true,
        message: 'Database query test successful'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Database query test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Create singleton instance
let connectionService: DatabaseConnectionService | null = null

export const getDatabaseConnectionService = (): DatabaseConnectionService => {
  if (!connectionService) {
    connectionService = new DatabaseConnectionService()
  }
  return connectionService
}

// Export types and service
export { DatabaseConnectionService }
export type { ConnectionOptions }
