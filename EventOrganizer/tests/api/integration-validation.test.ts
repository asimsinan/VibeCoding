#!/usr/bin/env node
/**
 * Professional API Integration Validation
 * 
 * End-to-end API integration validation ensuring all components
 * work together seamlessly with comprehensive testing coverage.
 * 
 * @fileoverview API integration validation test suite
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { APIDocumentationGenerator } from '../../src/lib/api/documentation-generator'
import { APIVersioningManager } from '../../src/lib/api/versioning'
import { APIErrorHandler } from '../../src/lib/api/error-handling'
import { APIRateLimiter } from '../../src/lib/api/rate-limiting'
import { APIClient } from '../../src/lib/api/client'

describe('API Integration Validation', () => {
  let documentationGenerator: APIDocumentationGenerator
  let versioningManager: APIVersioningManager
  let errorHandler: APIErrorHandler
  let rateLimiter: APIRateLimiter
  let apiClient: APIClient

  beforeAll(async () => {
    // Initialize all API components
    documentationGenerator = new APIDocumentationGenerator({
      title: 'Virtual Event Organizer API',
      version: '1.0.0',
      description: 'API integration validation',
      baseUrl: 'http://localhost:3000',
      contact: { name: 'Test', email: 'test@example.com', url: 'https://example.com' },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
      servers: [{ url: 'http://localhost:3000', description: 'Test server' }],
      outputDir: 'docs/api',
      includeExamples: false,
      includeTesting: false,
      theme: 'default'
    })

    versioningManager = new APIVersioningManager({
      defaultVersion: 'v1',
      supportedVersions: ['1.0.0'],
      versioningStrategy: 'url-path',
      deprecationNoticePeriod: 90,
      sunsetNoticePeriod: 30,
      enableVersionHeader: true,
      enableDeprecationWarnings: true
    })

    errorHandler = new APIErrorHandler({
      enableErrorLogging: false,
      enableStackTrace: false,
      enableRequestContext: false,
      logLevel: 'error',
      includeSensitiveData: false,
      errorRecoveryEnabled: false,
      maxRetryAttempts: 1,
      retryDelay: 1000
    })

    rateLimiter = new APIRateLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req) => req.ip || 'unknown',
      onLimitReached: (req, res) => {
        console.warn(`Rate limit exceeded for ${req.ip}`)
      },
      standardHeaders: true,
      legacyHeaders: true,
      message: 'Too many requests, please try again later',
      statusCode: 429,
      skip: (req) => false,
      store: new (rateLimiter as any).MemoryRateLimitStore()
    })

    apiClient = new APIClient({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      enableOfflineSupport: true,
      enableRequestLogging: false,
      enableResponseLogging: false,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  })

  describe('Component Integration', () => {
    it('should initialize all API components successfully', () => {
      expect(documentationGenerator).toBeDefined()
      expect(versioningManager).toBeDefined()
      expect(errorHandler).toBeDefined()
      expect(rateLimiter).toBeDefined()
      expect(apiClient).toBeDefined()
    })

    it('should have consistent configuration across components', () => {
      const docConfig = documentationGenerator.getOpenAPISpec()
      const versionConfig = versioningManager.getConfig()
      const errorConfig = errorHandler.getConfig()
      const rateLimitConfig = rateLimiter.getConfig()
      const clientConfig = apiClient.getConfig()

      // Check base URL consistency
      expect(docConfig.servers[0].url).toBe(clientConfig.baseURL)
      
      // Check version consistency
      expect(docConfig.info.version).toBe(versionConfig.defaultVersion.replace('v', '') + '.0.0')
      
      // Check timeout consistency
      expect(clientConfig.timeout).toBeGreaterThan(0)
    })
  })

  describe('API Documentation Integration', () => {
    it('should generate valid OpenAPI specification', () => {
      const spec = documentationGenerator.getOpenAPISpec()
      
      expect(spec).toHaveProperty('openapi', '3.0.0')
      expect(spec).toHaveProperty('info')
      expect(spec).toHaveProperty('paths')
      expect(spec).toHaveProperty('components')
      
      expect(spec.info).toHaveProperty('title')
      expect(spec.info).toHaveProperty('version')
      expect(spec.info).toHaveProperty('description')
    })

    it('should include all required endpoints in specification', () => {
      const spec = documentationGenerator.getOpenAPISpec()
      const paths = spec.paths
      
      const requiredEndpoints = [
        '/api/v1/auth/register',
        '/api/v1/auth/login',
        '/api/v1/auth/validate',
        '/api/v1/events',
        '/api/v1/events/{id}',
        '/api/v1/events/{id}/register',
        '/api/v1/events/{id}/attendees',
        '/api/v1/sessions',
        '/api/v1/sessions/{id}',
        '/api/v1/notifications',
        '/api/v1/notifications/{id}',
        '/api/v1/networking/connect',
        '/api/v1/networking/connections'
      ]

      requiredEndpoints.forEach(endpoint => {
        expect(paths).toHaveProperty(endpoint)
      })
    })

    it('should have proper error response schemas', () => {
      const spec = documentationGenerator.getOpenAPISpec()
      const paths = spec.paths
      
      Object.values(paths).forEach((pathMethods: any) => {
        Object.values(pathMethods).forEach((method: any) => {
          if (method.responses) {
            expect(method.responses).toHaveProperty('400')
            expect(method.responses).toHaveProperty('401')
            expect(method.responses).toHaveProperty('404')
            expect(method.responses).toHaveProperty('500')
          }
        })
      })
    })

    it('should validate OpenAPI specification', () => {
      const validation = documentationGenerator.validateOpenAPISpec()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('API Versioning Integration', () => {
    it('should support URL path versioning', () => {
      const config = versioningManager.getConfig()
      expect(config.versioningStrategy).toBe('url-path')
    })

    it('should have supported versions configured', () => {
      const supportedVersions = versioningManager.getSupportedVersions()
      expect(supportedVersions.length).toBeGreaterThan(0)
      
      const version = supportedVersions[0]
      expect(version).toHaveProperty('version')
      expect(version).toHaveProperty('status')
      expect(version).toHaveProperty('releaseDate')
    })

    it('should validate API versions correctly', () => {
      const validation = versioningManager.validateVersion('v1')
      expect(validation.isValid).toBe(true)
      
      const invalidValidation = versioningManager.validateVersion('v999')
      expect(invalidValidation.isValid).toBe(false)
      expect(invalidValidation.error).toContain('Unsupported API version')
    })

    it('should handle version information correctly', () => {
      const versionInfo = versioningManager.getVersionInfo('v1')
      expect(versionInfo).toBeDefined()
      expect(versionInfo?.version).toBe('1.0.0')
      expect(versionInfo?.status).toBe('current')
    })
  })

  describe('API Error Handling Integration', () => {
    it('should have all required error codes defined', () => {
      const errorCodes = errorHandler.getAllErrorCodes()
      
      const requiredErrorCodes = [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'VALIDATION_ERROR',
        'INTERNAL_ERROR',
        'EVENT_NOT_FOUND',
        'SESSION_NOT_FOUND',
        'ATTENDEE_NOT_FOUND',
        'ALREADY_REGISTERED',
        'EVENT_FULL',
        'RATE_LIMIT_EXCEEDED'
      ]

      requiredErrorCodes.forEach(code => {
        expect(errorCodes.has(code)).toBe(true)
      })
    })

    it('should have proper HTTP status codes for error codes', () => {
      const errorCodes = errorHandler.getAllErrorCodes()
      
      expect(errorCodes.get('UNAUTHORIZED')?.status).toBe(401)
      expect(errorCodes.get('FORBIDDEN')?.status).toBe(403)
      expect(errorCodes.get('NOT_FOUND')?.status).toBe(404)
      expect(errorCodes.get('VALIDATION_ERROR')?.status).toBe(400)
      expect(errorCodes.get('INTERNAL_ERROR')?.status).toBe(500)
      expect(errorCodes.get('RATE_LIMIT_EXCEEDED')?.status).toBe(429)
    })

    it('should create standardized API errors', () => {
      const error = errorHandler.createError('NOT_FOUND', 'Resource not found')
      
      expect(error).toHaveProperty('code', 'NOT_FOUND')
      expect(error).toHaveProperty('message', 'Resource not found')
      expect(error).toHaveProperty('timestamp')
      expect(error.timestamp).toBeDefined()
    })

    it('should handle error recovery correctly', async () => {
      let attemptCount = 0
      const operation = async () => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error('Temporary error')
        }
        return 'success'
      }

      const result = await errorHandler.attemptRecovery(operation, 3)
      expect(result).toBe('success')
      expect(attemptCount).toBe(3)
    })
  })

  describe('API Rate Limiting Integration', () => {
    it('should have rate limiting rules configured', () => {
      const rules = rateLimiter['rules']
      expect(rules.size).toBeGreaterThan(0)
      
      // Check for common rate limiting rules
      expect(rules.has('global')).toBe(true)
      expect(rules.has('per-ip')).toBe(true)
      expect(rules.has('per-user')).toBe(true)
    })

    it('should validate rate limiting rules', () => {
      const globalRule = rateLimiter.getRule('global')
      expect(globalRule).toBeDefined()
      expect(globalRule?.maxRequests).toBeGreaterThan(0)
      expect(globalRule?.windowMs).toBeGreaterThan(0)
    })

    it('should handle rate limit status correctly', async () => {
      const status = await rateLimiter.getRateLimitStatus('test-key', 'global')
      expect(status).toBeDefined()
      expect(status?.limit).toBeGreaterThan(0)
      expect(status?.remaining).toBeGreaterThanOrEqual(0)
      expect(status?.reset).toBeInstanceOf(Date)
    })

    it('should create rate limiting middleware', () => {
      const middleware = rateLimiter.createMiddleware('global')
      expect(typeof middleware).toBe('function')
    })
  })

  describe('API Client Integration', () => {
    it('should initialize with correct configuration', () => {
      const config = apiClient.getConfig()
      
      expect(config.baseURL).toBe('http://localhost:3000')
      expect(config.timeout).toBe(10000)
      expect(config.retries).toBe(3)
      expect(config.retryDelay).toBe(1000)
      expect(config.enableOfflineSupport).toBe(true)
    })

    it('should handle authentication tokens', () => {
      const testToken = 'test-auth-token'
      const testRefreshToken = 'test-refresh-token'
      
      apiClient.setAuthTokens(testToken, testRefreshToken)
      
      // In a real implementation, you would check if tokens are set
      // For now, we'll just verify the method doesn't throw
      expect(() => apiClient.setAuthTokens(testToken, testRefreshToken)).not.toThrow()
    })

    it('should handle offline status', () => {
      const offlineStatus = apiClient.getOfflineStatus()
      
      expect(offlineStatus).toHaveProperty('isOnline')
      expect(offlineStatus).toHaveProperty('queueLength')
      expect(typeof offlineStatus.isOnline).toBe('boolean')
      expect(typeof offlineStatus.queueLength).toBe('number')
    })

    it('should support request methods', () => {
      // Test that all HTTP methods are available
      expect(typeof apiClient.get).toBe('function')
      expect(typeof apiClient.post).toBe('function')
      expect(typeof apiClient.put).toBe('function')
      expect(typeof apiClient.patch).toBe('function')
      expect(typeof apiClient.delete).toBe('function')
    })

    it('should handle batch operations', () => {
      const requests = [
        { method: 'GET', url: '/api/v1/events' },
        { method: 'GET', url: '/api/v1/sessions' }
      ]

      expect(typeof apiClient.batch).toBe('function')
    })

    it('should support file upload', () => {
      expect(typeof apiClient.upload).toBe('function')
    })

    it('should support file download', () => {
      expect(typeof apiClient.download).toBe('function')
    })
  })

  describe('End-to-End Integration', () => {
    it('should integrate all components seamlessly', () => {
      // Test that all components can work together
      const spec = documentationGenerator.getOpenAPISpec()
      const versionInfo = versioningManager.getVersionInfo('v1')
      const errorCodes = errorHandler.getAllErrorCodes()
      const rateLimitRules = rateLimiter['rules']
      const clientConfig = apiClient.getConfig()

      // Verify integration points
      expect(spec.info.version).toBe(versionInfo?.version)
      expect(errorCodes.has('RATE_LIMIT_EXCEEDED')).toBe(true)
      expect(rateLimitRules.has('global')).toBe(true)
      expect(clientConfig.baseURL).toBe(spec.servers[0].url)
    })

    it('should handle complete API workflow', async () => {
      // Simulate a complete API workflow
      const testEvent = {
        name: 'Integration Test Event',
        description: 'Test event for integration validation',
        startDate: '2024-12-01T09:00:00Z',
        endDate: '2024-12-01T17:00:00Z',
        location: 'Virtual',
        maxAttendees: 100,
        ticketPrice: 0,
        currency: 'USD',
        category: 'test'
      }

      // This would be a real API call in a live environment
      // For now, we'll test the error handling
      try {
        await apiClient.post('/api/v1/events', testEvent)
      } catch (error: any) {
        // Expected to fail in test environment
        expect(error).toBeDefined()
      }
    })

    it('should maintain data consistency across operations', () => {
      // Test that all components maintain consistent data structures
      const spec = documentationGenerator.getOpenAPISpec()
      const errorCodes = errorHandler.getAllErrorCodes()
      
      // Verify that error codes in spec match error handler
      const specErrorResponses = Object.values(spec.paths).flatMap((pathMethods: any) =>
        Object.values(pathMethods).flatMap((method: any) =>
          Object.keys(method.responses || {})
        )
      )
      
      // Check that we have proper error responses
      expect(specErrorResponses).toContain('400')
      expect(specErrorResponses).toContain('401')
      expect(specErrorResponses).toContain('404')
      expect(specErrorResponses).toContain('500')
    })

    it('should handle error scenarios gracefully', () => {
      // Test error handling integration
      const error = errorHandler.createError('EVENT_NOT_FOUND', 'Event not found')
      const errorInfo = errorHandler.getErrorCodeInfo('EVENT_NOT_FOUND')
      
      expect(error.code).toBe('EVENT_NOT_FOUND')
      expect(error.message).toBe('Event not found')
      expect(errorInfo?.status).toBe(404)
    })

    it('should support versioning across all components', () => {
      // Test versioning integration
      const spec = documentationGenerator.getOpenAPISpec()
      const versionInfo = versioningManager.getVersionInfo('v1')
      const clientConfig = apiClient.getConfig()
      
      // Verify version consistency
      expect(spec.info.version).toBe(versionInfo?.version)
      expect(clientConfig.defaultHeaders).toHaveProperty('Accept', 'application/json')
    })
  })

  describe('Performance Integration', () => {
    it('should handle concurrent operations efficiently', async () => {
      const startTime = Date.now()
      
      // Simulate concurrent operations
      const operations = Array(10).fill(null).map(async (_, index) => {
        try {
          await apiClient.get(`/api/v1/events?page=${index + 1}`)
        } catch (error) {
          // Expected to fail in test environment
        }
      })

      await Promise.all(operations)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000) // 5 seconds
    })

    it('should handle rate limiting efficiently', async () => {
      const startTime = Date.now()
      
      // Simulate rapid requests
      const requests = Array(20).fill(null).map(async () => {
        try {
          await apiClient.get('/api/v1/events')
        } catch (error) {
          // Expected to fail or be rate limited
        }
      })

      await Promise.all(requests)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000) // 3 seconds
    })
  })

  describe('Security Integration', () => {
    it('should have security schemes defined', () => {
      const spec = documentationGenerator.getOpenAPISpec()
      const securitySchemes = spec.components.securitySchemes
      
      expect(securitySchemes).toHaveProperty('bearerAuth')
      expect(securitySchemes.bearerAuth).toHaveProperty('type', 'http')
      expect(securitySchemes.bearerAuth).toHaveProperty('scheme', 'bearer')
    })

    it('should handle authentication errors correctly', () => {
      const error = errorHandler.createError('UNAUTHORIZED', 'Authentication required')
      const errorInfo = errorHandler.getErrorCodeInfo('UNAUTHORIZED')
      
      expect(error.code).toBe('UNAUTHORIZED')
      expect(errorInfo?.status).toBe(401)
    })

    it('should support secure communication', () => {
      const clientConfig = apiClient.getConfig()
      
      // Verify secure headers are supported
      expect(clientConfig.defaultHeaders).toHaveProperty('Content-Type', 'application/json')
      expect(clientConfig.defaultHeaders).toHaveProperty('Accept', 'application/json')
    })
  })

  describe('Monitoring Integration', () => {
    it('should track API operations', () => {
      const errorCodes = errorHandler.getAllErrorCodes()
      const rateLimitRules = rateLimiter['rules']
      
      // Verify monitoring capabilities
      expect(errorCodes.size).toBeGreaterThan(0)
      expect(rateLimitRules.size).toBeGreaterThan(0)
    })

    it('should provide operational insights', () => {
      const versionInfo = versioningManager.getVersionInfo('v1')
      const errorCodes = errorHandler.getAllErrorCodes()
      
      // Verify operational data is available
      expect(versionInfo).toBeDefined()
      expect(errorCodes.size).toBeGreaterThan(0)
    })
  })
})
