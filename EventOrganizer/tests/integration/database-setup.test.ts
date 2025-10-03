import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { getDatabaseConnectionService } from '../../src/lib/database/connection'
import { getDatabaseManager } from '../../src/lib/database/config'
import { validateEnvironment } from '../../config/environment.example'

describe('Database Setup Integration Tests', () => {
  let connectionService: any
  let dbManager: any

  beforeAll(async () => {
    // Set up test environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.DATABASE_MAX_CONNECTIONS = '10'
    process.env.DATABASE_CONNECTION_TIMEOUT = '5000'
    process.env.DATABASE_RETRY_ATTEMPTS = '2'
    process.env.DATABASE_RETRY_DELAY = '500'
  })

  beforeEach(() => {
    connectionService = getDatabaseConnectionService()
    dbManager = getDatabaseManager()
  })

  afterAll(async () => {
    // Clean up connections
    await connectionService.disconnect()
  })

  describe('Environment Configuration', () => {
    it('should validate required environment variables', () => {
      const validation = validateEnvironment()
      
      expect(validation.isValid).toBe(true)
      expect(validation.missing).toHaveLength(0)
    })

    it('should have correct database configuration', () => {
      const config = dbManager.getConfig()
      
      expect(config.url).toBe('https://test.supabase.co')
      expect(config.anonKey).toBe('test-anon-key')
      expect(config.maxConnections).toBe(10)
      expect(config.connectionTimeout).toBe(5000)
      expect(config.retryAttempts).toBe(2)
      expect(config.retryDelay).toBe(500)
    })
  })

  describe('Database Connection Management', () => {
    it('should initialize database manager', () => {
      expect(dbManager).toBeDefined()
      expect(dbManager.getClient).toBeDefined()
      expect(dbManager.performHealthCheck).toBeDefined()
      expect(dbManager.testConnection).toBeDefined()
    })

    it('should initialize connection service', () => {
      expect(connectionService).toBeDefined()
      expect(connectionService.connect).toBeDefined()
      expect(connectionService.disconnect).toBeDefined()
      expect(connectionService.performHealthCheck).toBeDefined()
    })

    it('should start with disconnected state', () => {
      expect(connectionService.isDatabaseConnected()).toBe(false)
    })

    it('should handle connection attempts', async () => {
      const result = await connectionService.connect({
        retries: 1,
        timeout: 1000,
        validateEnv: true
      })

      // Connection will fail in test environment, but should handle gracefully
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.message).toBeDefined()
    })
  })

  describe('Health Check System', () => {
    it('should perform health check', async () => {
      const healthCheck = await dbManager.performHealthCheck()
      
      expect(healthCheck).toBeDefined()
      expect(healthCheck.status).toBeDefined()
      expect(healthCheck.responseTime).toBeDefined()
      expect(healthCheck.lastChecked).toBeDefined()
      expect(healthCheck.status).toMatch(/^(healthy|unhealthy|degraded)$/)
    })

    it('should track health status', () => {
      const healthStatus = dbManager.getHealthStatus()
      
      expect(healthStatus).toBeDefined()
      expect(healthStatus.status).toBeDefined()
      expect(healthStatus.responseTime).toBeDefined()
      expect(healthStatus.lastChecked).toBeDefined()
    })
  })

  describe('Connection Pool Management', () => {
    it('should track connection pool status', () => {
      const pool = dbManager.getConnectionPool()
      
      expect(pool).toBeDefined()
      expect(pool.active).toBeDefined()
      expect(pool.idle).toBeDefined()
      expect(pool.total).toBeDefined()
      expect(typeof pool.active).toBe('number')
      expect(typeof pool.idle).toBe('number')
      expect(typeof pool.total).toBe('number')
    })
  })
})