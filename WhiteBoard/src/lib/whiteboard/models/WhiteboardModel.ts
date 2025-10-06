/**
 * Whiteboard Data Model
 * Comprehensive data model with validation and business rules
 * 
 * @fileoverview Whiteboard data model with validation and business logic
 * @version 1.0.0
 */

import { z } from 'zod'

// Zod schemas for validation
export const WhiteboardSettingsSchema = z.object({
  width: z.number().min(100).max(10000).default(1920),
  height: z.number().min(100).max(10000).default(1080),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF')
})

export const CreateWhiteboardParamsSchema = z.object({
  name: z.string().min(1).max(100),
  settings: WhiteboardSettingsSchema.optional()
})

export const UpdateWhiteboardParamsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: WhiteboardSettingsSchema.partial().optional()
})

export const WhiteboardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  settings: WhiteboardSettingsSchema,
  drawings: z.array(z.any()).default([]),
  stickyNotes: z.array(z.any()).default([]),
  activeUsers: z.array(z.any()).default([])
})

// Type definitions
export type WhiteboardModel = z.infer<typeof WhiteboardSchema>
export type WhiteboardSettingsModel = z.infer<typeof WhiteboardSettingsSchema>
export type CreateWhiteboardParamsModel = z.infer<typeof CreateWhiteboardParamsSchema>
export type UpdateWhiteboardParamsModel = z.infer<typeof UpdateWhiteboardParamsSchema>

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

export class WhiteboardModelValidator {
  /**
   * Validate whiteboard settings
   */
  static validateSettings(settings: Partial<WhiteboardSettingsModel>): ValidationResult {
    try {
      WhiteboardSettingsSchema.parse(settings)
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
          field: 'settings',
          message: 'Invalid settings format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate create whiteboard parameters
   */
  static validateCreateParams(params: CreateWhiteboardParamsModel): ValidationResult {
    try {
      CreateWhiteboardParamsSchema.parse(params)
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
   * Validate update whiteboard parameters
   */
  static validateUpdateParams(params: UpdateWhiteboardParamsModel): ValidationResult {
    try {
      UpdateWhiteboardParamsSchema.parse(params)
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
   * Validate whiteboard data
   */
  static validateWhiteboard(whiteboard: Partial<WhiteboardModel>): ValidationResult {
    try {
      WhiteboardSchema.parse(whiteboard)
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
          field: 'whiteboard',
          message: 'Invalid whiteboard format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Sanitize whiteboard data
   */
  static sanitizeWhiteboard(whiteboard: Partial<WhiteboardModel>): WhiteboardModel {
    const sanitized = {
      id: whiteboard.id || '',
      name: whiteboard.name || '',
      createdAt: whiteboard.createdAt || new Date(),
      updatedAt: whiteboard.updatedAt,
      settings: {
        width: whiteboard.settings?.width || 1920,
        height: whiteboard.settings?.height || 1080,
        backgroundColor: whiteboard.settings?.backgroundColor || '#FFFFFF'
      },
      drawings: whiteboard.drawings || [],
      stickyNotes: whiteboard.stickyNotes || [],
      activeUsers: whiteboard.activeUsers || []
    }

    return WhiteboardSchema.parse(sanitized)
  }

  /**
   * Validate whiteboard bounds
   */
  static validateBounds(settings: WhiteboardSettingsModel, x: number, y: number): boolean {
    return x >= 0 && x <= settings.width && y >= 0 && y <= settings.height
  }

  /**
   * Normalize coordinates to whiteboard bounds
   */
  static normalizeCoordinates(settings: WhiteboardSettingsModel, x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(x, settings.width)),
      y: Math.max(0, Math.min(y, settings.height))
    }
  }
}
