/**
 * Professional test module for Whiteboard Integration
 * 
 * Tests cover:Add 
 * - Integration functionality
 * - Real-time synchronization
 * - Error scenarios
 * - Edge cases
 */

import { WhiteboardModelValidator } from '@/lib/whiteboard/models/WhiteboardModel'
import { DrawingModelValidator } from '@/lib/whiteboard/models/DrawingModel'
import { StickyNoteModelValidator } from '@/lib/whiteboard/models/StickyNoteModel'
import { UserModelValidator } from '@/lib/whiteboard/models/UserModel'

describe('Whiteboard Integration', () => {
  describe('Model Validation Integration', () => {
    it('should integrate whiteboard model validation', () => {
      const whiteboardData = {
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
      
      const drawingData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        tool: 'pen',
        color: '#FF0000',
        size: 5,
        points: [{ x: 100, y: 200 }, { x: 150, y: 250 }],
        userId: '123e4567-e89b-12d3-a456-426614174002',
        createdAt: new Date('2023-01-01T00:00:00Z')
      }
      
      const stickyNoteData = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        content: 'Test sticky note',
        position: { x: 100, y: 200 },
        color: '#FFE066',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        createdAt: new Date('2023-01-01T00:00:00Z')
      }
      
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        displayName: 'Test User',
        lastSeen: new Date('2023-01-01T00:00:00Z'),
        cursorPosition: { x: 100, y: 200 }
      }
      
      const whiteboardValidation = WhiteboardModelValidator.validateWhiteboard(whiteboardData)
      const drawingValidation = DrawingModelValidator.validateDrawing(drawingData)
      const stickyNoteValidation = StickyNoteModelValidator.validateStickyNote(stickyNoteData)
      const userValidation = UserModelValidator.validateUser(userData)
      
      expect(whiteboardValidation.isValid).toBe(true)
      expect(drawingValidation.isValid).toBe(true)
      expect(stickyNoteValidation.isValid).toBe(true)
      expect(userValidation.isValid).toBe(true)
    })

    it('should integrate model sanitization', () => {
      const partialWhiteboard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Whiteboard'
      }
      
      const partialDrawing = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        points: [{ x: 100, y: 100 }]
      }
      
      const partialStickyNote = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        content: 'Test sticky note'
      }
      
      const partialUser = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        displayName: 'Test User'
      }
      
      const sanitizedWhiteboard = WhiteboardModelValidator.sanitizeWhiteboard(partialWhiteboard)
      const sanitizedDrawing = DrawingModelValidator.sanitizeDrawing(partialDrawing)
      const sanitizedStickyNote = StickyNoteModelValidator.sanitizeStickyNote(partialStickyNote)
      const sanitizedUser = UserModelValidator.sanitizeUser(partialUser)
      
      expect(sanitizedWhiteboard.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(sanitizedWhiteboard.name).toBe('Test Whiteboard')
      expect(sanitizedWhiteboard.settings.width).toBe(1920)
      expect(sanitizedWhiteboard.settings.height).toBe(1080)
      expect(sanitizedWhiteboard.settings.backgroundColor).toBe('#FFFFFF')
      
      expect(sanitizedDrawing.id).toBe('123e4567-e89b-12d3-a456-426614174001')
      expect(sanitizedDrawing.tool).toBe('pen')
      expect(sanitizedDrawing.color).toBe('#000000')
      expect(sanitizedDrawing.size).toBe(2)
      
      expect(sanitizedStickyNote.id).toBe('123e4567-e89b-12d3-a456-426614174003')
      expect(sanitizedStickyNote.content).toBe('Test sticky note')
      expect(sanitizedStickyNote.position.x).toBe(0)
      expect(sanitizedStickyNote.position.y).toBe(0)
      expect(sanitizedStickyNote.color).toBe('#FFE066')
      
      expect(sanitizedUser.id).toBe('123e4567-e89b-12d3-a456-426614174002')
      expect(sanitizedUser.displayName).toBe('Test User')
    })

    it('should handle model validation errors', () => {
      const invalidWhiteboard = {
        id: 'invalid-uuid',
        name: '',
        createdAt: 'invalid-date'
      }
      
      const invalidDrawing = {
        id: 'invalid-uuid',
        tool: 'invalid-tool',
        color: 'invalid-color',
        size: -1,
        points: []
      }
      
      const invalidStickyNote = {
        id: 'invalid-uuid',
        content: '',
        position: { x: 'invalid', y: 'invalid' },
        color: 'invalid-color'
      }
      
      const invalidUser = {
        id: 'invalid-uuid',
        displayName: '',
        lastSeen: 'invalid-date'
      }
      
      const whiteboardValidation = WhiteboardModelValidator.validateWhiteboard(invalidWhiteboard)
      const drawingValidation = DrawingModelValidator.validateDrawing(invalidDrawing)
      const stickyNoteValidation = StickyNoteModelValidator.validateStickyNote(invalidStickyNote)
      const userValidation = UserModelValidator.validateUser(invalidUser)
      
      expect(whiteboardValidation.isValid).toBe(false)
      expect(whiteboardValidation.errors.length).toBeGreaterThan(0)
      
      expect(drawingValidation.isValid).toBe(false)
      expect(drawingValidation.errors.length).toBeGreaterThan(0)
      
      expect(stickyNoteValidation.isValid).toBe(false)
      expect(stickyNoteValidation.errors.length).toBeGreaterThan(0)
      
      expect(userValidation.isValid).toBe(false)
      expect(userValidation.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Bounds Validation Integration', () => {
    it('should integrate bounds validation across models', () => {
      const whiteboardSettings = {
        width: 1920,
        height: 1080,
        backgroundColor: '#FFFFFF'
      }
      
      const validDrawingPoints = [
        { x: 100, y: 200 },
        { x: 150, y: 250 }
      ]
      
      const invalidDrawingPoints = [
        { x: 2000, y: 200 }, // x out of bounds
        { x: 150, y: 250 }
      ]
      
      const validStickyNotePosition = { x: 100, y: 200 }
      const invalidStickyNotePosition = { x: 2000, y: 200 } // x out of bounds
      
      const validDrawingBounds = DrawingModelValidator.validateBounds(validDrawingPoints, 1920, 1080)
      const invalidDrawingBounds = DrawingModelValidator.validateBounds(invalidDrawingPoints, 1920, 1080)
      
      const validStickyNoteBounds = StickyNoteModelValidator.validateBounds(validStickyNotePosition, 1920, 1080)
      const invalidStickyNoteBounds = StickyNoteModelValidator.validateBounds(invalidStickyNotePosition, 1920, 1080)
      
      const validWhiteboardBounds = WhiteboardModelValidator.validateBounds(whiteboardSettings, 100, 200)
      const invalidWhiteboardBounds = WhiteboardModelValidator.validateBounds(whiteboardSettings, 2000, 200)
      
      expect(validDrawingBounds).toBe(true)
      expect(invalidDrawingBounds).toBe(false)
      
      expect(validStickyNoteBounds).toBe(true)
      expect(invalidStickyNoteBounds).toBe(false)
      
      expect(validWhiteboardBounds).toBe(true)
      expect(invalidWhiteboardBounds).toBe(false)
    })

    it('should integrate coordinate normalization across models', () => {
      const whiteboardSettings = {
        width: 1920,
        height: 1080,
        backgroundColor: '#FFFFFF'
      }
      
      const outOfBoundsDrawingPoints = [
        { x: 2000, y: -100 },
        { x: 150, y: 250 }
      ]
      
      const outOfBoundsStickyNotePosition = { x: 2000, y: -100 }
      
      const normalizedDrawingPoints = DrawingModelValidator.normalizeCoordinates(outOfBoundsDrawingPoints, 1920, 1080)
      const normalizedStickyNotePosition = StickyNoteModelValidator.normalizePosition(outOfBoundsStickyNotePosition, 1920, 1080)
      const normalizedWhiteboardCoordinates = WhiteboardModelValidator.normalizeCoordinates(whiteboardSettings, 2000, -100)
      
      expect(normalizedDrawingPoints[0].x).toBe(1920) // Clamped to max width
      expect(normalizedDrawingPoints[0].y).toBe(0) // Clamped to min height
      expect(normalizedDrawingPoints[1].x).toBe(150) // Unchanged
      expect(normalizedDrawingPoints[1].y).toBe(250) // Unchanged
      
      expect(normalizedStickyNotePosition.x).toBe(1920) // Clamped to max width
      expect(normalizedStickyNotePosition.y).toBe(0) // Clamped to min height
      
      expect(normalizedWhiteboardCoordinates.x).toBe(1920) // Clamped to max width
      expect(normalizedWhiteboardCoordinates.y).toBe(0) // Clamped to min height
    })
  })

  describe('Utility Functions Integration', () => {
    it('should integrate utility functions across models', () => {
      const drawingPoints = [
        { x: 100, y: 200 },
        { x: 150, y: 250 },
        { x: 200, y: 300 }
      ]
      
      const stickyNotes = [
        {
          id: '1',
          content: 'Note 1',
          position: { x: 100, y: 100 },
          color: '#FFE066',
          userId: 'user1',
          createdAt: new Date('2023-01-01T00:00:00Z')
        },
        {
          id: '2',
          content: 'Note 2',
          position: { x: 300, y: 300 },
          color: '#FFE066',
          userId: 'user2',
          createdAt: new Date('2023-01-01T00:00:00Z')
        }
      ]
      
      const users = [
        {
          id: '1',
          displayName: 'Active User',
          lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          cursorPosition: { x: 100, y: 200 }
        },
        {
          id: '2',
          displayName: 'Inactive User',
          lastSeen: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          cursorPosition: { x: 300, y: 400 }
        }
      ]
      
      const drawingBounds = DrawingModelValidator.calculateBounds(drawingPoints)
      const optimizedPoints = DrawingModelValidator.optimizePoints(drawingPoints, 2)
      
      const collisionCheck = StickyNoteModelValidator.checkCollision({ x: 150, y: 150 }, stickyNotes)
      const searchResults = StickyNoteModelValidator.searchStickyNotes(stickyNotes, 'Note 1')
      
      const userStats = UserModelValidator.getUserStatistics(users)
      const activeUsers = UserModelValidator.getUsersByActivity(users, true)
      
      expect(drawingBounds.minX).toBe(100)
      expect(drawingBounds.minY).toBe(200)
      expect(drawingBounds.maxX).toBe(200)
      expect(drawingBounds.maxY).toBe(300)
      
      expect(optimizedPoints.length).toBeLessThanOrEqual(drawingPoints.length)
      
      expect(collisionCheck).toBe(true) // Should collide with Note 1
      
      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].id).toBe('1')
      
      expect(userStats.total).toBe(2)
      expect(userStats.active).toBe(1)
      expect(userStats.inactive).toBe(1)
      
      expect(activeUsers).toHaveLength(1)
      expect(activeUsers[0].id).toBe('1')
    })
  })
})