/**
 * Professional test module for WhiteboardModel
 * 
 * Tests cover:
 * - Unit functionality
 * - Integration points  
 * - Error scenarios
 * - Edge cases
 */

import { WhiteboardModelValidator } from '@/lib/whiteboard/models/WhiteboardModel'

describe('WhiteboardModel', () => {
  describe('validateSettings', () => {
    it('should validate valid whiteboard settings', () => {
      const validSettings = {
        width: 1920,
        height: 1080,
        backgroundColor: '#FFFFFF'
      }
      
      const result = WhiteboardModelValidator.validateSettings(validSettings)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid width', () => {
      const invalidSettings = {
        width: 50, // Too small
        height: 1080,
        backgroundColor: '#FFFFFF'
      }
      
      const result = WhiteboardModelValidator.validateSettings(invalidSettings)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('settings')
    })

    it('should reject invalid background color', () => {
      const invalidSettings = {
        width: 1920,
        height: 1080,
        backgroundColor: 'invalid-color'
      }
      
      const result = WhiteboardModelValidator.validateSettings(invalidSettings)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('settings')
    })
  })

  describe('validateCreateParams', () => {
    it('should validate valid create whiteboard parameters', () => {
      const validParams = {
        name: 'Test Whiteboard',
        settings: {
          width: 1920,
          height: 1080,
          backgroundColor: '#FFFFFF'
        }
      }
      
      const result = WhiteboardModelValidator.validateCreateParams(validParams)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid name', () => {
      const invalidParams = {
        name: '', // Empty name
        settings: {
          width: 1920,
          height: 1080,
          backgroundColor: '#FFFFFF'
        }
      }
      
      const result = WhiteboardModelValidator.validateCreateParams(invalidParams)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('params')
    })
  })

  describe('validateUpdateParams', () => {
    it('should validate valid update whiteboard parameters', () => {
      const validParams = {
        name: 'Updated Whiteboard',
        settings: {
          width: 2560,
          height: 1440
        }
      }
      
      const result = WhiteboardModelValidator.validateUpdateParams(validParams)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateWhiteboard', () => {
    it('should validate valid whiteboard data', () => {
      const validWhiteboard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Whiteboard',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        settings: {
          width: 1920,
          height: 1080,
          backgroundColor: '#FFFFFF'
        },
        drawings: [],
        stickyNotes: [],
        activeUsers: []
      }
      
      const result = WhiteboardModelValidator.validateWhiteboard(validWhiteboard)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('sanitizeWhiteboard', () => {
    it('should sanitize whiteboard data', () => {
      const partialWhiteboard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Whiteboard'
      }
      
      const sanitized = WhiteboardModelValidator.sanitizeWhiteboard(partialWhiteboard)
      
      expect(sanitized.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(sanitized.name).toBe('Test Whiteboard')
      expect(sanitized.settings.width).toBe(1920)
      expect(sanitized.settings.height).toBe(1080)
      expect(sanitized.settings.backgroundColor).toBe('#FFFFFF')
      expect(sanitized.drawings).toHaveLength(0)
      expect(sanitized.stickyNotes).toHaveLength(0)
      expect(sanitized.activeUsers).toHaveLength(0)
    })
  })

  describe('validateBounds', () => {
    it('should validate valid bounds', () => {
      const settings = {
        width: 1920,
        height: 1080,
        backgroundColor: '#FFFFFF'
      }
      const x = 100
      const y = 200
      
      const result = WhiteboardModelValidator.validateBounds(settings, x, y)
      
      expect(result).toBe(true)
    })

    it('should reject invalid bounds', () => {
      const settings = {
        width: 1920,
        height: 1080,
        backgroundColor: '#FFFFFF'
      }
      const x = 2000 // x out of bounds
      const y = 200
      
      const result = WhiteboardModelValidator.validateBounds(settings, x, y)
      
      expect(result).toBe(false)
    })
  })

  describe('normalizeCoordinates', () => {
    it('should normalize coordinates to bounds', () => {
      const settings = {
        width: 1920,
        height: 1080,
        backgroundColor: '#FFFFFF'
      }
      const x = 2000 // Out of bounds
      const y = -100 // Out of bounds
      
      const normalized = WhiteboardModelValidator.normalizeCoordinates(settings, x, y)
      
      expect(normalized.x).toBe(1920) // Clamped to max width
      expect(normalized.y).toBe(0) // Clamped to min height
    })
  })
})