import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'
import {
  createEventSchema,
  updateEventSchema,
  eventRegistrationSchema,
  createSessionSchema,
  updateSessionSchema,
  sendNotificationSchema,
  connectionRequestSchema,
  eventListQuerySchema,
  attendeeListQuerySchema,
  connectionListQuerySchema,
  successResponseSchema,
  errorResponseSchema,
  eventSchema,
  sessionSchema,
  attendeeSchema,
  userSchema,
  notificationSchema,
  connectionSchema,
  paginationSchema
} from '@/contracts/schemas'

describe('Schema Validation Tests', () => {
  describe('Event Schema Validation', () => {
    describe('createEventSchema', () => {
      it('should accept valid event creation data', () => {
        const validData = {
          title: 'Tech Conference 2024',
          description: 'Annual technology conference featuring the latest innovations',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 500,
          isPublic: true
        }

        const result = createEventSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.title).toBe(validData.title)
          expect(result.data.description).toBe(validData.description)
          expect(result.data.capacity).toBe(validData.capacity)
          expect(result.data.isPublic).toBe(validData.isPublic)
        }
      })

      it('should reject empty title', () => {
        const invalidData = {
          title: '',
          description: 'Test Description',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100
        }

        const result = createEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['title'])
        }
      })

      it('should reject title exceeding max length', () => {
        const invalidData = {
          title: 'A'.repeat(101), // Exceeds 100 character limit
          description: 'Test Description',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100
        }

        const result = createEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['title'])
        }
      })

      it('should reject description exceeding max length', () => {
        const invalidData = {
          title: 'Test Event',
          description: 'A'.repeat(1001), // Exceeds 1000 character limit
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100
        }

        const result = createEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['description'])
        }
      })

      it('should reject invalid date format', () => {
        const invalidData = {
          title: 'Test Event',
          description: 'Test Description',
          startDate: 'invalid-date',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100
        }

        const result = createEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['startDate'])
        }
      })

      it('should reject end date before start date', () => {
        const invalidData = {
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-06-15T17:00:00Z',
          endDate: '2024-06-15T09:00:00Z', // End before start
          capacity: 100
        }

        const result = createEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['endDate'])
        }
      })

      it('should reject start date in the past', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
        const invalidData = {
          title: 'Test Event',
          description: 'Test Description',
          startDate: pastDate,
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100
        }

        const result = createEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['startDate'])
        }
      })

      it('should reject capacity below minimum', () => {
        const invalidData = {
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 0 // Below minimum of 1
        }

        const result = createEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['capacity'])
        }
      })

      it('should reject capacity above maximum', () => {
        const invalidData = {
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 10001 // Above maximum of 10000
        }

        const result = createEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['capacity'])
        }
      })

      it('should default isPublic to true when not provided', () => {
        const data = {
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100
        }

        const result = createEventSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.isPublic).toBe(true)
        }
      })
    })

    describe('updateEventSchema', () => {
      it('should accept partial update data', () => {
        const validData = {
          title: 'Updated Event Title'
        }

        const result = updateEventSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept empty update object', () => {
        const result = updateEventSchema.safeParse({})
        expect(result.success).toBe(true)
      })

      it('should validate date consistency when both dates provided', () => {
        const invalidData = {
          startDate: '2024-06-15T17:00:00Z',
          endDate: '2024-06-15T09:00:00Z' // End before start
        }

        const result = updateEventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['endDate'])
        }
      })
    })

    describe('eventRegistrationSchema', () => {
      it('should accept valid registration data', () => {
        const validData = {
          attendeeId: '123e4567-e89b-12d3-a456-426614174002',
          notes: 'Looking forward to the event'
        }

        const result = eventRegistrationSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept registration without notes', () => {
        const validData = {
          attendeeId: '123e4567-e89b-12d3-a456-426614174002'
        }

        const result = eventRegistrationSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const invalidData = {
          attendeeId: 'invalid-uuid',
          notes: 'Looking forward to the event'
        }

        const result = eventRegistrationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['attendeeId'])
        }
      })

      it('should reject notes exceeding max length', () => {
        const invalidData = {
          attendeeId: '123e4567-e89b-12d3-a456-426614174002',
          notes: 'A'.repeat(501) // Exceeds 500 character limit
        }

        const result = eventRegistrationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['notes'])
        }
      })
    })
  })

  describe('Session Schema Validation', () => {
    describe('createSessionSchema', () => {
      it('should accept valid session creation data', () => {
        const validData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to AI',
          speaker: 'Dr. Jane Smith',
          description: 'An introduction to artificial intelligence concepts',
          startTime: '2024-06-15T10:00:00Z',
          endTime: '2024-06-15T11:00:00Z',
          capacity: 100
        }

        const result = createSessionSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept session without description', () => {
        const validData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to AI',
          speaker: 'Dr. Jane Smith',
          startTime: '2024-06-15T10:00:00Z',
          endTime: '2024-06-15T11:00:00Z',
          capacity: 100
        }

        const result = createSessionSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept session without capacity', () => {
        const validData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to AI',
          speaker: 'Dr. Jane Smith',
          startTime: '2024-06-15T10:00:00Z',
          endTime: '2024-06-15T11:00:00Z'
        }

        const result = createSessionSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject invalid event ID', () => {
        const invalidData = {
          eventId: 'invalid-uuid',
          title: 'Introduction to AI',
          speaker: 'Dr. Jane Smith',
          startTime: '2024-06-15T10:00:00Z',
          endTime: '2024-06-15T11:00:00Z'
        }

        const result = createSessionSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['eventId'])
        }
      })

      it('should reject empty title', () => {
        const invalidData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          title: '',
          speaker: 'Dr. Jane Smith',
          startTime: '2024-06-15T10:00:00Z',
          endTime: '2024-06-15T11:00:00Z'
        }

        const result = createSessionSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['title'])
        }
      })

      it('should reject empty speaker', () => {
        const invalidData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to AI',
          speaker: '',
          startTime: '2024-06-15T10:00:00Z',
          endTime: '2024-06-15T11:00:00Z'
        }

        const result = createSessionSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['speaker'])
        }
      })

      it('should reject end time before start time', () => {
        const invalidData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to AI',
          speaker: 'Dr. Jane Smith',
          startTime: '2024-06-15T11:00:00Z',
          endTime: '2024-06-15T10:00:00Z' // End before start
        }

        const result = createSessionSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['endTime'])
        }
      })

      it('should reject capacity below minimum', () => {
        const invalidData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to AI',
          speaker: 'Dr. Jane Smith',
          startTime: '2024-06-15T10:00:00Z',
          endTime: '2024-06-15T11:00:00Z',
          capacity: 0 // Below minimum of 1
        }

        const result = createSessionSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['capacity'])
        }
      })
    })
  })

  describe('Notification Schema Validation', () => {
    describe('sendNotificationSchema', () => {
      it('should accept valid notification data', () => {
        const validData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'announcement',
          title: 'Event Update',
          message: 'The event schedule has been updated',
          targetAudience: 'all'
        }

        const result = sendNotificationSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should default targetAudience to all', () => {
        const data = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'announcement',
          title: 'Event Update',
          message: 'The event schedule has been updated'
        }

        const result = sendNotificationSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.targetAudience).toBe('all')
        }
      })

      it('should reject invalid notification type', () => {
        const invalidData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'invalid_type',
          title: 'Event Update',
          message: 'The event schedule has been updated'
        }

        const result = sendNotificationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['type'])
        }
      })

      it('should reject invalid target audience', () => {
        const invalidData = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'announcement',
          title: 'Event Update',
          message: 'The event schedule has been updated',
          targetAudience: 'invalid_audience'
        }

        const result = sendNotificationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['targetAudience'])
        }
      })
    })
  })

  describe('Networking Schema Validation', () => {
    describe('connectionRequestSchema', () => {
      it('should accept valid connection request', () => {
        const validData = {
          recipientId: '123e4567-e89b-12d3-a456-426614174008',
          message: 'Would love to connect and discuss AI trends'
        }

        const result = connectionRequestSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept connection request without message', () => {
        const validData = {
          recipientId: '123e4567-e89b-12d3-a456-426614174008'
        }

        const result = connectionRequestSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject invalid recipient ID', () => {
        const invalidData = {
          recipientId: 'invalid-uuid',
          message: 'Would love to connect and discuss AI trends'
        }

        const result = connectionRequestSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['recipientId'])
        }
      })

      it('should reject message exceeding max length', () => {
        const invalidData = {
          recipientId: '123e4567-e89b-12d3-a456-426614174008',
          message: 'A'.repeat(501) // Exceeds 500 character limit
        }

        const result = connectionRequestSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['message'])
        }
      })
    })
  })

  describe('Query Parameter Schema Validation', () => {
    describe('eventListQuerySchema', () => {
      it('should accept valid query parameters', () => {
        const validData = {
          page: 1,
          limit: 20,
          search: 'tech conference',
          status: 'published',
          organizerId: '123e4567-e89b-12d3-a456-426614174001'
        }

        const result = eventListQuerySchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should default page to 1', () => {
        const data = {
          limit: 20
        }

        const result = eventListQuerySchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.page).toBe(1)
        }
      })

      it('should default limit to 20', () => {
        const data = {
          page: 1
        }

        const result = eventListQuerySchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.limit).toBe(20)
        }
      })

      it('should reject page below 1', () => {
        const invalidData = {
          page: 0,
          limit: 20
        }

        const result = eventListQuerySchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['page'])
        }
      })

      it('should reject limit above 100', () => {
        const invalidData = {
          page: 1,
          limit: 101
        }

        const result = eventListQuerySchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['limit'])
        }
      })

      it('should reject invalid status', () => {
        const invalidData = {
          page: 1,
          limit: 20,
          status: 'invalid_status'
        }

        const result = eventListQuerySchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['status'])
        }
      })

      it('should reject invalid organizer ID', () => {
        const invalidData = {
          page: 1,
          limit: 20,
          organizerId: 'invalid-uuid'
        }

        const result = eventListQuerySchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['organizerId'])
        }
      })
    })
  })

  describe('Response Schema Validation', () => {
    describe('successResponseSchema', () => {
      it('should accept valid success response', () => {
        const validData = {
          success: true,
          data: { id: '123', name: 'Test' },
          message: 'Operation successful',
          timestamp: new Date().toISOString()
        }

        const result = successResponseSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject success: false', () => {
        const invalidData = {
          success: false,
          data: { id: '123', name: 'Test' },
          message: 'Operation successful',
          timestamp: new Date().toISOString()
        }

        const result = successResponseSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject invalid timestamp format', () => {
        const invalidData = {
          success: true,
          data: { id: '123', name: 'Test' },
          message: 'Operation successful',
          timestamp: 'invalid-timestamp'
        }

        const result = successResponseSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['timestamp'])
        }
      })
    })

    describe('errorResponseSchema', () => {
      it('should accept valid error response', () => {
        const validData = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: { field: 'title', reason: 'Title is required' }
          },
          timestamp: new Date().toISOString()
        }

        const result = errorResponseSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject success: true', () => {
        const invalidData = {
          success: true,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data'
          },
          timestamp: new Date().toISOString()
        }

        const result = errorResponseSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject missing error code', () => {
        const invalidData = {
          success: false,
          error: {
            message: 'Invalid input data'
          },
          timestamp: new Date().toISOString()
        }

        const result = errorResponseSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['error', 'code'])
        }
      })

      it('should reject missing error message', () => {
        const invalidData = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR'
          },
          timestamp: new Date().toISOString()
        }

        const result = errorResponseSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['error', 'message'])
        }
      })
    })
  })

  describe('Entity Schema Validation', () => {
    describe('eventSchema', () => {
      it('should accept valid event entity', () => {
        const validData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100,
          attendeeCount: 0,
          status: 'draft',
          organizerId: '123e4567-e89b-12d3-a456-426614174001',
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const result = eventSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject invalid status', () => {
        const invalidData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100,
          attendeeCount: 0,
          status: 'invalid_status',
          organizerId: '123e4567-e89b-12d3-a456-426614174001',
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const result = eventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['status'])
        }
      })

      it('should reject negative attendee count', () => {
        const invalidData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          capacity: 100,
          attendeeCount: -1, // Negative count
          status: 'draft',
          organizerId: '123e4567-e89b-12d3-a456-426614174001',
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const result = eventSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['attendeeCount'])
        }
      })
    })

    describe('paginationSchema', () => {
      it('should accept valid pagination data', () => {
        const validData = {
          page: 1,
          limit: 20,
          total: 150,
          totalPages: 8,
          hasNext: true,
          hasPrev: false
        }

        const result = paginationSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject negative total', () => {
        const invalidData = {
          page: 1,
          limit: 20,
          total: -1, // Negative total
          totalPages: 8,
          hasNext: true,
          hasPrev: false
        }

        const result = paginationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['total'])
        }
      })

      it('should reject negative total pages', () => {
        const invalidData = {
          page: 1,
          limit: 20,
          total: 150,
          totalPages: -1, // Negative total pages
          hasNext: true,
          hasPrev: false
        }

        const result = paginationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['totalPages'])
        }
      })
    })
  })
})
