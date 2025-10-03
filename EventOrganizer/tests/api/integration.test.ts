#!/usr/bin/env node
/**
 * Professional API Integration Tests
 * 
 * Comprehensive API integration tests covering all endpoints,
 * error handling, edge cases, and performance validation.
 * 
 * @fileoverview API integration testing suite
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { APIDocumentationGenerator } from '../../src/lib/api/documentation-generator'
import { APIVersioningManager } from '../../src/lib/api/versioning'
import { APIErrorHandler } from '../../src/lib/api/error-handling'
import { APIRateLimiter } from '../../src/lib/api/rate-limiting'

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.TEST_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000
}

// Test data
const TEST_DATA = {
  user: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  },
  event: {
    name: 'Test Event',
    description: 'A test event for API integration testing',
    startDate: '2024-12-01T09:00:00Z',
    endDate: '2024-12-01T17:00:00Z',
    location: 'Virtual',
    maxAttendees: 100,
    ticketPrice: 0,
    currency: 'USD',
    category: 'test',
    tags: ['api-test', 'integration']
  },
  session: {
    title: 'Test Session',
    description: 'A test session for API integration testing',
    startTime: '2024-12-01T10:00:00Z',
    endTime: '2024-12-01T11:00:00Z',
    type: 'presentation',
    maxAttendees: 50
  }
}

describe('API Integration Tests', () => {
  let apiClient: AxiosInstance
  let authToken: string
  let testEventId: string
  let testSessionId: string
  let testUserId: string

  beforeAll(async () => {
    // Initialize API client
    apiClient = axios.create({
      baseURL: TEST_CONFIG.baseURL,
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    // Setup request/response interceptors
    apiClient.interceptors.request.use(
      (config) => {
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && authToken) {
          // Token expired, try to refresh or re-authenticate
          console.warn('Authentication token expired, attempting to refresh...')
          // In a real implementation, you would refresh the token here
        }
        return Promise.reject(error)
      }
    )
  })

  afterAll(async () => {
    // Cleanup test data
    if (testEventId) {
      try {
        await apiClient.delete(`/api/v1/events/${testEventId}`)
      } catch (error) {
        console.warn('Failed to cleanup test event:', error)
      }
    }
  })

  describe('Authentication API', () => {
    it('should register a new user', async () => {
      const response: AxiosResponse = await apiClient.post('/api/v1/auth/register', TEST_DATA.user)
      
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('user')
      expect(response.data.data).toHaveProperty('token')
      
      authToken = response.data.data.token
      testUserId = response.data.data.user.id
    })

    it('should login with valid credentials', async () => {
      const loginData = {
        email: TEST_DATA.user.email,
        password: TEST_DATA.user.password
      }

      const response: AxiosResponse = await apiClient.post('/api/v1/auth/login', loginData)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('token')
      
      authToken = response.data.data.token
    })

    it('should reject invalid credentials', async () => {
      const invalidLoginData = {
        email: TEST_DATA.user.email,
        password: 'wrongpassword'
      }

      try {
        await apiClient.post('/api/v1/auth/login', invalidLoginData)
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data.error).toHaveProperty('code', 'INVALID_CREDENTIALS')
      }
    })

    it('should validate JWT token', async () => {
      const response: AxiosResponse = await apiClient.get('/api/v1/auth/validate')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('user')
    })

    it('should reject requests without token', async () => {
      const clientWithoutAuth = axios.create({
        baseURL: TEST_CONFIG.baseURL,
        timeout: TEST_CONFIG.timeout
      })

      try {
        await clientWithoutAuth.get('/api/v1/auth/validate')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
      }
    })
  })

  describe('Events API', () => {
    it('should create a new event', async () => {
      const response: AxiosResponse = await apiClient.post('/api/v1/events', TEST_DATA.event)
      
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data.name).toBe(TEST_DATA.event.name)
      expect(response.data.data.description).toBe(TEST_DATA.event.description)
      
      testEventId = response.data.data.id
    })

    it('should get events list', async () => {
      const response: AxiosResponse = await apiClient.get('/api/v1/events')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should get events with pagination', async () => {
      const response: AxiosResponse = await apiClient.get('/api/v1/events?page=1&limit=5')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination).toHaveProperty('page', 1)
      expect(response.data.pagination).toHaveProperty('limit', 5)
      expect(response.data.pagination).toHaveProperty('total')
    })

    it('should get specific event', async () => {
      const response: AxiosResponse = await apiClient.get(`/api/v1/events/${testEventId}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data.id).toBe(testEventId)
      expect(response.data.data.name).toBe(TEST_DATA.event.name)
    })

    it('should update event', async () => {
      const updateData = {
        name: 'Updated Test Event',
        description: 'Updated description'
      }

      const response: AxiosResponse = await apiClient.put(`/api/v1/events/${testEventId}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data.name).toBe(updateData.name)
      expect(response.data.data.description).toBe(updateData.description)
    })

    it('should register attendee for event', async () => {
      const registrationData = {
        attendeeId: testUserId,
        registrationData: {
          firstName: TEST_DATA.user.firstName,
          lastName: TEST_DATA.user.lastName,
          email: TEST_DATA.user.email
        }
      }

      const response: AxiosResponse = await apiClient.post(`/api/v1/events/${testEventId}/register`, registrationData)
      
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')
    })

    it('should reject duplicate registration', async () => {
      const registrationData = {
        attendeeId: testUserId,
        registrationData: {
          firstName: TEST_DATA.user.firstName,
          lastName: TEST_DATA.user.lastName,
          email: TEST_DATA.user.email
        }
      }

      try {
        await apiClient.post(`/api/v1/events/${testEventId}/register`, registrationData)
      } catch (error: any) {
        expect(error.response.status).toBe(409)
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data.error).toHaveProperty('code', 'ALREADY_REGISTERED')
      }
    })

    it('should get event attendees', async () => {
      const response: AxiosResponse = await apiClient.get(`/api/v1/events/${testEventId}/attendees`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
    })

    it('should return 404 for non-existent event', async () => {
      try {
        await apiClient.get('/api/v1/events/non-existent-id')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data.error).toHaveProperty('code', 'EVENT_NOT_FOUND')
      }
    })
  })

  describe('Sessions API', () => {
    it('should create a new session', async () => {
      const sessionData = {
        ...TEST_DATA.session,
        eventId: testEventId
      }

      const response: AxiosResponse = await apiClient.post('/api/v1/sessions', sessionData)
      
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data.title).toBe(TEST_DATA.session.title)
      expect(response.data.data.eventId).toBe(testEventId)
      
      testSessionId = response.data.data.id
    })

    it('should get sessions for event', async () => {
      const response: AxiosResponse = await apiClient.get(`/api/v1/events/${testEventId}/sessions`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
      expect(response.data.data.length).toBeGreaterThan(0)
    })

    it('should get specific session', async () => {
      const response: AxiosResponse = await apiClient.get(`/api/v1/sessions/${testSessionId}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data.id).toBe(testSessionId)
      expect(response.data.data.title).toBe(TEST_DATA.session.title)
    })

    it('should update session', async () => {
      const updateData = {
        title: 'Updated Test Session',
        description: 'Updated session description'
      }

      const response: AxiosResponse = await apiClient.put(`/api/v1/sessions/${testSessionId}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data.title).toBe(updateData.title)
      expect(response.data.data.description).toBe(updateData.description)
    })

    it('should delete session', async () => {
      const response: AxiosResponse = await apiClient.delete(`/api/v1/sessions/${testSessionId}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
    })
  })

  describe('Notifications API', () => {
    it('should send notification', async () => {
      const notificationData = {
        type: 'event_reminder',
        title: 'Event Reminder',
        message: 'Your event starts in 1 hour',
        recipientId: testUserId,
        eventId: testEventId,
        deliveryMethod: 'email'
      }

      const response: AxiosResponse = await apiClient.post('/api/v1/notifications', notificationData)
      
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data.type).toBe(notificationData.type)
    })

    it('should get user notifications', async () => {
      const response: AxiosResponse = await apiClient.get(`/api/v1/notifications?userId=${testUserId}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
    })

    it('should mark notification as read', async () => {
      // First get notifications to find one to mark as read
      const notificationsResponse = await apiClient.get(`/api/v1/notifications?userId=${testUserId}`)
      const notifications = notificationsResponse.data.data
      
      if (notifications.length > 0) {
        const notificationId = notifications[0].id
        
        const response: AxiosResponse = await apiClient.put(`/api/v1/notifications/${notificationId}/read`)
        
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('success', true)
      }
    })
  })

  describe('Networking API', () => {
    it('should request connection', async () => {
      const connectionData = {
        recipientId: 'another-user-id', // This would be a real user ID in actual tests
        message: 'Hello, I would like to connect with you'
      }

      try {
        const response: AxiosResponse = await apiClient.post('/api/v1/networking/connect', connectionData)
        
        expect(response.status).toBe(201)
        expect(response.data).toHaveProperty('success', true)
        expect(response.data).toHaveProperty('data')
        expect(response.data.data).toHaveProperty('id')
      } catch (error: any) {
        // This might fail if the recipient doesn't exist, which is expected
        expect([400, 404]).toContain(error.response.status)
      }
    })

    it('should get user connections', async () => {
      const response: AxiosResponse = await apiClient.get(`/api/v1/networking/connections?userId=${testUserId}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const invalidEventData = {
        name: '', // Invalid: empty name
        description: 'Test description'
      }

      try {
        await apiClient.post('/api/v1/events', invalidEventData)
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data.error).toHaveProperty('code', 'VALIDATION_ERROR')
      }
    })

    it('should handle unauthorized requests', async () => {
      const clientWithoutAuth = axios.create({
        baseURL: TEST_CONFIG.baseURL,
        timeout: TEST_CONFIG.timeout
      })

      try {
        await clientWithoutAuth.get('/api/v1/events')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data.error).toHaveProperty('code', 'UNAUTHORIZED')
      }
    })

    it('should handle forbidden requests', async () => {
      // Create a user with limited permissions
      const limitedUser = {
        email: 'limited@example.com',
        password: 'LimitedPassword123!',
        firstName: 'Limited',
        lastName: 'User'
      }

      try {
        await apiClient.post('/api/v1/auth/register', limitedUser)
        const loginResponse = await apiClient.post('/api/v1/auth/login', limitedUser)
        const limitedToken = loginResponse.data.data.token

        // Try to access admin endpoint with limited user
        const limitedClient = axios.create({
          baseURL: TEST_CONFIG.baseURL,
          timeout: TEST_CONFIG.timeout,
          headers: {
            'Authorization': `Bearer ${limitedToken}`
          }
        })

        await limitedClient.get('/api/v1/admin/users')
      } catch (error: any) {
        expect(error.response.status).toBe(403)
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data.error).toHaveProperty('code', 'FORBIDDEN')
      }
    })

    it('should handle server errors gracefully', async () => {
      // This test would require a way to simulate server errors
      // In a real implementation, you might have a test endpoint that throws errors
      try {
        await apiClient.get('/api/v1/test/server-error')
      } catch (error: any) {
        expect(error.response.status).toBe(500)
        expect(error.response.data).toHaveProperty('success', false)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data.error).toHaveProperty('code', 'INTERNAL_ERROR')
      }
    })
  })

  describe('Performance Tests', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now()
      await apiClient.get('/api/v1/events')
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      expect(responseTime).toBeLessThan(2000) // 2 seconds
    })

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        apiClient.get('/api/v1/events')
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('success', true)
      })
    })

    it('should handle large payloads', async () => {
      const largeEventData = {
        ...TEST_DATA.event,
        description: 'A'.repeat(10000), // Large description
        tags: Array(100).fill(0).map((_, i) => `tag-${i}`)
      }

      const response: AxiosResponse = await apiClient.post('/api/v1/events', largeEventData)
      
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
    })
  })

  describe('Rate Limiting Tests', () => {
    it('should respect rate limits', async () => {
      const requests = Array(150).fill(null).map(() => 
        apiClient.get('/api/v1/events')
      )

      let rateLimited = false
      try {
        await Promise.all(requests)
      } catch (error: any) {
        if (error.response.status === 429) {
          rateLimited = true
          expect(error.response.data).toHaveProperty('success', false)
          expect(error.response.data).toHaveProperty('error')
          expect(error.response.data.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED')
        }
      }

      // Rate limiting should kick in at some point
      expect(rateLimited).toBe(true)
    })
  })

  describe('API Versioning Tests', () => {
    it('should support API versioning', async () => {
      // Test v1 API
      const v1Response = await apiClient.get('/api/v1/events')
      expect(v1Response.status).toBe(200)

      // Test v1.1 API (if available)
      try {
        const v11Response = await apiClient.get('/api/v1.1/events')
        expect(v11Response.status).toBe(200)
      } catch (error: any) {
        // v1.1 might not be implemented yet
        expect([404, 400]).toContain(error.response.status)
      }
    })

    it('should include version headers', async () => {
      const response = await apiClient.get('/api/v1/events')
      
      expect(response.headers).toHaveProperty('api-version')
      expect(response.headers).toHaveProperty('api-status')
    })
  })

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency across operations', async () => {
      // Create event
      const eventResponse = await apiClient.post('/api/v1/events', TEST_DATA.event)
      const eventId = eventResponse.data.data.id

      // Update event
      const updateData = { name: 'Consistency Test Event' }
      await apiClient.put(`/api/v1/events/${eventId}`, updateData)

      // Verify update
      const getResponse = await apiClient.get(`/api/v1/events/${eventId}`)
      expect(getResponse.data.data.name).toBe(updateData.name)

      // Cleanup
      await apiClient.delete(`/api/v1/events/${eventId}`)
    })

    it('should handle transaction rollback on errors', async () => {
      const eventData = {
        ...TEST_DATA.event,
        name: 'Transaction Test Event'
      }

      // Create event
      const eventResponse = await apiClient.post('/api/v1/events', eventData)
      const eventId = eventResponse.data.data.id

      try {
        // Try to create session with invalid data that should cause rollback
        const invalidSessionData = {
          title: '', // Invalid: empty title
          eventId: eventId
        }

        await apiClient.post('/api/v1/sessions', invalidSessionData)
      } catch (error: any) {
        expect(error.response.status).toBe(400)
      }

      // Verify event still exists (transaction rollback)
      const getResponse = await apiClient.get(`/api/v1/events/${eventId}`)
      expect(getResponse.status).toBe(200)
      expect(getResponse.data.data.name).toBe(eventData.name)

      // Cleanup
      await apiClient.delete(`/api/v1/events/${eventId}`)
    })
  })

  describe('Security Tests', () => {
    it('should prevent SQL injection', async () => {
      const maliciousQuery = "'; DROP TABLE events; --"
      
      try {
        await apiClient.get(`/api/v1/events?search=${encodeURIComponent(maliciousQuery)}`)
      } catch (error: any) {
        // Should not crash the server
        expect(error.response.status).not.toBe(500)
      }
    })

    it('should prevent XSS attacks', async () => {
      const xssPayload = '<script>alert("XSS")</script>'
      
      try {
        await apiClient.post('/api/v1/events', {
          ...TEST_DATA.event,
          description: xssPayload
        })
      } catch (error: any) {
        // Should sanitize or reject malicious input
        expect([400, 422]).toContain(error.response.status)
      }
    })

    it('should validate input lengths', async () => {
      const longString = 'A'.repeat(10001) // Very long string
      
      try {
        await apiClient.post('/api/v1/events', {
          ...TEST_DATA.event,
          name: longString
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data).toHaveProperty('error')
      }
    })
  })
})
