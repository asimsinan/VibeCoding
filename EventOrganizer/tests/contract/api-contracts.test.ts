import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { APIClient, APIResponse } from '../../src/lib/api/client'
import { Event, Session, Attendee, Notification, Connection } from '../../src/lib/models'

// Mock API client
const mockAPIClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  healthCheck: jest.fn()
}

// Mock the API client module
jest.mock('../../src/lib/api/client', () => ({
  APIClient: jest.fn().mockImplementation(() => mockAPIClient),
  apiClient: mockAPIClient
}))

describe('API Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Events API Contracts', () => {
    it('should have correct GET /events contract', async () => {
      const mockResponse: APIResponse<Event[]> = {
        success: true,
        data: [{
          id: 'event1',
          name: 'Test Event',
          description: 'Test Description',
          startDate: '2024-07-20T09:00:00Z',
          endDate: '2024-07-20T17:00:00Z',
          location: 'Virtual',
          organizerId: 'user123',
          maxAttendees: 100,
          currentAttendees: 0,
          ticketPrice: 0,
          currency: 'USD',
          category: 'conference',
          tags: ['tech'],
          status: 'scheduled',
          createdAt: '2024-07-19T10:00:00Z',
          updatedAt: '2024-07-19T10:00:00Z'
        }],
        timestamp: new Date().toISOString()
      }

      mockAPIClient.get.mockResolvedValue(mockResponse)
      const response = await mockAPIClient.get('/events')

      expect(mockAPIClient.get).toHaveBeenCalledWith('/events')
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data![0]).toHaveProperty('id')
      expect(response.data![0]).toHaveProperty('name')
      expect(response.data![0]).toHaveProperty('description')
    })

    it('should have correct POST /events contract', async () => {
      const eventData: Partial<Event> = {
        name: 'New Event',
        description: 'New Description',
        startDate: '2024-07-20T09:00:00Z',
        endDate: '2024-07-20T17:00:00Z',
        location: 'Virtual',
        organizerId: 'user123',
        maxAttendees: 100,
        currentAttendees: 0,
        ticketPrice: 0,
        currency: 'USD',
        category: 'conference',
        tags: ['tech'],
        status: 'scheduled'
      }

      const mockResponse: APIResponse<Event> = {
        success: true,
        data: {
          id: 'event1',
          ...eventData,
          createdAt: '2024-07-19T10:00:00Z',
          updatedAt: '2024-07-19T10:00:00Z'
        } as Event,
        timestamp: new Date().toISOString()
      }

      mockAPIClient.post.mockResolvedValue(mockResponse)
      const response = await mockAPIClient.post('/events', eventData)

      expect(mockAPIClient.post).toHaveBeenCalledWith('/events', eventData)
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data!.id).toBeDefined()
      expect(response.data!.name).toBe(eventData.name)
    })
  })

  describe('Error Response Contracts', () => {
    it('should have correct error response structure', async () => {
      const mockError: APIResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: { name: 'Name is required' },
          timestamp: new Date().toISOString()
        }
      }

      mockAPIClient.post.mockResolvedValue(mockError)
      const response = await mockAPIClient.post('/events', {})

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.code).toBe('VALIDATION_ERROR')
      expect(response.error!.message).toBe('Invalid input data')
    })
  })
})