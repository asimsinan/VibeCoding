#!/usr/bin/env node
/**
 * Professional end-to-end test module for Application Integration
 * 
 * Tests cover:
 * - Complete user workflows
 * - Event creation and management
 * - Attendee registration and management
 * - Networking features
 * - Real-time notifications
 * - All functional requirements validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
const TEST_TIMEOUT = 30000

// Test data
const TEST_USERS = {
  organizer: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'organizer@test.com',
    role: 'organizer'
  },
  attendee: {
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'attendee@test.com',
    role: 'attendee'
  },
  admin: {
    id: '123e4567-e89b-12d3-a456-426614174003',
    email: 'admin@test.com',
    role: 'admin'
  }
}

const TEST_EVENT = {
  title: 'E2E Test Event',
  description: 'This is a test event for end-to-end testing',
  startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  endDate: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
  capacity: 100,
  isPublic: true
}

const TEST_SESSION = {
  title: 'E2E Test Session',
  speaker: 'Test Speaker',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // +30 minutes
  description: 'This is a test session'
}

// Helper function to create authenticated API client
function createAuthenticatedClient(userId: string) {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: TEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Mock authentication header
  client.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer mock-token-${userId}`
    return config
  })

  return client
}

// Helper function to create test event
async function createTestEvent(organizerClient: any) {
  const response = await organizerClient.post('/events', {
    ...TEST_EVENT,
    organizerId: TEST_USERS.organizer.id
  })
  return response.data.data
}

// Helper function to create test session
async function createTestSession(organizerClient: any, eventId: string) {
  const response = await organizerClient.post('/sessions', {
    ...TEST_SESSION,
    eventId
  })
  return response.data.data
}

describe('End-to-End Application Integration Tests', () => {
  let organizerClient: any
  let attendeeClient: any
  let adminClient: any
  let createdEventId: string
  let createdSessionId: string

  beforeEach(() => {
    organizerClient = createAuthenticatedClient(TEST_USERS.organizer.id)
    attendeeClient = createAuthenticatedClient(TEST_USERS.attendee.id)
    adminClient = createAuthenticatedClient(TEST_USERS.admin.id)
  })

  afterEach(async () => {
    // Cleanup test data
    if (createdEventId) {
      try {
        await adminClient.delete(`/events/${createdEventId}`)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  })

  describe('FR-001: User Authentication and Authorization', () => {
    it('should allow authenticated users to access protected endpoints', async () => {
      const response = await organizerClient.get('/events')
      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
    })

    it('should reject unauthenticated requests', async () => {
      try {
        await axios.get(`${API_BASE_URL}/events`)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('UNAUTHORIZED')
      }
    })

    it('should enforce role-based access control', async () => {
      // Attendee should not be able to create events
      try {
        await attendeeClient.post('/events', TEST_EVENT)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(403)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('FORBIDDEN')
      }
    })
  })

  describe('FR-002: Event Creation and Management', () => {
    it('should allow organizers to create events', async () => {
      const response = await organizerClient.post('/events', {
        ...TEST_EVENT,
        organizerId: TEST_USERS.organizer.id
      })

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(TEST_EVENT.title)
      expect(response.data.data.organizerId).toBe(TEST_USERS.organizer.id)
      
      createdEventId = response.data.data.id
    })

    it('should validate event creation data', async () => {
      try {
        await organizerClient.post('/events', {
          title: '', // Invalid empty title
          description: 'Test description',
          startDate: TEST_EVENT.startDate,
          endDate: TEST_EVENT.endDate,
          capacity: 100
        })
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('VALIDATION_ERROR')
      }
    })

    it('should allow organizers to update their events', async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id

      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description'
      }

      const response = await organizerClient.put(`/events/${event.id}`, updateData)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(updateData.title)
      expect(response.data.data.description).toBe(updateData.description)
    })

    it('should prevent unauthorized users from updating events', async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id

      try {
        await attendeeClient.put(`/events/${event.id}`, {
          title: 'Unauthorized Update'
        })
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(403)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('FORBIDDEN')
      }
    })

    it('should allow organizers to cancel their events', async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id

      const response = await organizerClient.delete(`/events/${event.id}`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.message).toBe('Event cancelled successfully')
    })
  })

  describe('FR-003: Event Registration', () => {
    beforeEach(async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id
    })

    it('should allow attendees to register for events', async () => {
      const response = await attendeeClient.post(`/events/${createdEventId}/register`, {
        attendeeId: TEST_USERS.attendee.id
      })

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.eventId).toBe(createdEventId)
      expect(response.data.data.attendeeId).toBe(TEST_USERS.attendee.id)
    })

    it('should prevent duplicate registrations', async () => {
      // First registration
      await attendeeClient.post(`/events/${createdEventId}/register`, {
        attendeeId: TEST_USERS.attendee.id
      })

      // Second registration should fail
      try {
        await attendeeClient.post(`/events/${createdEventId}/register`, {
          attendeeId: TEST_USERS.attendee.id
        })
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('ALREADY_REGISTERED')
      }
    })

    it('should enforce event capacity limits', async () => {
      // Create event with capacity of 1
      const limitedEvent = await organizerClient.post('/events', {
        ...TEST_EVENT,
        capacity: 1,
        organizerId: TEST_USERS.organizer.id
      })

      // First registration should succeed
      await attendeeClient.post(`/events/${limitedEvent.data.data.id}/register`, {
        attendeeId: TEST_USERS.attendee.id
      })

      // Second registration should fail
      try {
        await attendeeClient.post(`/events/${limitedEvent.data.data.id}/register`, {
          attendeeId: TEST_USERS.admin.id
        })
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('EVENT_FULL')
      }
    })
  })

  describe('FR-004: Real-time Attendee Management', () => {
    beforeEach(async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id
    })

    it('should allow organizers to view attendee lists', async () => {
      // Register an attendee first
      await attendeeClient.post(`/events/${createdEventId}/register`, {
        attendeeId: TEST_USERS.attendee.id
      })

      const response = await organizerClient.get(`/events/${createdEventId}/attendees`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.attendees).toHaveLength(1)
      expect(response.data.data.attendees[0].attendeeId).toBe(TEST_USERS.attendee.id)
    })

    it('should prevent unauthorized access to attendee lists', async () => {
      try {
        await attendeeClient.get(`/events/${createdEventId}/attendees`)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(403)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('FORBIDDEN')
      }
    })

    it('should update attendee count in real-time', async () => {
      // Get initial event data
      const initialEvent = await organizerClient.get(`/events/${createdEventId}`)
      const initialCount = initialEvent.data.data.attendeeCount

      // Register an attendee
      await attendeeClient.post(`/events/${createdEventId}/register`, {
        attendeeId: TEST_USERS.attendee.id
      })

      // Get updated event data
      const updatedEvent = await organizerClient.get(`/events/${createdEventId}`)
      const updatedCount = updatedEvent.data.data.attendeeCount

      expect(updatedCount).toBe(initialCount + 1)
    })
  })

  describe('FR-005: Session Scheduling and Management', () => {
    beforeEach(async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id
    })

    it('should allow organizers to create sessions', async () => {
      const response = await organizerClient.post('/sessions', {
        ...TEST_SESSION,
        eventId: createdEventId
      })

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(TEST_SESSION.title)
      expect(response.data.data.eventId).toBe(createdEventId)
      
      createdSessionId = response.data.data.id
    })

    it('should validate session time slots within event duration', async () => {
      const invalidSession = {
        ...TEST_SESSION,
        eventId: createdEventId,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        endTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() // Yesterday + 1 hour
      }

      try {
        await organizerClient.post('/sessions', invalidSession)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('INVALID_TIME_SLOT')
      }
    })

    it('should prevent overlapping sessions', async () => {
      // Create first session
      await organizerClient.post('/sessions', {
        ...TEST_SESSION,
        eventId: createdEventId
      })

      // Try to create overlapping session
      const overlappingSession = {
        ...TEST_SESSION,
        eventId: createdEventId,
        title: 'Overlapping Session'
      }

      try {
        await organizerClient.post('/sessions', overlappingSession)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('SESSION_OVERLAP')
      }
    })

    it('should allow organizers to update sessions', async () => {
      const session = await createTestSession(organizerClient, createdEventId)
      createdSessionId = session.id

      const updateData = {
        title: 'Updated Session Title',
        description: 'Updated session description'
      }

      const response = await organizerClient.put(`/sessions/${session.id}`, updateData)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(updateData.title)
      expect(response.data.data.description).toBe(updateData.description)
    })
  })

  describe('FR-006: Attendee Networking and Connections', () => {
    it('should allow attendees to request connections', async () => {
      const response = await attendeeClient.post('/networking/connect', {
        recipientId: TEST_USERS.admin.id,
        message: 'Hi, I would like to connect!'
      })

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.recipientId).toBe(TEST_USERS.admin.id)
      expect(response.data.data.status).toBe('pending')
      expect(response.data.data.message).toBe('Hi, I would like to connect!')
    })

    it('should prevent self-connection requests', async () => {
      try {
        await attendeeClient.post('/networking/connect', {
          recipientId: TEST_USERS.attendee.id, // Same as requester
          message: 'Self connection attempt'
        })
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('SELF_CONNECTION')
      }
    })

    it('should allow users to view their connections', async () => {
      // Create a connection request first
      await attendeeClient.post('/networking/connect', {
        recipientId: TEST_USERS.admin.id,
        message: 'Connection request'
      })

      const response = await attendeeClient.get('/networking/connections')

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.connections).toBeDefined()
    })

    it('should allow users to accept connection requests', async () => {
      // Create a connection request
      const connectionResponse = await attendeeClient.post('/networking/connect', {
        recipientId: TEST_USERS.admin.id,
        message: 'Connection request'
      })

      const connectionId = connectionResponse.data.data.id

      // Accept the connection (as admin)
      const response = await adminClient.put(`/networking/connections/${connectionId}/accept`, {
        message: 'Connection accepted!'
      })

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.status).toBe('accepted')
    })
  })

  describe('FR-007: Real-time Notifications', () => {
    beforeEach(async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id
    })

    it('should allow organizers to send notifications', async () => {
      const notificationData = {
        eventId: createdEventId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'announcement',
        priority: 'medium'
      }

      const response = await organizerClient.post('/notifications', notificationData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(notificationData.title)
      expect(response.data.data.message).toBe(notificationData.message)
    })

    it('should prevent attendees from sending notifications', async () => {
      const notificationData = {
        eventId: createdEventId,
        title: 'Unauthorized Notification',
        message: 'This should not be allowed',
        type: 'announcement',
        priority: 'medium'
      }

      try {
        await attendeeClient.post('/notifications', notificationData)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(403)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('FORBIDDEN')
      }
    })

    it('should allow users to retrieve their notifications', async () => {
      const response = await attendeeClient.get('/notifications')

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.notifications).toBeDefined()
      expect(response.data.data.pagination).toBeDefined()
    })
  })

  describe('FR-008: Event Analytics and Reporting', () => {
    beforeEach(async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id

      // Register some attendees
      await attendeeClient.post(`/events/${createdEventId}/register`, {
        attendeeId: TEST_USERS.attendee.id
      })
    })

    it('should provide event analytics for organizers', async () => {
      const response = await organizerClient.get(`/events/${createdEventId}/analytics`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.totalRegistrations).toBeDefined()
      expect(response.data.data.attendeeCount).toBeDefined()
    })

    it('should prevent unauthorized access to analytics', async () => {
      try {
        await attendeeClient.get(`/events/${createdEventId}/analytics`)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(403)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('FORBIDDEN')
      }
    })
  })

  describe('Cross-Functional Integration Tests', () => {
    beforeEach(async () => {
      const event = await createTestEvent(organizerClient)
      createdEventId = event.id
    })

    it('should handle complete event lifecycle', async () => {
      // 1. Create event
      expect(createdEventId).toBeDefined()

      // 2. Register attendees
      await attendeeClient.post(`/events/${createdEventId}/register`, {
        attendeeId: TEST_USERS.attendee.id
      })

      // 3. Create sessions
      const session = await createTestSession(organizerClient, createdEventId)
      createdSessionId = session.id

      // 4. Send notifications
      await organizerClient.post('/notifications', {
        eventId: createdEventId,
        title: 'Event Update',
        message: 'New session added!',
        type: 'schedule_change',
        priority: 'medium'
      })

      // 5. Facilitate networking
      await attendeeClient.post('/networking/connect', {
        recipientId: TEST_USERS.admin.id,
        message: 'Great event!'
      })

      // 6. View analytics
      const analytics = await organizerClient.get(`/events/${createdEventId}/analytics`)
      expect(analytics.data.success).toBe(true)

      // 7. Cancel event
      await organizerClient.delete(`/events/${createdEventId}`)
    })

    it('should handle concurrent operations gracefully', async () => {
      // Simulate concurrent registrations
      const registrationPromises = [
        attendeeClient.post(`/events/${createdEventId}/register`, {
          attendeeId: TEST_USERS.attendee.id
        }),
        adminClient.post(`/events/${createdEventId}/register`, {
          attendeeId: TEST_USERS.admin.id
        })
      ]

      const results = await Promise.allSettled(registrationPromises)
      
      // At least one should succeed
      const successfulRegistrations = results.filter(result => 
        result.status === 'fulfilled'
      )
      expect(successfulRegistrations.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent event IDs gracefully', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999'
      
      try {
        await organizerClient.get(`/events/${nonExistentId}`)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('NOT_FOUND')
      }
    })

    it('should handle malformed request data', async () => {
      try {
        await organizerClient.post('/events', {
          title: 123, // Invalid type
          description: 'Test',
          startDate: 'invalid-date',
          endDate: 'invalid-date',
          capacity: 'not-a-number'
        })
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('VALIDATION_ERROR')
      }
    })

    it('should handle network timeouts gracefully', async () => {
      const timeoutClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 1, // 1ms timeout
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock-token-${TEST_USERS.organizer.id}`
        }
      })

      try {
        await timeoutClient.get('/events')
        fail('Should have thrown a timeout error')
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED')
      }
    })
  })
})
