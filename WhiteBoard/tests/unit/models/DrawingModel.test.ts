/**
 * Professional test module for DrawingModel
 * 
 * Tests cover:
 * - Unit functionality
 * - Integration points  
 * - Error scenarios
 * - Edge cases
 */

import { DrawingModelValidator } from '@/lib/whiteboard/models/DrawingModel'

describe('DrawingModel', () => {
  describe('validateTool', () => {
    it('should validate valid drawing tool', () => {
      const validTool = 'pen'
      
      const result = DrawingModelValidator.validateTool(validTool)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid drawing tool', () => {
      const invalidTool = 'invalid-tool'
      
      const result = DrawingModelValidator.validateTool(invalidTool)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('tool')
    })
  })

  describe('validateColor', () => {
    it('should validate valid drawing color', () => {
      const validColor = '#FF0000'
      
      const result = DrawingModelValidator.validateColor(validColor)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid drawing color', () => {
      const invalidColor = 'red'
      
      const result = DrawingModelValidator.validateColor(invalidColor)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('color')
    })
  })

  describe('validateSize', () => {
    it('should validate valid drawing size', () => {
      const validSize = 5
      
      const result = DrawingModelValidator.validateSize(validSize)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid drawing size', () => {
      const invalidSize = 100 // Too large
      
      const result = DrawingModelValidator.validateSize(invalidSize)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('size')
    })
  })

  describe('validatePoints', () => {
    it('should validate valid drawing points', () => {
      const validPoints = [
        { x: 100, y: 200 },
        { x: 150, y: 250 },
        { x: 200, y: 300 }
      ]
      
      const result = DrawingModelValidator.validatePoints(validPoints)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid drawing points', () => {
      const invalidPoints = [] // Empty array
      
      const result = DrawingModelValidator.validatePoints(invalidPoints)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('points')
    })
  })

  describe('validateCreateParams', () => {
    it('should validate valid create drawing parameters', () => {
      const validParams = {
        tool: 'pen',
        color: '#FF0000',
        size: 5,
        points: [
          { x: 100, y: 200 },
          { x: 150, y: 250 }
        ],
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }
      
      const result = DrawingModelValidator.validateCreateParams(validParams)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid create drawing parameters', () => {
      const invalidParams = {
        tool: 'invalid-tool',
        color: 'red',
        size: 100,
        points: [],
        userId: 'invalid-uuid'
      }
      
      const result = DrawingModelValidator.validateCreateParams(invalidParams)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('sanitizeDrawing', () => {
    it('should sanitize drawing data', () => {
      const partialDrawing = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        points: [{ x: 100, y: 200 }] // Add minimum required points
      }
      
      const sanitized = DrawingModelValidator.sanitizeDrawing(partialDrawing)
      
      expect(sanitized.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(sanitized.tool).toBe('pen')
      expect(sanitized.color).toBe('#000000')
      expect(sanitized.size).toBe(2)
      expect(sanitized.points).toHaveLength(1)
      expect(sanitized.userId).toBe('123e4567-e89b-12d3-a456-426614174000')
    })
  })

  describe('validateBounds', () => {
    it('should validate valid drawing bounds', () => {
      const points = [
        { x: 100, y: 200 },
        { x: 150, y: 250 }
      ]
      const maxWidth = 1920
      const maxHeight = 1080
      
      const result = DrawingModelValidator.validateBounds(points, maxWidth, maxHeight)
      
      expect(result).toBe(true)
    })

    it('should reject invalid drawing bounds', () => {
      const points = [
        { x: 2000, y: 200 }, // x out of bounds
        { x: 150, y: 250 }
      ]
      const maxWidth = 1920
      const maxHeight = 1080
      
      const result = DrawingModelValidator.validateBounds(points, maxWidth, maxHeight)
      
      expect(result).toBe(false)
    })
  })

  describe('normalizeCoordinates', () => {
    it('should normalize coordinates to bounds', () => {
      const points = [
        { x: 2000, y: -100 }, // Out of bounds
        { x: 150, y: 250 }
      ]
      const maxWidth = 1920
      const maxHeight = 1080
      
      const normalized = DrawingModelValidator.normalizeCoordinates(points, maxWidth, maxHeight)
      
      expect(normalized[0].x).toBe(1920) // Clamped to max width
      expect(normalized[0].y).toBe(0) // Clamped to min height
      expect(normalized[1].x).toBe(150) // Unchanged
      expect(normalized[1].y).toBe(250) // Unchanged
    })
  })

  describe('optimizePoints', () => {
    it('should optimize drawing points', () => {
      const points = [
        { x: 100, y: 200 },
        { x: 101, y: 201 }, // Very close to previous point
        { x: 102, y: 202 }, // Very close to previous point
        { x: 200, y: 300 } // Far from previous point
      ]
      
      const optimized = DrawingModelValidator.optimizePoints(points, 2)
      
      expect(optimized.length).toBeLessThanOrEqual(points.length)
      expect(optimized[0].x).toBe(100)
      expect(optimized[0].y).toBe(200)
      expect(optimized[optimized.length - 1].x).toBe(200)
      expect(optimized[optimized.length - 1].y).toBe(300)
    })
  })

  describe('calculateBounds', () => {
    it('should calculate drawing bounds', () => {
      const points = [
        { x: 100, y: 200 },
        { x: 150, y: 250 },
        { x: 200, y: 300 }
      ]
      
      const bounds = DrawingModelValidator.calculateBounds(points)
      
      expect(bounds.minX).toBe(100)
      expect(bounds.minY).toBe(200)
      expect(bounds.maxX).toBe(200)
      expect(bounds.maxY).toBe(300)
    })
  })
})