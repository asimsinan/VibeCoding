/**
 * Professional test module for StickyNoteModel
 * 
 * Tests cover:
 * - Unit functionality
 * - Integration points  
 * - Error scenarios
 * - Edge cases
 */

import { StickyNoteModelValidator } from '@/lib/whiteboard/models/StickyNoteModel'

describe('StickyNoteModel', () => {
  describe('validateContent', () => {
    it('should validate valid sticky note content', () => {
      const validContent = 'This is a valid sticky note content'
      
      const result = StickyNoteModelValidator.validateContent(validContent)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty sticky note content', () => {
      const invalidContent = ''
      
      const result = StickyNoteModelValidator.validateContent(invalidContent)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('content')
    })

    it('should reject too long sticky note content', () => {
      const invalidContent = 'x'.repeat(501) // Too long
      
      const result = StickyNoteModelValidator.validateContent(invalidContent)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('content')
    })
  })

  describe('validatePosition', () => {
    it('should validate valid sticky note position', () => {
      const validPosition = { x: 100, y: 200 }
      
      const result = StickyNoteModelValidator.validatePosition(validPosition)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid sticky note position', () => {
      const invalidPosition = { x: 'invalid', y: 200 }
      
      const result = StickyNoteModelValidator.validatePosition(invalidPosition)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('position')
    })
  })

  describe('validateColor', () => {
    it('should validate valid sticky note color', () => {
      const validColor = '#FFE066'
      
      const result = StickyNoteModelValidator.validateColor(validColor)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid sticky note color', () => {
      const invalidColor = 'yellow'
      
      const result = StickyNoteModelValidator.validateColor(invalidColor)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('color')
    })
  })

  describe('validateCreateParams', () => {
    it('should validate valid create sticky note parameters', () => {
      const validParams = {
        content: 'Test sticky note',
        position: { x: 100, y: 200 },
        color: '#FFE066',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }
      
      const result = StickyNoteModelValidator.validateCreateParams(validParams)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid create sticky note parameters', () => {
      const invalidParams = {
        content: '', // Empty content
        position: { x: 'invalid', y: 200 },
        color: 'yellow',
        userId: 'invalid-uuid'
      }
      
      const result = StickyNoteModelValidator.validateCreateParams(invalidParams)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('sanitizeStickyNote', () => {
    it('should sanitize sticky note data', () => {
      const partialStickyNote = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Test content' // Add minimum required content
      }
      
      const sanitized = StickyNoteModelValidator.sanitizeStickyNote(partialStickyNote)
      
      expect(sanitized.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(sanitized.content).toBe('Test content')
      expect(sanitized.position.x).toBe(0)
      expect(sanitized.position.y).toBe(0)
      expect(sanitized.color).toBe('#FFE066')
      expect(sanitized.userId).toBe('123e4567-e89b-12d3-a456-426614174000')
    })
  })

  describe('validateBounds', () => {
    it('should validate valid sticky note bounds', () => {
      const position = { x: 100, y: 200 }
      const maxWidth = 1920
      const maxHeight = 1080
      
      const result = StickyNoteModelValidator.validateBounds(position, maxWidth, maxHeight)
      
      expect(result).toBe(true)
    })

    it('should reject invalid sticky note bounds', () => {
      const position = { x: 2000, y: 200 } // x out of bounds
      const maxWidth = 1920
      const maxHeight = 1080
      
      const result = StickyNoteModelValidator.validateBounds(position, maxWidth, maxHeight)
      
      expect(result).toBe(false)
    })
  })

  describe('normalizePosition', () => {
    it('should normalize position to bounds', () => {
      const position = { x: 2000, y: -100 } // Out of bounds
      const maxWidth = 1920
      const maxHeight = 1080
      
      const normalized = StickyNoteModelValidator.normalizePosition(position, maxWidth, maxHeight)
      
      expect(normalized.x).toBe(1920) // Clamped to max width
      expect(normalized.y).toBe(0) // Clamped to min height
    })
  })

  describe('checkCollision', () => {
    it('should detect no collision', () => {
      const position = { x: 100, y: 200 }
      const existingNotes = [
        {
          id: '1',
          position: { x: 400, y: 500 },
          content: 'Note 1',
          color: '#FFE066',
          userId: 'user1',
          createdAt: new Date('2023-01-01T00:00:00Z')
        }
      ]
      
      const result = StickyNoteModelValidator.checkCollision(position, existingNotes)
      
      expect(result).toBe(false)
    })

    it('should detect collision', () => {
      const position = { x: 100, y: 200 }
      const existingNotes = [
        {
          id: '1',
          position: { x: 150, y: 250 }, // Close to position
          content: 'Note 1',
          color: '#FFE066',
          userId: 'user1',
          createdAt: new Date('2023-01-01T00:00:00Z')
        }
      ]
      
      const result = StickyNoteModelValidator.checkCollision(position, existingNotes)
      
      expect(result).toBe(true)
    })
  })

  describe('findOptimalPosition', () => {
    it('should find optimal position for new sticky note', () => {
      const existingNotes = [
        {
          id: '1',
          position: { x: 100, y: 100 },
          content: 'Note 1',
          color: '#FFE066',
          userId: 'user1',
          createdAt: new Date('2023-01-01T00:00:00Z')
        }
      ]
      const maxWidth = 1920
      const maxHeight = 1080
      
      const optimalPosition = StickyNoteModelValidator.findOptimalPosition(existingNotes, maxWidth, maxHeight)
      
      expect(optimalPosition).toBeDefined()
      expect(optimalPosition.x).toBeGreaterThanOrEqual(0)
      expect(optimalPosition.x).toBeLessThanOrEqual(maxWidth)
      expect(optimalPosition.y).toBeGreaterThanOrEqual(0)
      expect(optimalPosition.y).toBeLessThanOrEqual(maxHeight)
    })
  })

  describe('searchStickyNotes', () => {
    it('should search sticky notes by content', () => {
      const stickyNotes = [
        {
          id: '1',
          content: 'Important meeting notes',
          position: { x: 100, y: 100 },
          color: '#FFE066',
          userId: 'user1',
          createdAt: new Date('2023-01-01T00:00:00Z')
        },
        {
          id: '2',
          content: 'Random thoughts',
          position: { x: 200, y: 200 },
          color: '#FFE066',
          userId: 'user2',
          createdAt: new Date('2023-01-01T00:00:00Z')
        }
      ]
      const query = 'meeting'
      
      const results = StickyNoteModelValidator.searchStickyNotes(stickyNotes, query)
      
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('1')
      expect(results[0].content.toLowerCase()).toContain('meeting')
    })
  })
})