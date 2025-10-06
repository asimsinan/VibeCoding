/**
 * Sticky Note Data Model
 * Comprehensive data model with validation and business rules
 * 
 * @fileoverview Sticky note data model with validation and business logic
 * @version 1.0.0
 */

import { z } from 'zod'

// Zod schemas for validation
export const PositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
})

export const StickyNoteColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

export const StickyNoteContentSchema = z.string().min(1).max(500)

export const CreateStickyNoteParamsSchema = z.object({
  content: StickyNoteContentSchema,
  position: PositionSchema,
  color: StickyNoteColorSchema,
  userId: z.string().uuid()
})

export const UpdateStickyNoteParamsSchema = z.object({
  content: StickyNoteContentSchema.optional(),
  position: PositionSchema.optional(),
  color: StickyNoteColorSchema.optional()
})

export const StickyNoteSchema = z.object({
  id: z.string().uuid(),
  content: StickyNoteContentSchema,
  position: PositionSchema,
  color: StickyNoteColorSchema,
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date().optional()
})

// Type definitions
export type StickyNoteModel = z.infer<typeof StickyNoteSchema>
export type PositionModel = z.infer<typeof PositionSchema>
export type CreateStickyNoteParamsModel = z.infer<typeof CreateStickyNoteParamsSchema>
export type UpdateStickyNoteParamsModel = z.infer<typeof UpdateStickyNoteParamsSchema>

// Validation result type
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export class StickyNoteModelValidator {
  /**
   * Validate sticky note content
   */
  static validateContent(content: string): ValidationResult {
    try {
      StickyNoteContentSchema.parse(content)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError && error.issues) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: 'content',
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'content',
          message: 'Invalid content format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate sticky note position
   */
  static validatePosition(position: PositionModel): ValidationResult {
    try {
      PositionSchema.parse(position)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError && error.issues) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: 'position',
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'position',
          message: 'Invalid position format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate sticky note color
   */
  static validateColor(color: string): ValidationResult {
    try {
      StickyNoteColorSchema.parse(color)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError && error.issues) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: 'color',
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'color',
          message: 'Invalid color format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate create sticky note parameters
   */
  static validateCreateParams(params: CreateStickyNoteParamsModel): ValidationResult {
    try {
      CreateStickyNoteParamsSchema.parse(params)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError && error.issues) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'params',
          message: 'Invalid parameters format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate update sticky note parameters
   */
  static validateUpdateParams(params: UpdateStickyNoteParamsModel): ValidationResult {
    try {
      UpdateStickyNoteParamsSchema.parse(params)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError && error.issues) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'params',
          message: 'Invalid parameters format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate sticky note data
   */
  static validateStickyNote(stickyNote: Partial<StickyNoteModel>): ValidationResult {
    try {
      StickyNoteSchema.parse(stickyNote)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError && error.issues) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'stickyNote',
          message: 'Invalid sticky note format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Sanitize sticky note data
   */
  static sanitizeStickyNote(stickyNote: Partial<StickyNoteModel>): StickyNoteModel {
    const sanitized = {
      id: stickyNote.id || '',
      content: stickyNote.content || '',
      position: stickyNote.position || { x: 0, y: 0 },
      color: stickyNote.color || '#FFE066',
      userId: stickyNote.userId || '',
      createdAt: stickyNote.createdAt || new Date(),
      updatedAt: stickyNote.updatedAt
    }

    return StickyNoteSchema.parse(sanitized)
  }

  /**
   * Validate sticky note bounds
   */
  static validateBounds(position: PositionModel, maxWidth: number, maxHeight: number): boolean {
    return position.x >= 0 && position.x <= maxWidth && 
           position.y >= 0 && position.y <= maxHeight
  }

  /**
   * Normalize position to bounds
   */
  static normalizePosition(position: PositionModel, maxWidth: number, maxHeight: number): PositionModel {
    return {
      x: Math.max(0, Math.min(position.x, maxWidth)),
      y: Math.max(0, Math.min(position.y, maxHeight))
    }
  }

  /**
   * Check for sticky note collisions
   */
  static checkCollision(
    position: PositionModel, 
    existingNotes: StickyNoteModel[], 
    excludeId?: string,
    tolerance: number = 10
  ): boolean {
    const stickyNoteWidth = 200 // Default sticky note width
    const stickyNoteHeight = 150 // Default sticky note height

    return existingNotes.some(note => {
      if (excludeId && note.id === excludeId) return false

      const noteX = note.position.x
      const noteY = note.position.y

      return !(
        position.x + stickyNoteWidth + tolerance < noteX ||
        position.x > noteX + stickyNoteWidth + tolerance ||
        position.y + stickyNoteHeight + tolerance < noteY ||
        position.y > noteY + stickyNoteHeight + tolerance
      )
    })
  }

  /**
   * Find optimal position for new sticky note
   */
  static findOptimalPosition(
    existingNotes: StickyNoteModel[],
    maxWidth: number,
    maxHeight: number,
    preferredPosition?: PositionModel
  ): PositionModel {
    const stickyNoteWidth = 200
    const stickyNoteHeight = 150
    const step = 20

    // If preferred position is valid and doesn't collide, use it
    if (preferredPosition && 
        this.validateBounds(preferredPosition, maxWidth, maxHeight) &&
        !this.checkCollision(preferredPosition, existingNotes)) {
      return preferredPosition
    }

    // Search for a valid position
    for (let y = 50; y <= maxHeight - stickyNoteHeight; y += step) {
      for (let x = 50; x <= maxWidth - stickyNoteWidth; x += step) {
        const position: PositionModel = { x, y }
        if (!this.checkCollision(position, existingNotes)) {
          return position
        }
      }
    }

    // Fallback to center if no position found
    return {
      x: Math.max(50, (maxWidth - stickyNoteWidth) / 2),
      y: Math.max(50, (maxHeight - stickyNoteHeight) / 2)
    }
  }

  /**
   * Get sticky notes in area
   */
  static getStickyNotesInArea(
    stickyNotes: StickyNoteModel[],
    topLeft: PositionModel,
    bottomRight: PositionModel
  ): StickyNoteModel[] {
    return stickyNotes.filter(note => {
      const noteX = note.position.x
      const noteY = note.position.y
      const stickyNoteWidth = 200
      const stickyNoteHeight = 150

      return !(
        noteX + stickyNoteWidth < topLeft.x ||
        noteX > bottomRight.x ||
        noteY + stickyNoteHeight < topLeft.y ||
        noteY > bottomRight.y
      )
    })
  }

  /**
   * Search sticky notes by content
   */
  static searchStickyNotes(stickyNotes: StickyNoteModel[], query: string): StickyNoteModel[] {
    if (!query.trim()) return stickyNotes

    const lowercaseQuery = query.toLowerCase()
    return stickyNotes.filter(note => 
      note.content.toLowerCase().includes(lowercaseQuery)
    )
  }
}
