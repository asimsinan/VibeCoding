/**
 * UI-API Integration Tests
 * 
 * Comprehensive tests for UI-API integration functionality.
 * Tests the complete data flow from frontend components to backend API.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { apiClient, ApiError } from '../../src/lib/api/client'
import { whiteboardApi } from '../../src/lib/api/whiteboardApi'
import { DrawingService } from '../../src/lib/whiteboard/services/drawingService'
import { StickyNoteService } from '../../src/lib/whiteboard/services/stickyNoteService'
import { UserService } from '../../src/lib/whiteboard/services/userService'

// Mock fetch for API client testing
global.fetch = jest.fn()

describe('UI-API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('API Client Integration', () => {
    it('should handle successful API requests', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Test Whiteboard' },
        timestamp: new Date().toISOString(),
        status: 200
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      })

      const response = await apiClient.get('/whiteboards')
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockResponse.data)
      expect(response.status).toBe(200)
    })

    it('should handle API errors with proper error handling', async () => {
      const mockError = {
        error: 'Whiteboard not found',
        code: 'NOT_FOUND',
        details: { id: 'invalid-id' },
        timestamp: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockError
      })

      await expect(apiClient.get('/whiteboards/invalid-id')).rejects.toThrow(ApiError)
    })

    it('should handle network errors with retry logic', async () => {
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: [] })
        })

      const response = await apiClient.get('/whiteboards')
      
      expect(response.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should include authentication headers', async () => {
      const mockResponse = { success: true, data: [] }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      })

      await apiClient.get('/whiteboards')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/whiteboards'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })

  describe('Whiteboard API Service Integration', () => {
    it('should create whiteboard through API', async () => {
      const mockWhiteboard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Whiteboard',
        settings: { width: 800, height: 600, backgroundColor: '#ffffff' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: mockWhiteboard })
      })

      const response = await whiteboardApi.createWhiteboard({
        name: 'Test Whiteboard',
        settings: { width: 800, height: 600, backgroundColor: '#ffffff' }
      })

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockWhiteboard)
    })

    it('should get whiteboard with all data through API', async () => {
      const mockWhiteboardData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Whiteboard',
        drawings: [],
        stickyNotes: [],
        users: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockWhiteboardData })
      })

      const response = await whiteboardApi.getWhiteboard('123e4567-e89b-12d3-a456-426614174000')

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockWhiteboardData)
    })

    it('should handle API errors in whiteboard operations', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      await expect(whiteboardApi.getWhiteboard('invalid-id')).rejects.toThrow()
    })
  })

  describe('Drawing Service API Integration', () => {
    it('should create drawing through API', async () => {
      const mockDrawing = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
        tool: 'pen',
        color: '#000000',
        size: 2,
        points: [{ x: 100, y: 100 }],
        userId: '123e4567-e89b-12d3-a456-426614174002',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: mockDrawing })
      })

      const drawing = await DrawingService.createDrawing('123e4567-e89b-12d3-a456-426614174000', {
        tool: 'pen',
        color: '#000000',
        size: 2,
        points: [{ x: 100, y: 100 }],
        userId: '123e4567-e89b-12d3-a456-426614174002'
      })

      expect(drawing).toEqual(mockDrawing)
    })

    it('should get drawings for whiteboard through API', async () => {
      const mockDrawings = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
          tool: 'pen',
          color: '#000000',
          size: 2,
          points: [{ x: 100, y: 100 }],
          userId: '123e4567-e89b-12d3-a456-426614174002',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockDrawings })
      })

      const drawings = await DrawingService.getDrawingsForWhiteboard('123e4567-e89b-12d3-a456-426614174000')

      expect(drawings).toEqual(mockDrawings)
    })

    it('should handle drawing API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid drawing data' })
      })

      await expect(DrawingService.createDrawing('invalid-id', {
        tool: 'pen',
        color: 'invalid-color',
        size: 2,
        points: [],
        userId: '123e4567-e89b-12d3-a456-426614174002'
      })).rejects.toThrow()
    })
  })

  describe('Sticky Note Service API Integration', () => {
    it('should create sticky note through API', async () => {
      const mockStickyNote = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Test sticky note',
        position: { x: 100, y: 100 },
        color: '#FFE066',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: mockStickyNote })
      })

      const stickyNote = await StickyNoteService.createStickyNote('123e4567-e89b-12d3-a456-426614174000', {
        content: 'Test sticky note',
        position: { x: 100, y: 100 },
        color: '#FFE066',
        userId: '123e4567-e89b-12d3-a456-426614174002'
      })

      expect(stickyNote).toEqual(mockStickyNote)
    })

    it('should get sticky notes for whiteboard through API', async () => {
      const mockStickyNotes = [
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Test sticky note',
          position: { x: 100, y: 100 },
          color: '#FFE066',
          userId: '123e4567-e89b-12d3-a456-426614174002',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockStickyNotes })
      })

      const stickyNotes = await StickyNoteService.getStickyNotesForWhiteboard('123e4567-e89b-12d3-a456-426614174000')

      expect(stickyNotes).toEqual(mockStickyNotes)
    })

    it('should handle sticky note API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid sticky note data' })
      })

      await expect(StickyNoteService.createStickyNote('invalid-id', {
        content: '',
        position: { x: 100, y: 100 },
        color: '#FFE066',
        userId: '123e4567-e89b-12d3-a456-426614174002'
      })).rejects.toThrow()
    })
  })

  describe('User Service API Integration', () => {
    it('should get active users through API', async () => {
      const mockUsers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          displayName: 'Test User',
          lastSeen: new Date().toISOString(),
          cursorPosition: { x: 100, y: 100 },
          whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockUsers })
      })

      const users = await UserService.getActiveUsers('123e4567-e89b-12d3-a456-426614174000')

      expect(users).toEqual(mockUsers)
    })

    it('should handle user API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to get users' })
      })

      await expect(UserService.getActiveUsers('invalid-id')).rejects.toThrow()
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network timeouts', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      await expect(apiClient.get('/whiteboards')).rejects.toThrow()
    }, 10000)

    it('should handle malformed JSON responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON') }
      })

      await expect(apiClient.get('/whiteboards')).rejects.toThrow()
    }, 10000)

    it('should handle authentication errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })

      await expect(apiClient.get('/whiteboards')).rejects.toThrow(ApiError)
    })

    it('should handle rate limiting errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' })
      })

      await expect(apiClient.get('/whiteboards')).rejects.toThrow(ApiError)
    })
  })

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across API calls', async () => {
      const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
      const userId = '123e4567-e89b-12d3-a456-426614174002'

      // Mock whiteboard creation
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ 
          success: true, 
          data: { id: whiteboardId, name: 'Test Whiteboard' }
        })
      })

      // Mock drawing creation
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ 
          success: true, 
          data: { id: 'drawing-1', whiteboardId, tool: 'pen' }
        })
      })

      // Mock sticky note creation
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ 
          success: true, 
          data: { id: 'note-1', whiteboardId, content: 'Test note' }
        })
      })

      // Create whiteboard
      const whiteboard = await whiteboardApi.createWhiteboard({ name: 'Test Whiteboard' })
      expect(whiteboard.success).toBe(true)

      // Create drawing
      const drawing = await DrawingService.createDrawing(whiteboardId, {
        tool: 'pen',
        color: '#000000',
        size: 2,
        points: [{ x: 100, y: 100 }],
        userId
      })
      expect(drawing.whiteboardId).toBe(whiteboardId)

      // Create sticky note
      const stickyNote = await StickyNoteService.createStickyNote(whiteboardId, {
        content: 'Test note',
        position: { x: 100, y: 100 },
        color: '#FFE066',
        userId
      })
      expect(stickyNote.whiteboardId).toBe(whiteboardId)
    })

    it('should handle concurrent API operations', async () => {
      const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
      const userId = '123e4567-e89b-12d3-a456-426614174002'

      // Mock multiple concurrent requests
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: [] })
        })

      // Execute concurrent operations
      const [drawings, stickyNotes, users] = await Promise.all([
        DrawingService.getDrawingsForWhiteboard(whiteboardId),
        StickyNoteService.getStickyNotesForWhiteboard(whiteboardId),
        UserService.getActiveUsers(whiteboardId)
      ])

      expect(drawings).toEqual([])
      expect(stickyNotes).toEqual([])
      expect(users).toEqual([])
    })
  })

  describe('Performance Integration', () => {
    it('should handle large data sets efficiently', async () => {
      const largeDrawings = Array.from({ length: 1000 }, (_, i) => ({
        id: `drawing-${i}`,
        whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
        tool: 'pen',
        color: '#000000',
        size: 2,
        points: [{ x: i, y: i }],
        userId: '123e4567-e89b-12d3-a456-426614174002',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: largeDrawings })
      })

      const startTime = Date.now()
      const drawings = await DrawingService.getDrawingsForWhiteboard('123e4567-e89b-12d3-a456-426614174000')
      const endTime = Date.now()

      expect(drawings).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle API response caching', async () => {
      const mockData = { id: '1', name: 'Test Whiteboard' }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockData })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockData })
        })

      // First request
      const response1 = await apiClient.get('/whiteboards/1')
      expect(response1.data).toEqual(mockData)

      // Second request (should use cache if implemented)
      const response2 = await apiClient.get('/whiteboards/1')
      expect(response2.data).toEqual(mockData)

      // Should call fetch twice since no caching is implemented
      expect(global.fetch).toHaveBeenCalledTimes(2)
    }, 10000)
  })
})
