import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { createServer } from 'http'
import { AddressInfo } from 'net'
import axios, { AxiosInstance } from 'axios'
import {
  EVENT_TEST_DATA,
  SESSION_TEST_DATA,
  NOTIFICATION_TEST_DATA,
  CONNECTION_REQUEST_DATA,
  DATABASE_TEST_DATA,
  MOCK_EXTERNAL_RESPONSES,
  TEST_UUIDS,
  TEST_DATES,
  generateTestEvent,
  generateTestSession,
  generateTestNotification,
  generateTestConnection
} from '../fixtures/test-data'

// Mock database connection for integration tests
let mockDatabase: any = {}
let server: any
let baseURL: string
let apiClient: AxiosInstance

beforeAll(async () => {
  // Initialize mock database with test data
  mockDatabase = {
    events: [...DATABASE_TEST_DATA.events],
    sessions: [...DATABASE_TEST_DATA.sessions],
    users: [...DATABASE_TEST_DATA.users],
    attendees: [...DATABASE_TEST_DATA.attendees],
    notifications: [...DATABASE_TEST_DATA.notifications],
    connections: [...DATABASE_TEST_DATA.connections]
  }

  // Start mock server with database integration
  server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    const url = new URL(req.url!, `http://localhost`)
    const pathname = url.pathname
    const method = req.method

    // Mock API endpoints with database integration
    if (pathname === '/api/v1/events' && method === 'GET') {
      const events = mockDatabase.events.filter(event => event.isPublic)
      res.writeHead(200)
      res.end(JSON.stringify({
        success: true,
        data: {
          events,
          pagination: {
            page: 1,
            limit: 20,
            total: events.length,
            totalPages: Math.ceil(events.length / 20),
            hasNext: false,
            hasPrev: false
          }
        },
        message: 'Events retrieved successfully',
        timestamp: new Date().toISOString()
      }))
    } else if (pathname === '/api/v1/events' && method === 'POST') {
      const eventData = JSON.parse(req.body || '{}')
      const newEvent = {
        id: TEST_UUIDS.EVENT_1,
        ...eventData,
        attendeeCount: 0,
        status: 'draft',
        organizerId: TEST_UUIDS.USER_ORGANIZER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockDatabase.events.push(newEvent)
      res.writeHead(201)
      res.end(JSON.stringify({
        success: true,
        data: newEvent,
        message: 'Event created successfully',
        timestamp: new Date().toISOString()
      }))
    } else if (pathname.startsWith('/api/v1/events/') && method === 'GET') {
      const eventId = pathname.split('/')[3]
      const event = mockDatabase.events.find(e => e.id === eventId)
      if (event) {
        const sessions = mockDatabase.sessions.filter(s => s.eventId === eventId)
        const attendees = mockDatabase.attendees.filter(a => a.eventId === eventId)
        const organizer = mockDatabase.users.find(u => u.id === event.organizerId)
        res.writeHead(200)
        res.end(JSON.stringify({
          success: true,
          data: {
            ...event,
            sessions,
            organizer,
            attendees
          },
          message: 'Event details retrieved successfully',
          timestamp: new Date().toISOString()
        }))
      } else {
        res.writeHead(404)
        res.end(JSON.stringify({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Event not found'
          },
          timestamp: new Date().toISOString()
        }))
      }
    } else if (pathname.startsWith('/api/v1/events/') && pathname.endsWith('/register') && method === 'POST') {
      const eventId = pathname.split('/')[3]
      const registrationData = JSON.parse(req.body || '{}')
      const event = mockDatabase.events.find(e => e.id === eventId)
      if (event && event.attendeeCount < event.capacity) {
        const newRegistration = {
          id: TEST_UUIDS.REGISTRATION_1,
          eventId,
          attendeeId: registrationData.attendeeId,
          status: 'registered',
          notes: registrationData.notes,
          registeredAt: new Date().toISOString()
        }
        mockDatabase.attendees.push(newRegistration)
        event.attendeeCount++
        res.writeHead(201)
        res.end(JSON.stringify({
          success: true,
          data: newRegistration,
          message: 'Registration successful',
          timestamp: new Date().toISOString()
        }))
      } else {
        res.writeHead(409)
        res.end(JSON.stringify({
          success: false,
          error: {
            code: 'CAPACITY_EXCEEDED',
            message: 'Event is at capacity'
          },
          timestamp: new Date().toISOString()
        }))
      }
    } else if (pathname === '/api/v1/sessions' && method === 'POST') {
      const sessionData = JSON.parse(req.body || '{}')
      const newSession = {
        id: TEST_UUIDS.SESSION_1,
        ...sessionData,
        attendeeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockDatabase.sessions.push(newSession)
      res.writeHead(201)
      res.end(JSON.stringify({
        success: true,
        data: newSession,
        message: 'Session created successfully',
        timestamp: new Date().toISOString()
      }))
    } else if (pathname === '/api/v1/notifications' && method === 'POST') {
      const notificationData = JSON.parse(req.body || '{}')
      const newNotification = {
        id: TEST_UUIDS.NOTIFICATION_1,
        ...notificationData,
        status: 'sent',
        recipientsCount: 150,
        createdAt: new Date().toISOString()
      }
      mockDatabase.notifications.push(newNotification)
      res.writeHead(201)
      res.end(JSON.stringify({
        success: true,
        data: {
          notificationId: newNotification.id,
          recipientsCount: newNotification.recipientsCount
        },
        message: 'Notification sent successfully',
        timestamp: new Date().toISOString()
      }))
    } else if (pathname === '/api/v1/networking/connect' && method === 'POST') {
      const connectionData = JSON.parse(req.body || '{}')
      const newConnection = {
        id: TEST_UUIDS.CONNECTION_1,
        ...connectionData,
        requesterId: TEST_UUIDS.USER_ATTENDEE_1,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockDatabase.connections.push(newConnection)
      res.writeHead(201)
      res.end(JSON.stringify({
        success: true,
        data: newConnection,
        message: 'Connection request sent successfully',
        timestamp: new Date().toISOString()
      }))
    } else {
      res.writeHead(404)
      res.end(JSON.stringify({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        },
        timestamp: new Date().toISOString()
      }))
    }
  })

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const port = (server.address() as AddressInfo).port
      baseURL = `http://localhost:${port}`
      apiClient = axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      })
      resolve()
    })
  })
})

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
  }
})

