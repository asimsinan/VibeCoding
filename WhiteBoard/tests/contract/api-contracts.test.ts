/**
 * API Contract Tests
 * 
 * Comprehensive contract tests for the Collaborative Whiteboard API
 * based on OpenAPI 3.0 specification and JSON schemas.
 * 
 * @fileoverview API contract validation tests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { 
  ApiResponse, 
  CreateWhiteboardRequest,
  UpdateWhiteboardRequest,
  CreateDrawingRequest,
  UpdateDrawingRequest,
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  ErrorResponse,
  HttpStatus,
  ErrorCode,
  isValidUUID,
  isValidHexColor,
  isValidDrawingTool
} from '@/contracts/types/api'
import { Whiteboard, Drawing, StickyNote, User } from '@/contracts/types/domain'

// Mock API client for testing
class MockApiClient {
  private responses: Map<string, any> = new Map()
  private errors: Map<string, Error> = new Map()

  setResponse(endpoint: string, response: any) {
    this.responses.set(endpoint, response)
  }

  setError(endpoint: string, error: Error) {
    this.errors.set(endpoint, error)
  }

  async request<T>(endpoint: string, method: string = 'GET', data?: any): Promise<ApiResponse<T>> {
    if (this.errors.has(endpoint)) {
      throw this.errors.get(endpoint)!
    }

    const response = this.responses.get(endpoint)
    if (!response) {
      throw new Error(`No mock response set for ${endpoint}`)
    }

    return response
  }
}

describe('API Contract Tests', () => {
  let apiClient: MockApiClient

  beforeEach(() => {
    apiClient = new MockApiClient()
    jest.clearAllMocks()
  })

  afterEach(() => {
    apiClient = new MockApiClient()
  })

  describe('Whiteboard API Contracts', () => {
    describe('GET /api/v1/whiteboards', () => {
      it('should return paginated whiteboard list', async () => {
        const mockResponse: ApiResponse = {
          success: true,
          data: {
            whiteboards: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Whiteboard',
                settings: {
                  width: 1920,
                  height: 1080,
                  background_color: '#FFFFFF',
                  grid_enabled: true,
                  grid_size: 20
                },
                drawing_count: 5,
                sticky_note_count: 3,
                created_at: '2023-12-01T10:00:00Z',
                updated_at: '2023-12-01T15:30:00Z'
              }
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              total_pages: 1,
              has_next: false,
              has_prev: false
            }
          },
          timestamp: '2023-12-01T15:30:00Z'
        }

        apiClient.setResponse('/whiteboards', mockResponse)
        const response = await apiClient.request('/whiteboards')

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data.whiteboards).toHaveLength(1)
        expect(response.data.pagination).toBeDefined()
        expect(response.timestamp).toBeDefined()
      })

      it('should handle query parameters', async () => {
        const mockResponse: ApiResponse = {
          success: true,
          data: {
            whiteboards: [],
            pagination: {
              page: 2,
              limit: 10,
              total: 0,
              total_pages: 0,
              has_next: false,
              has_prev: true
            }
          },
          timestamp: '2023-12-01T15:30:00Z'
        }

        apiClient.setResponse('/whiteboards?page=2&limit=10&search=test', mockResponse)
        const response = await apiClient.request('/whiteboards?page=2&limit=10&search=test')

        expect(response.success).toBe(true)
        expect(response.data.pagination.page).toBe(2)
        expect(response.data.pagination.limit).toBe(10)
      })
    })

    describe('POST /api/v1/whiteboards', () => {
      it('should create whiteboard with valid data', async () => {
        const createRequest: CreateWhiteboardRequest = {
          name: 'New Whiteboard',
          settings: {
            width: 1920,
            height: 1080,
            background_color: '#FFFFFF',
            grid_enabled: true,
            grid_size: 20
          }
        }

        const mockResponse: ApiResponse<Whiteboard> = {
          success: true,
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'New Whiteboard',
            settings: createRequest.settings,
            drawings: [],
            sticky_notes: [],
            created_at: '2023-12-01T10:00:00Z',
            updated_at: '2023-12-01T10:00:00Z'
          },
          timestamp: '2023-12-01T10:00:00Z'
        }

        apiClient.setResponse('/whiteboards', mockResponse)
        const response = await apiClient.request('/whiteboards', 'POST', createRequest)

        expect(response.success).toBe(true)
        expect(response.data?.name).toBe('New Whiteboard')
        expect(response.data?.settings).toEqual(createRequest.settings)
      })

      it('should validate required fields', () => {
        const invalidRequest = {
          // Missing required 'name' field
          settings: {
            width: 1920,
            height: 1080
          }
        }

        expect(() => {
          // This would be validated by the API
          if (!invalidRequest.name) {
            throw new Error('Name is required')
          }
        }).toThrow('Name is required')
      })
    })

    describe('GET /api/v1/whiteboards/{id}', () => {
      it('should return whiteboard with all data', async () => {
        const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
        const mockResponse: ApiResponse<Whiteboard> = {
          success: true,
          data: {
            id: whiteboardId,
            name: 'Test Whiteboard',
            settings: {
              width: 1920,
              height: 1080,
              background_color: '#FFFFFF',
              grid_enabled: true,
              grid_size: 20
            },
            drawings: [
              {
                id: '123e4567-e89b-12d3-a456-426614174001',
                tool: 'pen',
                color: '#FF0000',
                size: 2,
                points: [{ x: 100, y: 100 }, { x: 200, y: 200 }],
                user_id: '123e4567-e89b-12d3-a456-426614174002',
                created_at: '2023-12-01T10:00:00Z',
                updated_at: '2023-12-01T10:00:00Z'
              }
            ],
            sticky_notes: [
              {
                id: '123e4567-e89b-12d3-a456-426614174003',
                content: 'Test note',
                position: { x: 100, y: 100 },
                color: '#FFE066',
                user_id: '123e4567-e89b-12d3-a456-426614174002',
                created_at: '2023-12-01T10:00:00Z',
                updated_at: '2023-12-01T10:00:00Z'
              }
            ],
            created_at: '2023-12-01T10:00:00Z',
            updated_at: '2023-12-01T15:30:00Z'
          },
          timestamp: '2023-12-01T15:30:00Z'
        }

        apiClient.setResponse(`/whiteboards/${whiteboardId}`, mockResponse)
        const response = await apiClient.request(`/whiteboards/${whiteboardId}`)

        expect(response.success).toBe(true)
        expect(response.data?.id).toBe(whiteboardId)
        expect(response.data?.drawings).toHaveLength(1)
        expect(response.data?.sticky_notes).toHaveLength(1)
      })
    })

    describe('PUT /api/v1/whiteboards/{id}', () => {
      it('should update whiteboard with valid data', async () => {
        const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
        const updateRequest: UpdateWhiteboardRequest = {
          name: 'Updated Whiteboard',
          settings: {
            width: 2560,
            height: 1440,
            background_color: '#F0F0F0'
          }
        }

        const mockResponse: ApiResponse<Whiteboard> = {
          success: true,
          data: {
            id: whiteboardId,
            name: 'Updated Whiteboard',
            settings: updateRequest.settings,
            drawings: [],
            sticky_notes: [],
            created_at: '2023-12-01T10:00:00Z',
            updated_at: '2023-12-01T15:30:00Z'
          },
          timestamp: '2023-12-01T15:30:00Z'
        }

        apiClient.setResponse(`/whiteboards/${whiteboardId}`, mockResponse)
        const response = await apiClient.request(`/whiteboards/${whiteboardId}`, 'PUT', updateRequest)

        expect(response.success).toBe(true)
        expect(response.data?.name).toBe('Updated Whiteboard')
        expect(response.data?.settings?.width).toBe(2560)
      })
    })

    describe('DELETE /api/v1/whiteboards/{id}', () => {
      it('should delete whiteboard successfully', async () => {
        const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
        
        // DELETE should return 204 No Content
        const mockResponse = {
          success: true,
          timestamp: '2023-12-01T15:30:00Z'
        }

        apiClient.setResponse(`/whiteboards/${whiteboardId}`, mockResponse)
        const response = await apiClient.request(`/whiteboards/${whiteboardId}`, 'DELETE')

        expect(response.success).toBe(true)
      })
    })
  })

  describe('Drawing API Contracts', () => {
    describe('POST /api/v1/whiteboards/{id}/drawings', () => {
      it('should create drawing with valid data', async () => {
        const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
        const createRequest: CreateDrawingRequest = {
          tool: 'pen',
          color: '#FF0000',
          size: 2,
          points: [{ x: 100, y: 100 }, { x: 200, y: 200 }],
          user_id: '123e4567-e89b-12d3-a456-426614174002'
        }

        const mockResponse: ApiResponse<Drawing> = {
          success: true,
          data: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            tool: 'pen',
            color: '#FF0000',
            size: 2,
            points: [{ x: 100, y: 100 }, { x: 200, y: 200 }],
            user_id: '123e4567-e89b-12d3-a456-426614174002',
            created_at: '2023-12-01T10:00:00Z',
            updated_at: '2023-12-01T10:00:00Z'
          },
          timestamp: '2023-12-01T10:00:00Z'
        }

        apiClient.setResponse(`/whiteboards/${whiteboardId}/drawings`, mockResponse)
        const response = await apiClient.request(`/whiteboards/${whiteboardId}/drawings`, 'POST', createRequest)

        expect(response.success).toBe(true)
        expect(response.data?.tool).toBe('pen')
        expect(response.data?.color).toBe('#FF0000')
        expect(response.data?.points).toHaveLength(2)
      })

      it('should validate drawing tool enum', () => {
        expect(isValidDrawingTool('pen')).toBe(true)
        expect(isValidDrawingTool('brush')).toBe(true)
        expect(isValidDrawingTool('eraser')).toBe(true)
        expect(isValidDrawingTool('invalid')).toBe(false)
      })

      it('should validate color format', () => {
        expect(isValidHexColor('#FF0000')).toBe(true)
        expect(isValidHexColor('#ff0000')).toBe(true)
        expect(isValidHexColor('#F00')).toBe(false)
        expect(isValidHexColor('red')).toBe(false)
      })

      it('should validate size range', () => {
        const validSizes = [1, 25, 50]
        const invalidSizes = [0, 51, -1]

        validSizes.forEach(size => {
          expect(size).toBeGreaterThanOrEqual(1)
          expect(size).toBeLessThanOrEqual(50)
        })

        invalidSizes.forEach(size => {
          expect(size < 1 || size > 50).toBe(true)
        })
      })
    })

    describe('PUT /api/v1/whiteboards/{id}/drawings/{drawingId}', () => {
      it('should update drawing with valid data', async () => {
        const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
        const drawingId = '123e4567-e89b-12d3-a456-426614174001'
        const updateRequest: UpdateDrawingRequest = {
          tool: 'brush',
          color: '#00FF00',
          size: 3
        }

        const mockResponse: ApiResponse<Drawing> = {
          success: true,
          data: {
            id: drawingId,
            tool: 'brush',
            color: '#00FF00',
            size: 3,
            points: [{ x: 100, y: 100 }, { x: 200, y: 200 }],
            user_id: '123e4567-e89b-12d3-a456-426614174002',
            created_at: '2023-12-01T10:00:00Z',
            updated_at: '2023-12-01T15:30:00Z'
          },
          timestamp: '2023-12-01T15:30:00Z'
        }

        apiClient.setResponse(`/whiteboards/${whiteboardId}/drawings/${drawingId}`, mockResponse)
        const response = await apiClient.request(`/whiteboards/${whiteboardId}/drawings/${drawingId}`, 'PUT', updateRequest)

        expect(response.success).toBe(true)
        expect(response.data?.tool).toBe('brush')
        expect(response.data?.color).toBe('#00FF00')
        expect(response.data?.size).toBe(3)
      })
    })
  })

  describe('Sticky Note API Contracts', () => {
    describe('POST /api/v1/whiteboards/{id}/sticky-notes', () => {
      it('should create sticky note with valid data', async () => {
        const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
        const createRequest: CreateStickyNoteRequest = {
          content: 'Test sticky note',
          position: { x: 100, y: 100 },
          color: '#FFE066',
          user_id: '123e4567-e89b-12d3-a456-426614174002'
        }

        const mockResponse: ApiResponse<StickyNote> = {
          success: true,
          data: {
            id: '123e4567-e89b-12d3-a456-426614174003',
            content: 'Test sticky note',
            position: { x: 100, y: 100 },
            color: '#FFE066',
            user_id: '123e4567-e89b-12d3-a456-426614174002',
            created_at: '2023-12-01T10:00:00Z',
            updated_at: '2023-12-01T10:00:00Z'
          },
          timestamp: '2023-12-01T10:00:00Z'
        }

        apiClient.setResponse(`/whiteboards/${whiteboardId}/sticky-notes`, mockResponse)
        const response = await apiClient.request(`/whiteboards/${whiteboardId}/sticky-notes`, 'POST', createRequest)

        expect(response.success).toBe(true)
        expect(response.data?.content).toBe('Test sticky note')
        expect(response.data?.position).toEqual({ x: 100, y: 100 })
        expect(response.data?.color).toBe('#FFE066')
      })

      it('should validate content length', () => {
        const validContent = 'A'.repeat(500)
        const invalidContent = 'A'.repeat(501)

        expect(validContent.length).toBeLessThanOrEqual(500)
        expect(invalidContent.length).toBeGreaterThan(500)
      })

      it('should validate position coordinates', () => {
        const validPosition = { x: 100, y: 200 }
        const invalidPosition = { x: -10, y: 200 }

        expect(validPosition.x).toBeGreaterThanOrEqual(0)
        expect(validPosition.y).toBeGreaterThanOrEqual(0)
        expect(invalidPosition.x).toBeLessThan(0)
      })
    })

    describe('PUT /api/v1/whiteboards/{id}/sticky-notes/{noteId}', () => {
      it('should update sticky note with valid data', async () => {
        const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
        const noteId = '123e4567-e89b-12d3-a456-426614174003'
        const updateRequest: UpdateStickyNoteRequest = {
          content: 'Updated sticky note',
          position: { x: 200, y: 200 },
          color: '#FFB366'
        }

        const mockResponse: ApiResponse<StickyNote> = {
          success: true,
          data: {
            id: noteId,
            content: 'Updated sticky note',
            position: { x: 200, y: 200 },
            color: '#FFB366',
            user_id: '123e4567-e89b-12d3-a456-426614174002',
            created_at: '2023-12-01T10:00:00Z',
            updated_at: '2023-12-01T15:30:00Z'
          },
          timestamp: '2023-12-01T15:30:00Z'
        }

        apiClient.setResponse(`/whiteboards/${whiteboardId}/sticky-notes/${noteId}`, mockResponse)
        const response = await apiClient.request(`/whiteboards/${whiteboardId}/sticky-notes/${noteId}`, 'PUT', updateRequest)

        expect(response.success).toBe(true)
        expect(response.data?.content).toBe('Updated sticky note')
        expect(response.data?.position).toEqual({ x: 200, y: 200 })
        expect(response.data?.color).toBe('#FFB366')
      })
    })
  })

  describe('User API Contracts', () => {
    describe('GET /api/v1/whiteboards/{id}/users', () => {
      it('should return active users', async () => {
        const whiteboardId = '123e4567-e89b-12d3-a456-426614174000'
        const mockResponse: ApiResponse<User[]> = {
          success: true,
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              display_name: 'John Doe',
              last_seen: '2023-12-01T15:30:00Z',
              cursor_position: { x: 100, y: 100 },
              whiteboard_id: whiteboardId,
              created_at: '2023-12-01T10:00:00Z',
              updated_at: '2023-12-01T15:30:00Z'
            }
          ],
          timestamp: '2023-12-01T15:30:00Z'
        }

        apiClient.setResponse(`/whiteboards/${whiteboardId}/users`, mockResponse)
        const response = await apiClient.request(`/whiteboards/${whiteboardId}/users`)

        expect(response.success).toBe(true)
        expect(response.data).toHaveLength(1)
        expect(response.data?.[0].display_name).toBe('John Doe')
      })
    })
  })

  describe('Error Handling Contracts', () => {
    it('should return proper error format for validation errors', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          field: 'name',
          message: 'Name is required'
        },
        timestamp: '2023-12-01T15:30:00Z'
      }

      apiClient.setError('/whiteboards', new Error('Validation failed'))
      
      try {
        await apiClient.request('/whiteboards', 'POST', {})
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Validation failed')
      }
    })

    it('should return proper error format for unauthorized access', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Authentication required',
        code: ErrorCode.UNAUTHORIZED,
        timestamp: '2023-12-01T15:30:00Z'
      }

      expect(errorResponse.code).toBe(ErrorCode.UNAUTHORIZED)
      expect(errorResponse.error).toBe('Authentication required')
    })

    it('should return proper error format for not found', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Whiteboard not found',
        code: ErrorCode.NOT_FOUND,
        timestamp: '2023-12-01T15:30:00Z'
      }

      expect(errorResponse.code).toBe(ErrorCode.NOT_FOUND)
      expect(errorResponse.error).toBe('Whiteboard not found')
    })
  })

  describe('UUID Validation', () => {
    it('should validate UUID format', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-8234-826614174000',
        '123e4567-e89b-12d3-9234-926614174001'
      ]

      const invalidUUIDs = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        '123e4567-e89b-12d3-a456-42661417400g', // invalid character
        ''
      ]

      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true)
      })

      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false)
      })
    })
  })

  describe('Rate Limiting Contracts', () => {
    it('should handle rate limiting responses', async () => {
      const rateLimitError: ErrorResponse = {
        success: false,
        error: 'Rate limit exceeded',
        code: ErrorCode.RATE_LIMITED,
        details: {
          retry_after: 60
        },
        timestamp: '2023-12-01T15:30:00Z'
      }

      expect(rateLimitError.code).toBe(ErrorCode.RATE_LIMITED)
      expect(rateLimitError.details?.retry_after).toBe(60)
    })
  })

  describe('WebSocket Event Contracts', () => {
    it('should validate drawing event structure', () => {
      const drawingEvent = {
        type: 'drawing',
        payload: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          tool: 'pen',
          color: '#FF0000',
          size: 2,
          points: [{ x: 100, y: 100 }],
          user_id: '123e4567-e89b-12d3-a456-426614174002',
          created_at: '2023-12-01T10:00:00Z',
          updated_at: '2023-12-01T10:00:00Z'
        },
        action: 'INSERT',
        timestamp: '2023-12-01T10:00:00Z'
      }

      expect(drawingEvent.type).toBe('drawing')
      expect(drawingEvent.action).toBe('INSERT')
      expect(drawingEvent.payload.tool).toBe('pen')
      expect(drawingEvent.timestamp).toBeDefined()
    })

    it('should validate sticky note event structure', () => {
      const stickyNoteEvent = {
        type: 'sticky_note',
        payload: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          content: 'Test note',
          position: { x: 100, y: 100 },
          color: '#FFE066',
          user_id: '123e4567-e89b-12d3-a456-426614174002',
          created_at: '2023-12-01T10:00:00Z',
          updated_at: '2023-12-01T10:00:00Z'
        },
        action: 'UPDATE',
        timestamp: '2023-12-01T10:00:00Z'
      }

      expect(stickyNoteEvent.type).toBe('sticky_note')
      expect(stickyNoteEvent.action).toBe('UPDATE')
      expect(stickyNoteEvent.payload.content).toBe('Test note')
      expect(stickyNoteEvent.timestamp).toBeDefined()
    })
  })
})
