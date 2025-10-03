import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

export interface DatabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
  maxConnections?: number
  connectionTimeout?: number
  retryAttempts?: number
  retryDelay?: number
}

interface ConnectionPool {
  active: number
  idle: number
  total: number
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  lastChecked: Date
  error?: string
}

class DatabaseManager {
  private client: SupabaseClient
  private config: DatabaseConfig
  private healthStatus: HealthCheck
  private connectionPool: ConnectionPool

  constructor(config: DatabaseConfig) {
    this.config = {
      maxConnections: 20,
      connectionTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    }

    this.client = createClient(this.config.url, this.config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'virtual-event-organizer@1.0.0'
        }
      }
    })

    this.healthStatus = {
      status: 'unhealthy',
      responseTime: 0,
      lastChecked: new Date()
    }

    this.connectionPool = {
      active: 0,
      idle: 0,
      total: this.config.maxConnections || 20
    }
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.client
  }

  /**
   * Perform health check on database connection
   */
  async performHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // Simple query to test connection
      const { data, error } = await this.client
        .from('events')
        .select('count')
        .limit(1)
        .single()

      const responseTime = Date.now() - startTime

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK for health check
        throw new Error(`Database health check failed: ${error.message}`)
      }

      this.healthStatus = {
        status: 'healthy',
        responseTime,
        lastChecked: new Date()
      }

      return this.healthStatus
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      this.healthStatus = {
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      return this.healthStatus
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthCheck {
    return this.healthStatus
  }

  /**
   * Get connection pool information
   */
  getConnectionPool(): ConnectionPool {
    return this.connectionPool
  }

  /**
   * Test database connection with retry logic
   */
  async testConnection(retries: number = this.config.retryAttempts || 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const healthCheck = await this.performHealthCheck()
        
        if (healthCheck.status === 'healthy') {
          return true
        }

        if (attempt < retries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay || 1000)
          )
        }
      } catch (error) {
        if (attempt === retries) {
          throw error
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay || 1000)
        )
      }
    }

    return false
  }

  /**
   * Close database connection
   */
  async closeConnection(): Promise<void> {
    try {
      // Supabase client doesn't have explicit close method
      // but we can clear any cached data
      await this.client.auth.signOut()
    } catch (error) {
    }
  }

  /**
   * Get database configuration
   */
  getConfig(): DatabaseConfig {
    return { ...this.config }
  }
}

// Environment configuration
const getDatabaseConfig = (): DatabaseConfig => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing required Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000')
  }
}

// Create singleton database manager instance
let databaseManager: DatabaseManager | null = null

export const getDatabaseManager = (): DatabaseManager => {
  if (!databaseManager) {
    const config = getDatabaseConfig()
    databaseManager = new DatabaseManager(config)
  }
  return databaseManager
}

// Export types and utilities
export { DatabaseManager }
export type { ConnectionPool, HealthCheck }