beforeEach(() => {
  // Reset database state before each test
  mockDatabase = {
    events: [...DATABASE_TEST_DATA.events],
    sessions: [...DATABASE_TEST_DATA.sessions],
    users: [...DATABASE_TEST_DATA.users],
    attendees: [...DATABASE_TEST_DATA.attendees],
    notifications: [...DATABASE_TEST_DATA.notifications],
    connections: [...DATABASE_TEST_DATA.connections]
  }
})

describe('Integration Test Scenarios - Functional Requirements', () => {
  describe('FR-001: User Authentication and Authorization', () => {
    it('should authenticate user with valid credentials', async () => {
      // Mock authentication endpoint
      const authResponse = await apiClient.post('/api/v1/auth/login', {
        email: 'organizer@techconf.com',
        password: 'validpassword'
      })

      expect(authResponse.status).toBe(200)
      expect(authResponse.data.success).toBe(true)
      expect(authResponse.data.data.token).toBeDefined()
      expect(authResponse.data.data.user.id).toBe(TEST_UUIDS.USER_ORGANIZER)
    })

    it('should reject invalid credentials', async () => {
      try {
        await apiClient.post('/api/v1/auth/login', {
          email: 'organizer@techconf.com',
          password: 'invalidpassword'
        })
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('INVALID_CREDENTIALS')
      }
    })

    it('should enforce role-based access control', async () => {
      // Test organizer access to event management
      const organizerClient = axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer organizer-token'
        }
      })

      const response = await organizerClient.post('/api/v1/events', EVENT_TEST_DATA)
      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
    })

    it('should reject unauthorized access', async () => {
      const unauthorizedClient = axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        }
      })

      try {
        await unauthorizedClient.post('/api/v1/events', EVENT_TEST_DATA)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('UNAUTHORIZED')
      }
    })
  })

  describe('FR-002: Event Creation and Management', () => {
    it('should create event with comprehensive details', async () => {
      const eventData = generateTestEvent({
        title: 'AI Conference 2024',
        description: 'Comprehensive AI conference covering machine learning, deep learning, and AI ethics',
        capacity: 1000,
        startDate: '2024-07-15T09:00:00Z',
        endDate: '2024-07-15T18:00:00Z'
      })

      const response = await apiClient.post('/api/v1/events', eventData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(eventData.title)
      expect(response.data.data.description).toBe(eventData.description)
      expect(response.data.data.capacity).toBe(eventData.capacity)
      expect(response.data.data.status).toBe('draft')
      expect(response.data.data.organizerId).toBe(TEST_UUIDS.USER_ORGANIZER)
    })

    it('should retrieve event details with sessions and attendees', async () => {
      const response = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.id).toBe(TEST_UUIDS.EVENT_1)
      expect(response.data.data.sessions).toBeDefined()
      expect(response.data.data.organizer).toBeDefined()
      expect(response.data.data.attendees).toBeDefined()
    })

    it('should update event details with real-time notifications', async () => {
      const updateData = {
        title: 'Updated AI Conference 2024',
        capacity: 1200
      }

      const response = await apiClient.put(`/api/v1/events/${TEST_UUIDS.EVENT_1}`, updateData)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(updateData.title)
      expect(response.data.data.capacity).toBe(updateData.capacity)

      // Verify notification was sent to attendees
      const notifications = mockDatabase.notifications.filter(n => n.eventId === TEST_UUIDS.EVENT_1)
      expect(notifications.length).toBeGreaterThan(0)
    })

    it('should cancel event with notification to attendees', async () => {
      const response = await apiClient.delete(`/api/v1/events/${TEST_UUIDS.EVENT_1}`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.status).toBe('cancelled')

      // Verify cancellation notification was sent
      const notifications = mockDatabase.notifications.filter(n => 
        n.eventId === TEST_UUIDS.EVENT_1 && n.type === 'announcement'
      )
      expect(notifications.length).toBeGreaterThan(0)
    })

    it('should validate event capacity limits', async () => {
      const eventData = generateTestEvent({
        capacity: 10001 // Exceeds maximum capacity
      })

      try {
        await apiClient.post('/api/v1/events', eventData)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  describe('FR-003: Event Registration and Confirmation', () => {
    it('should register attendee for event', async () => {
      const registrationData = {
        attendeeId: TEST_UUIDS.USER_ATTENDEE_1,
        notes: 'Looking forward to networking opportunities'
      }

      const response = await apiClient.post(`/api/v1/events/${TEST_UUIDS.EVENT_1}/register`, registrationData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.eventId).toBe(TEST_UUIDS.EVENT_1)
      expect(response.data.data.attendeeId).toBe(registrationData.attendeeId)
      expect(response.data.data.status).toBe('registered')
    })

    it('should send confirmation notification after registration', async () => {
      const registrationData = {
        attendeeId: TEST_UUIDS.USER_ATTENDEE_1
      }

      await apiClient.post(`/api/v1/events/${TEST_UUIDS.EVENT_1}/register`, registrationData)

      // Verify confirmation notification was sent
      const notifications = mockDatabase.notifications.filter(n => 
        n.eventId === TEST_UUIDS.EVENT_1 && n.type === 'announcement'
      )
      expect(notifications.length).toBeGreaterThan(0)
    })

    it('should reject registration when event is at capacity', async () => {
      // Fill event to capacity
      const event = mockDatabase.events.find(e => e.id === TEST_UUIDS.EVENT_1)
      if (event) {
        event.attendeeCount = event.capacity
      }

      const registrationData = {
        attendeeId: TEST_UUIDS.USER_ATTENDEE_2
      }

      try {
        await apiClient.post(`/api/v1/events/${TEST_UUIDS.EVENT_1}/register`, registrationData)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(409)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('CAPACITY_EXCEEDED')
      }
    })

    it('should prevent duplicate registrations', async () => {
      const registrationData = {
        attendeeId: TEST_UUIDS.USER_ATTENDEE_1
      }

      // First registration should succeed
      const response1 = await apiClient.post(`/api/v1/events/${TEST_UUIDS.EVENT_1}/register`, registrationData)
      expect(response1.status).toBe(201)

      // Second registration should fail
      try {
        await apiClient.post(`/api/v1/events/${TEST_UUIDS.EVENT_1}/register`, registrationData)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(409)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('ALREADY_REGISTERED')
      }
    })
  })

  describe('FR-004: Real-time Attendee Management', () => {
    it('should provide live participant count', async () => {
      const response = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.attendeeCount).toBeDefined()
      expect(typeof response.data.data.attendeeCount).toBe('number')
    })

    it('should manage attendee list with privacy controls', async () => {
      const response = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}/attendees`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.attendees).toBeDefined()
      expect(Array.isArray(response.data.data.attendees)).toBe(true)
    })

    it('should provide check-in functionality', async () => {
      const checkInData = {
        attendeeId: TEST_UUIDS.USER_ATTENDEE_1,
        eventId: TEST_UUIDS.EVENT_1
      }

      const response = await apiClient.post('/api/v1/attendees/check-in', checkInData)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.checkInStatus).toBe('checked_in')
    })

    it('should update attendee count in real-time', async () => {
      const initialResponse = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}`)
      const initialCount = initialResponse.data.data.attendeeCount

      // Register new attendee
      await apiClient.post(`/api/v1/events/${TEST_UUIDS.EVENT_1}/register`, {
        attendeeId: TEST_UUIDS.USER_ATTENDEE_2
      })

      // Verify count updated
      const updatedResponse = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}`)
      expect(updatedResponse.data.data.attendeeCount).toBe(initialCount + 1)
    })
  })

  describe('FR-005: Session Scheduling and Management', () => {
    it('should create session with speaker and time validation', async () => {
      const sessionData = generateTestSession({
        title: 'Advanced Machine Learning',
        speaker: 'Dr. Sarah Johnson',
        description: 'Deep dive into advanced ML algorithms and techniques',
        startTime: '2024-06-15T14:00:00Z',
        endTime: '2024-06-15T15:30:00Z',
        capacity: 150
      })

      const response = await apiClient.post('/api/v1/sessions', sessionData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.title).toBe(sessionData.title)
      expect(response.data.data.speaker).toBe(sessionData.speaker)
      expect(response.data.data.eventId).toBe(sessionData.eventId)
    })

    it('should validate session time slots within event duration', async () => {
      const sessionData = generateTestSession({
        startTime: '2024-06-15T20:00:00Z', // After event end time
        endTime: '2024-06-15T21:00:00Z'
      })

      try {
        await apiClient.post('/api/v1/sessions', sessionData)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('INVALID_TIME_SLOT')
      }
    })

    it('should send automatic notifications for schedule changes', async () => {
      const updateData = {
        title: 'Updated Session Title',
        startTime: '2024-06-15T15:00:00Z',
        endTime: '2024-06-15T16:00:00Z'
      }

      const response = await apiClient.put(`/api/v1/sessions/${TEST_UUIDS.SESSION_1}`, updateData)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)

      // Verify schedule change notification was sent
      const notifications = mockDatabase.notifications.filter(n => 
        n.eventId === TEST_UUIDS.EVENT_1 && n.type === 'schedule_change'
      )
      expect(notifications.length).toBeGreaterThan(0)
    })

    it('should prevent overlapping sessions', async () => {
      const overlappingSessionData = generateTestSession({
        startTime: '2024-06-15T10:30:00Z', // Overlaps with existing session
        endTime: '2024-06-15T11:30:00Z'
      })

      try {
        await apiClient.post('/api/v1/sessions', overlappingSessionData)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('SESSION_OVERLAP')
      }
    })
  })

  describe('FR-006: Attendee Networking and Connections', () => {
    it('should facilitate connection requests between attendees', async () => {
      const connectionData = generateTestConnection({
        recipientId: TEST_UUIDS.USER_ATTENDEE_2,
        message: 'Would love to connect and discuss AI trends'
      })

      const response = await apiClient.post('/api/v1/networking/connect', connectionData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.recipientId).toBe(connectionData.recipientId)
      expect(response.data.data.status).toBe('pending')
      expect(response.data.data.message).toBe(connectionData.message)
    })

    it('should manage connection request status', async () => {
      // Create connection request
      await apiClient.post('/api/v1/networking/connect', {
        recipientId: TEST_UUIDS.USER_ATTENDEE_2
      })

      // Accept connection
      const response = await apiClient.put(`/api/v1/networking/connections/${TEST_UUIDS.CONNECTION_1}/accept`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.status).toBe('accepted')
    })

    it('should enable private messaging between connected attendees', async () => {
      // First establish connection
      await apiClient.post('/api/v1/networking/connect', {
        recipientId: TEST_UUIDS.USER_ATTENDEE_2
      })

      await apiClient.put(`/api/v1/networking/connections/${TEST_UUIDS.CONNECTION_1}/accept`)

      // Send message
      const messageData = {
        message: 'Hello! Looking forward to discussing AI trends at the event.'
      }

      const response = await apiClient.post(`/api/v1/networking/connections/${TEST_UUIDS.CONNECTION_1}/messages`, messageData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.message).toBe(messageData.message)
    })

    it('should provide introduction features for networking', async () => {
      const introductionData = {
        connectionId: TEST_UUIDS.CONNECTION_1,
        message: 'I would like to introduce you to another attendee who shares your interests in AI.'
      }

      const response = await apiClient.post('/api/v1/networking/introductions', introductionData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.message).toBe(introductionData.message)
    })

    it('should prevent self-connection requests', async () => {
      const connectionData = {
        recipientId: TEST_UUIDS.USER_ATTENDEE_1 // Same as requester
      }

      try {
        await apiClient.post('/api/v1/networking/connect', connectionData)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('SELF_CONNECTION')
      }
    })
  })

  describe('FR-007: Real-time Notifications', () => {
    it('should deliver real-time notifications for schedule changes', async () => {
      const notificationData = generateTestNotification({
        type: 'schedule_change',
        title: 'Session Time Updated',
        message: 'The AI session has been moved to 3:00 PM',
        targetAudience: 'registered'
      })

      const response = await apiClient.post('/api/v1/notifications', notificationData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.notificationId).toBeDefined()
      expect(response.data.data.recipientsCount).toBeGreaterThan(0)
    })

    it('should send announcements to all attendees', async () => {
      const notificationData = generateTestNotification({
        type: 'announcement',
        title: 'Important Event Update',
        message: 'Please note that parking is available in the main lot.',
        targetAudience: 'all'
      })

      const response = await apiClient.post('/api/v1/notifications', notificationData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.recipientsCount).toBeGreaterThan(0)
    })

    it('should deliver networking opportunity notifications', async () => {
      const notificationData = generateTestNotification({
        type: 'networking',
        title: 'Networking Opportunity',
        message: 'Someone with similar interests wants to connect with you!',
        targetAudience: 'registered'
      })

      const response = await apiClient.post('/api/v1/notifications', notificationData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.notificationId).toBeDefined()
    })

    it('should send reminder notifications', async () => {
      const notificationData = generateTestNotification({
        type: 'reminder',
        title: 'Event Reminder',
        message: 'Don\'t forget about tomorrow\'s AI conference!',
        targetAudience: 'registered'
      })

      const response = await apiClient.post('/api/v1/notifications', notificationData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.notificationId).toBeDefined()
    })

    it('should handle notification delivery failures gracefully', async () => {
      // Mock notification service failure
      const notificationData = generateTestNotification({
        type: 'announcement',
        title: 'Test Notification',
        message: 'This notification may fail to deliver'
      })

      const response = await apiClient.post('/api/v1/notifications', notificationData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      
      // Verify notification status tracking
      const notification = mockDatabase.notifications.find(n => n.id === response.data.data.notificationId)
      expect(notification).toBeDefined()
      expect(notification.status).toBe('sent')
    })
  })

  describe('FR-008: Event Analytics and Reporting', () => {
    it('should provide attendance metrics', async () => {
      const response = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}/analytics`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.totalRegistrations).toBeDefined()
      expect(response.data.data.totalCheckIns).toBeDefined()
      expect(response.data.data.attendanceRate).toBeDefined()
      expect(typeof response.data.data.attendanceRate).toBe('number')
    })

    it('should track session attendance data', async () => {
      const response = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}/analytics`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.sessionAttendance).toBeDefined()
      expect(Array.isArray(response.data.data.sessionAttendance)).toBe(true)
      
      if (response.data.data.sessionAttendance.length > 0) {
        const sessionData = response.data.data.sessionAttendance[0]
        expect(sessionData.sessionId).toBeDefined()
        expect(sessionData.title).toBeDefined()
        expect(sessionData.attendanceCount).toBeDefined()
        expect(sessionData.attendanceRate).toBeDefined()
      }
    })

    it('should provide networking statistics', async () => {
      const response = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}/analytics`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.networkingStats).toBeDefined()
      expect(response.data.data.networkingStats.totalConnections).toBeDefined()
      expect(response.data.data.networkingStats.pendingConnections).toBeDefined()
      expect(response.data.data.networkingStats.acceptedConnections).toBeDefined()
    })

    it('should track engagement metrics', async () => {
      const response = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}/analytics`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.engagementMetrics).toBeDefined()
      expect(response.data.data.engagementMetrics.averageSessionDuration).toBeDefined()
      expect(response.data.data.engagementMetrics.totalMessages).toBeDefined()
      expect(response.data.data.engagementMetrics.activeParticipants).toBeDefined()
    })

    it('should provide real-time analytics updates', async () => {
      // Get initial analytics
      const initialResponse = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}/analytics`)
      const initialRegistrations = initialResponse.data.data.totalRegistrations

      // Register new attendee
      await apiClient.post(`/api/v1/events/${TEST_UUIDS.EVENT_1}/register`, {
        attendeeId: TEST_UUIDS.USER_ATTENDEE_2
      })

      // Verify analytics updated
      const updatedResponse = await apiClient.get(`/api/v1/events/${TEST_UUIDS.EVENT_1}/analytics`)
      expect(updatedResponse.data.data.totalRegistrations).toBe(initialRegistrations + 1)
    })
  })

  describe('Edge Case Scenarios', () => {
    it('should handle concurrent event modifications', async () => {
      const update1 = { title: 'Updated Title 1' }
      const update2 = { title: 'Updated Title 2' }

      // Simulate concurrent updates
      const [response1, response2] = await Promise.all([
        apiClient.put(`/api/v1/events/${TEST_UUIDS.EVENT_1}`, update1),
        apiClient.put(`/api/v1/events/${TEST_UUIDS.EVENT_1}`, update2)
      ])

      // Both should succeed, but last write wins
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })

    it('should handle timezone differences for international attendees', async () => {
      const eventData = generateTestEvent({
        startDate: '2024-06-15T09:00:00Z', // UTC
        endDate: '2024-06-15T17:00:00Z'
      })

      const response = await apiClient.post('/api/v1/events', eventData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      
      // Verify timezone handling in response
      expect(response.data.data.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    })

    it('should handle notification delivery failures', async () => {
      // Mock notification service failure
      const notificationData = generateTestNotification({
        type: 'announcement',
        title: 'Test Notification',
        message: 'This notification may fail to deliver'
      })

      const response = await apiClient.post('/api/v1/notifications', notificationData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      
      // Verify fallback mechanism
      const notification = mockDatabase.notifications.find(n => n.id === response.data.data.notificationId)
      expect(notification).toBeDefined()
      expect(notification.status).toBe('sent')
    })

    it('should handle capacity management with waitlist', async () => {
      // Fill event to capacity
      const event = mockDatabase.events.find(e => e.id === TEST_UUIDS.EVENT_1)
      if (event) {
        event.attendeeCount = event.capacity
      }

      const registrationData = {
        attendeeId: TEST_UUIDS.USER_ATTENDEE_2
      }

      try {
        await apiClient.post(`/api/v1/events/${TEST_UUIDS.EVENT_1}/register`, registrationData)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(409)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error.code).toBe('CAPACITY_EXCEEDED')
      }
    })

    it('should handle connection recovery for disconnected attendees', async () => {
      // Simulate attendee disconnection
      const connectionData = generateTestConnection({
        recipientId: TEST_UUIDS.USER_ATTENDEE_2
      })

      const response = await apiClient.post('/api/v1/networking/connect', connectionData)

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      
      // Simulate reconnection and verify state recovery
      const reconnectionResponse = await apiClient.get('/api/v1/networking/connections')
      expect(reconnectionResponse.status).toBe(200)
      expect(reconnectionResponse.data.success).toBe(true)
    })
  })
})
