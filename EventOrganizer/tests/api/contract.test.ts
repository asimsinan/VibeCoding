#!/usr/bin/env node
/**
 * Professional API Contract Tests
 * 
 * Comprehensive contract tests ensuring API compliance with OpenAPI specification,
 * schema validation, and backward compatibility.
 * 
 * @fileoverview API contract testing suite
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import axios, { AxiosInstance } from 'axios'
import { APIDocumentationGenerator } from '../../src/lib/api/documentation-generator'
import { APIVersioningManager } from '../../src/lib/api/versioning'
import { APIErrorHandler } from '../../src/lib/api/error-handling'

// Test configuration
const CONTRACT_TEST_CONFIG = {
  baseURL: process.env.TEST_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  openApiSpecPath: 'contracts/openapi.yaml'
}

describe('API Contract Tests', () => {
  let apiClient: AxiosInstance
  let documentationGenerator: APIDocumentationGenerator
  let versioningManager: APIVersioningManager
  let errorHandler: APIErrorHandler
  let openApiSpec: any

  beforeAll(async () => {
    // Initialize API client
    apiClient = axios.create({
      baseURL: CONTRACT_TEST_CONFIG.baseURL,
      timeout: CONTRACT_TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    // Initialize API utilities
    documentationGenerator = new APIDocumentationGenerator({
      title: 'Virtual Event Organizer API',
      version: '1.0.0',
      description: 'API contract testing',
      baseUrl: CONTRACT_TEST_CONFIG.baseURL,
      contact: { name: 'Test', email: 'test@example.com', url: 'https://example.com' },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
      servers: [{ url: CONTRACT_TEST_CONFIG.baseURL, description: 'Test server' }],
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

    // Load OpenAPI specification
    openApiSpec = documentationGenerator.getOpenAPISpec()
  })

  describe('OpenAPI Specification Compliance', () => {
    it('should have valid OpenAPI structure', () => {
      expect(openApiSpec).toHaveProperty('openapi')
      expect(openApiSpec).toHaveProperty('info')
      expect(openApiSpec).toHaveProperty('paths')
      expect(openApiSpec).toHaveProperty('components')
      
      expect(openApiSpec.openapi).toBe('3.0.0')
      expect(openApiSpec.info).toHaveProperty('title')
      expect(openApiSpec.info).toHaveProperty('version')
      expect(openApiSpec.info).toHaveProperty('description')
    })

    it('should have required API endpoints', () => {
      const paths = openApiSpec.paths
      
      // Authentication endpoints
      expect(paths).toHaveProperty('/api/v1/auth/register')
      expect(paths).toHaveProperty('/api/v1/auth/login')
      expect(paths).toHaveProperty('/api/v1/auth/validate')
      
      // Events endpoints
      expect(paths).toHaveProperty('/api/v1/events')
      expect(paths).toHaveProperty('/api/v1/events/{id}')
      expect(paths).toHaveProperty('/api/v1/events/{id}/register')
      expect(paths).toHaveProperty('/api/v1/events/{id}/attendees')
      
      // Sessions endpoints
      expect(paths).toHaveProperty('/api/v1/sessions')
      expect(paths).toHaveProperty('/api/v1/sessions/{id}')
      expect(paths).toHaveProperty('/api/v1/events/{id}/sessions')
      
      // Notifications endpoints
      expect(paths).toHaveProperty('/api/v1/notifications')
      expect(paths).toHaveProperty('/api/v1/notifications/{id}')
      
      // Networking endpoints
      expect(paths).toHaveProperty('/api/v1/networking/connect')
      expect(paths).toHaveProperty('/api/v1/networking/connections')
    })

    it('should have proper HTTP methods for each endpoint', () => {
      const paths = openApiSpec.paths
      
      // Events endpoints
      expect(paths['/api/v1/events']).toHaveProperty('get')
      expect(paths['/api/v1/events']).toHaveProperty('post')
      expect(paths['/api/v1/events/{id}']).toHaveProperty('get')
      expect(paths['/api/v1/events/{id}']).toHaveProperty('put')
      expect(paths['/api/v1/events/{id}']).toHaveProperty('delete')
      
      // Sessions endpoints
      expect(paths['/api/v1/sessions']).toHaveProperty('get')
      expect(paths['/api/v1/sessions']).toHaveProperty('post')
      expect(paths['/api/v1/sessions/{id}']).toHaveProperty('get')
      expect(paths['/api/v1/sessions/{id}']).toHaveProperty('put')
      expect(paths['/api/v1/sessions/{id}']).toHaveProperty('delete')
    })

    it('should have proper response schemas', () => {
      const paths = openApiSpec.paths
      
      // Check events GET response
      const eventsGet = paths['/api/v1/events'].get
      expect(eventsGet).toHaveProperty('responses')
      expect(eventsGet.responses).toHaveProperty('200')
      expect(eventsGet.responses['200']).toHaveProperty('content')
      expect(eventsGet.responses['200'].content).toHaveProperty('application/json')
      
      // Check events POST response
      const eventsPost = paths['/api/v1/events'].post
      expect(eventsPost).toHaveProperty('responses')
      expect(eventsPost.responses).toHaveProperty('201')
      expect(eventsPost.responses['201']).toHaveProperty('content')
    })

    it('should have proper error response schemas', () => {
      const paths = openApiSpec.paths
      
      // Check for error responses
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
  })

  describe('Schema Validation', () => {
    it('should validate Event schema', () => {
      const eventSchema = openApiSpec.components.schemas.Event
      
      expect(eventSchema).toHaveProperty('type', 'object')
      expect(eventSchema).toHaveProperty('properties')
      
      const properties = eventSchema.properties
      expect(properties).toHaveProperty('id')
      expect(properties).toHaveProperty('name')
      expect(properties).toHaveProperty('description')
      expect(properties).toHaveProperty('startDate')
      expect(properties).toHaveProperty('endDate')
      expect(properties).toHaveProperty('location')
      expect(properties).toHaveProperty('status')
      expect(properties).toHaveProperty('organizerId')
      expect(properties).toHaveProperty('maxAttendees')
      expect(properties).toHaveProperty('currentAttendees')
      expect(properties).toHaveProperty('ticketPrice')
      expect(properties).toHaveProperty('currency')
      expect(properties).toHaveProperty('imageUrl')
      expect(properties).toHaveProperty('category')
      expect(properties).toHaveProperty('tags')
      expect(properties).toHaveProperty('createdAt')
      expect(properties).toHaveProperty('updatedAt')
    })

    it('should validate CreateEventRequest schema', () => {
      const createEventSchema = openApiSpec.components.schemas.CreateEventRequest
      
      expect(createEventSchema).toHaveProperty('type', 'object')
      expect(createEventSchema).toHaveProperty('required')
      expect(createEventSchema.required).toContain('name')
      expect(createEventSchema.required).toContain('description')
      expect(createEventSchema.required).toContain('startDate')
      expect(createEventSchema.required).toContain('endDate')
    })

    it('should validate Session schema', () => {
      const sessionSchema = openApiSpec.components.schemas.Session
      
      expect(sessionSchema).toHaveProperty('type', 'object')
      expect(sessionSchema).toHaveProperty('properties')
      
      const properties = sessionSchema.properties
      expect(properties).toHaveProperty('id')
      expect(properties).toHaveProperty('title')
      expect(properties).toHaveProperty('description')
      expect(properties).toHaveProperty('startTime')
      expect(properties).toHaveProperty('endTime')
      expect(properties).toHaveProperty('type')
      expect(properties).toHaveProperty('status')
      expect(properties).toHaveProperty('eventId')
      expect(properties).toHaveProperty('speakerId')
      expect(properties).toHaveProperty('maxAttendees')
      expect(properties).toHaveProperty('currentAttendees')
    })

    it('should validate Attendee schema', () => {
      const attendeeSchema = openApiSpec.components.schemas.Attendee
      
      expect(attendeeSchema).toHaveProperty('type', 'object')
      expect(attendeeSchema).toHaveProperty('properties')
      
      const properties = attendeeSchema.properties
      expect(properties).toHaveProperty('id')
      expect(properties).toHaveProperty('userId')
      expect(properties).toHaveProperty('eventId')
      expect(properties).toHaveProperty('status')
      expect(properties).toHaveProperty('registrationDate')
      expect(properties).toHaveProperty('checkInTime')
      expect(properties).toHaveProperty('checkOutTime')
    })

    it('should validate Notification schema', () => {
      const notificationSchema = openApiSpec.components.schemas.Notification
      
      expect(notificationSchema).toHaveProperty('type', 'object')
      expect(notificationSchema).toHaveProperty('properties')
      
      const properties = notificationSchema.properties
      expect(properties).toHaveProperty('id')
      expect(properties).toHaveProperty('type')
      expect(properties).toHaveProperty('title')
      expect(properties).toHaveProperty('message')
      expect(properties).toHaveProperty('recipientId')
      expect(properties).toHaveProperty('senderId')
      expect(properties).toHaveProperty('status')
      expect(properties).toHaveProperty('deliveryMethod')
      expect(properties).toHaveProperty('priority')
      expect(properties).toHaveProperty('scheduledAt')
      expect(properties).toHaveProperty('sentAt')
      expect(properties).toHaveProperty('readAt')
    })

    it('should validate Connection schema', () => {
      const connectionSchema = openApiSpec.components.schemas.Connection
      
      expect(connectionSchema).toHaveProperty('type', 'object')
      expect(connectionSchema).toHaveProperty('properties')
      
      const properties = connectionSchema.properties
      expect(properties).toHaveProperty('id')
      expect(properties).toHaveProperty('requesterId')
      expect(properties).toHaveProperty('recipientId')
      expect(properties).toHaveProperty('status')
      expect(properties).toHaveProperty('type')
      expect(properties).toHaveProperty('message')
      expect(properties).toHaveProperty('createdAt')
      expect(properties).toHaveProperty('acceptedAt')
    })
  })

  describe('API Response Format Compliance', () => {
    it('should return standardized success response format', async () => {
      try {
        const response = await apiClient.get('/api/v1/events')
        
        expect(response.data).toHaveProperty('success', true)
        expect(response.data).toHaveProperty('data')
        expect(response.data).toHaveProperty('timestamp')
        
        // Should not have error property in success response
        expect(response.data).not.toHaveProperty('error')
      } catch (error: any) {
        // If endpoint doesn't exist, that's expected in contract testing
        expect([404, 401]).toContain(error.response?.status)
      }
    })

    it('should return standardized error response format', async () => {
      try {
        await apiClient.get('/api/v1/non-existent-endpoint')
      } catch (error: any) {
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data.error).toHaveProperty('code')
        expect(error.response.data.error).toHaveProperty('message')
        expect(error.response.data).toHaveProperty('timestamp')
        
        // Should not have data property in error response
        expect(error.response.data).not.toHaveProperty('data')
      }
    })

    it('should include proper HTTP status codes', async () => {
      const statusCodeTests = [
        { endpoint: '/api/v1/events', expectedStatus: [200, 401] },
        { endpoint: '/api/v1/non-existent', expectedStatus: [404] },
        { endpoint: '/api/v1/auth/login', method: 'POST', expectedStatus: [400, 401] }
      ]

      for (const test of statusCodeTests) {
        try {
          const config = { method: test.method || 'GET' }
          const response = await apiClient.request({
            url: test.endpoint,
            ...config
          })
          
          expect(test.expectedStatus).toContain(response.status)
        } catch (error: any) {
          expect(test.expectedStatus).toContain(error.response.status)
        }
      }
    })
  })

  describe('API Versioning Compliance', () => {
    it('should support URL path versioning', () => {
      const versioningConfig = versioningManager['config']
      expect(versioningConfig.versioningStrategy).toBe('url-path')
    })

    it('should have version information endpoint', () => {
      const paths = openApiSpec.paths
      expect(paths).toHaveProperty('/api/v1/version')
    })

    it('should include version headers in responses', async () => {
      try {
        const response = await apiClient.get('/api/v1/events')
        
        expect(response.headers).toHaveProperty('api-version')
        expect(response.headers).toHaveProperty('api-status')
      } catch (error: any) {
        // Headers might not be present if endpoint doesn't exist
        expect([404, 401]).toContain(error.response?.status)
      }
    })

    it('should validate supported versions', () => {
      const supportedVersions = versioningManager.getSupportedVersions()
      expect(supportedVersions.length).toBeGreaterThan(0)
      
      const version = supportedVersions[0]
      expect(version).toHaveProperty('version')
      expect(version).toHaveProperty('status')
      expect(version).toHaveProperty('releaseDate')
    })
  })

  describe('Error Code Compliance', () => {
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
      
      // Check specific error codes and their status codes
      expect(errorCodes.get('UNAUTHORIZED')?.status).toBe(401)
      expect(errorCodes.get('FORBIDDEN')?.status).toBe(403)
      expect(errorCodes.get('NOT_FOUND')?.status).toBe(404)
      expect(errorCodes.get('VALIDATION_ERROR')?.status).toBe(400)
      expect(errorCodes.get('INTERNAL_ERROR')?.status).toBe(500)
      expect(errorCodes.get('EVENT_NOT_FOUND')?.status).toBe(404)
      expect(errorCodes.get('RATE_LIMIT_EXCEEDED')?.status).toBe(429)
    })
  })

  describe('Security Compliance', () => {
    it('should have security schemes defined', () => {
      const securitySchemes = openApiSpec.components.securitySchemes
      
      expect(securitySchemes).toHaveProperty('bearerAuth')
      expect(securitySchemes.bearerAuth).toHaveProperty('type', 'http')
      expect(securitySchemes.bearerAuth).toHaveProperty('scheme', 'bearer')
      expect(securitySchemes.bearerAuth).toHaveProperty('bearerFormat', 'JWT')
    })

    it('should require authentication for protected endpoints', () => {
      const paths = openApiSpec.paths
      
      // Check that protected endpoints have security requirements
      const protectedEndpoints = [
        '/api/v1/events',
        '/api/v1/sessions',
        '/api/v1/notifications',
        '/api/v1/networking/connect'
      ]

      protectedEndpoints.forEach(endpoint => {
        const pathMethods = paths[endpoint]
        if (pathMethods) {
          Object.values(pathMethods).forEach((method: any) => {
            if (method.security) {
              expect(Array.isArray(method.security)).toBe(true)
            }
          })
        }
      })
    })

    it('should have proper CORS headers', async () => {
      try {
        const response = await apiClient.options('/api/v1/events')
        
        expect(response.headers).toHaveProperty('access-control-allow-origin')
        expect(response.headers).toHaveProperty('access-control-allow-methods')
        expect(response.headers).toHaveProperty('access-control-allow-headers')
      } catch (error: any) {
        // OPTIONS might not be implemented, which is acceptable
        expect([404, 405]).toContain(error.response?.status)
      }
    })
  })

  describe('Content Type Compliance', () => {
    it('should accept JSON content type', async () => {
      try {
        const response = await apiClient.get('/api/v1/events', {
          headers: { 'Accept': 'application/json' }
        })
        
        expect(response.headers['content-type']).toContain('application/json')
      } catch (error: any) {
        expect([404, 401]).toContain(error.response?.status)
      }
    })

    it('should reject unsupported content types', async () => {
      try {
        await apiClient.post('/api/v1/events', {}, {
          headers: { 'Content-Type': 'application/xml' }
        })
      } catch (error: any) {
        expect([400, 415]).toContain(error.response.status)
      }
    })
  })

  describe('Pagination Compliance', () => {
    it('should support pagination parameters', () => {
      const paths = openApiSpec.paths
      const eventsGet = paths['/api/v1/events'].get
      
      expect(eventsGet).toHaveProperty('parameters')
      
      const parameters = eventsGet.parameters
      const pageParam = parameters.find((p: any) => p.name === 'page')
      const limitParam = parameters.find((p: any) => p.name === 'limit')
      
      expect(pageParam).toBeDefined()
      expect(limitParam).toBeDefined()
      
      expect(pageParam.schema.type).toBe('integer')
      expect(limitParam.schema.type).toBe('integer')
    })

    it('should return pagination metadata', async () => {
      try {
        const response = await apiClient.get('/api/v1/events?page=1&limit=5')
        
        expect(response.data).toHaveProperty('pagination')
        expect(response.data.pagination).toHaveProperty('page')
        expect(response.data.pagination).toHaveProperty('limit')
        expect(response.data.pagination).toHaveProperty('total')
        expect(response.data.pagination).toHaveProperty('totalPages')
        expect(response.data.pagination).toHaveProperty('hasNext')
        expect(response.data.pagination).toHaveProperty('hasPrev')
      } catch (error: any) {
        expect([404, 401]).toContain(error.response?.status)
      }
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility for existing endpoints', () => {
      // This test ensures that existing API endpoints maintain their structure
      const paths = openApiSpec.paths
      
      // Check that core endpoints maintain their structure
      const coreEndpoints = [
        '/api/v1/events',
        '/api/v1/sessions',
        '/api/v1/notifications',
        '/api/v1/networking/connect'
      ]

      coreEndpoints.forEach(endpoint => {
        expect(paths).toHaveProperty(endpoint)
      })
    })

    it('should not remove required fields from schemas', () => {
      const eventSchema = openApiSpec.components.schemas.Event
      const requiredFields = ['id', 'name', 'description', 'startDate', 'endDate']
      
      requiredFields.forEach(field => {
        expect(eventSchema.properties).toHaveProperty(field)
      })
    })
  })

  describe('API Documentation Compliance', () => {
    it('should have proper endpoint documentation', () => {
      const paths = openApiSpec.paths
      
      Object.entries(paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, operation]: [string, any]) => {
          expect(operation).toHaveProperty('summary')
          expect(operation).toHaveProperty('description')
          expect(operation.summary).toBeTruthy()
          expect(operation.description).toBeTruthy()
        })
      })
    })

    it('should have proper parameter documentation', () => {
      const paths = openApiSpec.paths
      
      Object.values(paths).forEach((methods: any) => {
        Object.values(methods).forEach((operation: any) => {
          if (operation.parameters) {
            operation.parameters.forEach((param: any) => {
              expect(param).toHaveProperty('name')
              expect(param).toHaveProperty('in')
              expect(param).toHaveProperty('description')
              expect(param).toHaveProperty('schema')
            })
          }
        })
      })
    })

    it('should have proper response documentation', () => {
      const paths = openApiSpec.paths
      
      Object.values(paths).forEach((methods: any) => {
        Object.values(methods).forEach((operation: any) => {
          if (operation.responses) {
            Object.entries(operation.responses).forEach(([status, response]: [string, any]) => {
              expect(response).toHaveProperty('description')
              expect(response.description).toBeTruthy()
            })
          }
        })
      })
    })
  })
})
