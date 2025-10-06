/**
 * Canvas Object Data Model
 * Comprehensive data model for text and shape objects on the canvas
 * 
 * @fileoverview Canvas object data model with validation and business logic
 * @version 1.0.0
 */

import { z } from 'zod'

// Zod schemas for validation
export const PointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
})

export const CanvasObjectTypeSchema = z.enum(['text', 'rectangle', 'circle', 'line', 'arrow', 'move'])

export const CanvasObjectColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

export const CanvasObjectSizeSchema = z.number().min(1).max(50)

export const TextObjectSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('text'),
  content: z.string().min(1).max(500),
  position: PointSchema,
  fontSize: z.number().min(8).max(72),
  color: CanvasObjectColorSchema,
  fontFamily: z.string().default('Arial'),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  userId: z.string().uuid(),
  createdAt: z.date()
})

export const ShapeObjectSchema = z.object({
  id: z.string().uuid(),
  type: CanvasObjectTypeSchema.exclude(['text']),
  startPoint: PointSchema,
  endPoint: PointSchema,
  strokeColor: CanvasObjectColorSchema,
  fillColor: CanvasObjectColorSchema.optional(),
  strokeWidth: CanvasObjectSizeSchema,
  userId: z.string().uuid(),
  createdAt: z.date()
})

export const CanvasObjectSchema = z.discriminatedUnion('type', [
  TextObjectSchema,
  ShapeObjectSchema
])

// Type definitions
export type CanvasObjectModel = z.infer<typeof CanvasObjectSchema>
export type TextObjectModel = z.infer<typeof TextObjectSchema>
export type ShapeObjectModel = z.infer<typeof ShapeObjectSchema>
export type CanvasObjectTypeModel = z.infer<typeof CanvasObjectTypeSchema>
export type PointModel = z.infer<typeof PointSchema>

// Create schemas
export const CreateTextObjectParamsSchema = z.object({
  type: z.literal('text'),
  content: z.string().min(1).max(500),
  position: PointSchema,
  fontSize: z.number().min(8).max(72).default(16),
  color: CanvasObjectColorSchema,
  fontFamily: z.string().default('Arial'),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  userId: z.string().uuid()
})

export const CreateShapeObjectParamsSchema = z.object({
  type: CanvasObjectTypeSchema.exclude(['text']),
  startPoint: PointSchema,
  endPoint: PointSchema,
  strokeColor: CanvasObjectColorSchema,
  fillColor: CanvasObjectColorSchema.optional(),
  strokeWidth: CanvasObjectSizeSchema.default(2),
  userId: z.string().uuid()
})

export const CreateCanvasObjectParamsSchema = z.discriminatedUnion('type', [
  CreateTextObjectParamsSchema,
  CreateShapeObjectParamsSchema
])

// Update schemas
export const UpdateTextObjectParamsSchema = z.object({
  content: z.string().min(1).max(500).optional(),
  position: PointSchema.optional(),
  fontSize: z.number().min(8).max(72).optional(),
  color: CanvasObjectColorSchema.optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.enum(['normal', 'bold']).optional()
})

export const UpdateShapeObjectParamsSchema = z.object({
  startPoint: PointSchema.optional(),
  endPoint: PointSchema.optional(),
  strokeColor: CanvasObjectColorSchema.optional(),
  fillColor: CanvasObjectColorSchema.optional(),
  strokeWidth: CanvasObjectSizeSchema.optional()
})

export const UpdateCanvasObjectParamsSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text') }).merge(UpdateTextObjectParamsSchema),
  z.object({ type: CanvasObjectTypeSchema.exclude(['text']) }).merge(UpdateShapeObjectParamsSchema)
])

// Type definitions for create/update
export type CreateCanvasObjectParamsModel = z.infer<typeof CreateCanvasObjectParamsSchema>
export type CreateTextObjectParamsModel = z.infer<typeof CreateTextObjectParamsSchema>
export type CreateShapeObjectParamsModel = z.infer<typeof CreateShapeObjectParamsSchema>
export type UpdateCanvasObjectParamsModel = z.infer<typeof UpdateCanvasObjectParamsSchema>
export type UpdateTextObjectParamsModel = z.infer<typeof UpdateTextObjectParamsSchema>
export type UpdateShapeObjectParamsModel = z.infer<typeof UpdateShapeObjectParamsSchema>

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

export class CanvasObjectModelValidator {
  /**
   * Validate canvas object type
   */
  static validateType(type: string): ValidationResult {
    try {
      CanvasObjectTypeSchema.parse(type)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: 'type',
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'type',
          message: 'Invalid object type format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate text object
   */
  static validateTextObject(textObject: Partial<TextObjectModel>): ValidationResult {
    try {
      TextObjectSchema.parse(textObject)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
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
          field: 'textObject',
          message: 'Invalid text object format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate shape object
   */
  static validateShapeObject(shapeObject: Partial<ShapeObjectModel>): ValidationResult {
    try {
      ShapeObjectSchema.parse(shapeObject)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
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
          field: 'shapeObject',
          message: 'Invalid shape object format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate canvas object
   */
  static validateCanvasObject(object: Partial<CanvasObjectModel>): ValidationResult {
    try {
      CanvasObjectSchema.parse(object)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
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
          field: 'canvasObject',
          message: 'Invalid canvas object format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Sanitize canvas object data
   */
  static sanitizeCanvasObject(object: Partial<CanvasObjectModel>): CanvasObjectModel {
    if (object.type === 'text') {
      const sanitized: Partial<TextObjectModel> = {
        id: object.id || '',
        type: 'text',
        content: object.content || 'Text',
        position: object.position || { x: 0, y: 0 },
        fontSize: object.fontSize || 16,
        color: object.color || '#000000',
        fontFamily: object.fontFamily || 'Arial',
        fontWeight: object.fontWeight || 'normal',
        userId: object.userId || '',
        createdAt: object.createdAt || new Date()
      }
      return TextObjectSchema.parse(sanitized)
    } else {
      const sanitized: Partial<ShapeObjectModel> = {
        id: object.id || '',
        type: object.type || 'rectangle',
        startPoint: object.startPoint || { x: 0, y: 0 },
        endPoint: object.endPoint || { x: 100, y: 100 },
        strokeColor: object.strokeColor || '#000000',
        fillColor: object.fillColor,
        strokeWidth: object.strokeWidth || 2,
        userId: object.userId || '',
        createdAt: object.createdAt || new Date()
      }
      return ShapeObjectSchema.parse(sanitized)
    }
  }

  /**
   * Calculate shape bounds
   */
  static calculateShapeBounds(startPoint: PointModel, endPoint: PointModel): { minX: number; minY: number; maxX: number; maxY: number } {
    return {
      minX: Math.min(startPoint.x, endPoint.x),
      minY: Math.min(startPoint.y, endPoint.y),
      maxX: Math.max(startPoint.x, endPoint.x),
      maxY: Math.max(startPoint.y, endPoint.y)
    }
  }

  /**
   * Calculate text bounds (approximate)
   */
  static calculateTextBounds(position: PointModel, content: string, fontSize: number): { minX: number; minY: number; maxX: number; maxY: number } {
    // Approximate text width (roughly 0.6 * fontSize per character)
    const textWidth = content.length * fontSize * 0.6
    const textHeight = fontSize * 1.2
    
    return {
      minX: position.x,
      minY: position.y - textHeight,
      maxX: position.x + textWidth,
      maxY: position.y
    }
  }
}
