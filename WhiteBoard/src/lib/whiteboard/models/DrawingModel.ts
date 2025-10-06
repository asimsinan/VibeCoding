/**
 * Drawing Data Model
 * Comprehensive data model with validation and business rules
 * 
 * @fileoverview Drawing data model with validation and business logic
 * @version 1.0.0
 */

import { z } from 'zod'

// Zod schemas for validation
export const PointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
})

export const DrawingToolSchema = z.enum(['pen', 'brush', 'eraser'])

export const DrawingColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

export const DrawingSizeSchema = z.number().min(1).max(50)

export const CreateDrawingParamsSchema = z.object({
  tool: DrawingToolSchema,
  color: DrawingColorSchema,
  size: DrawingSizeSchema,
  points: z.array(PointSchema).min(1),
  userId: z.string().uuid()
})

export const UpdateDrawingParamsSchema = z.object({
  tool: DrawingToolSchema.optional(),
  color: DrawingColorSchema.optional(),
  size: DrawingSizeSchema.optional(),
  points: z.array(PointSchema).min(1).optional()
})

export const DrawingSchema = z.object({
  id: z.string().uuid(),
  tool: DrawingToolSchema,
  color: DrawingColorSchema,
  size: DrawingSizeSchema,
  points: z.array(PointSchema).min(1),
  userId: z.string().uuid(),
  createdAt: z.date()
})

// Type definitions
export type DrawingModel = z.infer<typeof DrawingSchema>
export type PointModel = z.infer<typeof PointSchema>
export type DrawingToolModel = z.infer<typeof DrawingToolSchema>
export type CreateDrawingParamsModel = z.infer<typeof CreateDrawingParamsSchema>
export type UpdateDrawingParamsModel = z.infer<typeof UpdateDrawingParamsSchema>

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

export class DrawingModelValidator {
  /**
   * Validate drawing tool
   */
  static validateTool(tool: string): ValidationResult {
    try {
      DrawingToolSchema.parse(tool)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: 'tool',
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'tool',
          message: 'Invalid tool format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate drawing color
   */
  static validateColor(color: string): ValidationResult {
    try {
      DrawingColorSchema.parse(color)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
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
   * Validate drawing size
   */
  static validateSize(size: number): ValidationResult {
    try {
      DrawingSizeSchema.parse(size)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: 'size',
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'size',
          message: 'Invalid size format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate drawing points
   */
  static validatePoints(points: PointModel[]): ValidationResult {
    try {
      z.array(PointSchema).min(1).parse(points)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: 'points',
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'points',
          message: 'Invalid points format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate create drawing parameters
   */
  static validateCreateParams(params: CreateDrawingParamsModel): ValidationResult {
    try {
      CreateDrawingParamsSchema.parse(params)
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
          field: 'params',
          message: 'Invalid parameters format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate update drawing parameters
   */
  static validateUpdateParams(params: UpdateDrawingParamsModel): ValidationResult {
    try {
      UpdateDrawingParamsSchema.parse(params)
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
          field: 'params',
          message: 'Invalid parameters format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate drawing data
   */
  static validateDrawing(drawing: Partial<DrawingModel>): ValidationResult {
    try {
      DrawingSchema.parse(drawing)
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
          field: 'drawing',
          message: 'Invalid drawing format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Sanitize drawing data
   */
  static sanitizeDrawing(drawing: Partial<DrawingModel>): DrawingModel {
    const sanitized = {
      id: drawing.id || '',
      tool: drawing.tool || 'pen',
      color: drawing.color || '#000000',
      size: drawing.size || 2,
      points: drawing.points || [],
      userId: drawing.userId || '',
      createdAt: drawing.createdAt || new Date()
    }

    return DrawingSchema.parse(sanitized)
  }

  /**
   * Validate drawing bounds
   */
  static validateBounds(points: PointModel[], maxWidth: number, maxHeight: number): boolean {
    return points.every(point => 
      point.x >= 0 && point.x <= maxWidth && 
      point.y >= 0 && point.y <= maxHeight
    )
  }

  /**
   * Normalize coordinates to bounds
   */
  static normalizeCoordinates(points: PointModel[], maxWidth: number, maxHeight: number): PointModel[] {
    return points.map(point => ({
      x: Math.max(0, Math.min(point.x, maxWidth)),
      y: Math.max(0, Math.min(point.y, maxHeight))
    }))
  }

  /**
   * Optimize drawing points
   */
  static optimizePoints(points: PointModel[], threshold: number = 2): PointModel[] {
    if (!points || points.length <= 2) return points

    const firstPoint = points[0]
    if (!firstPoint) return points

    const optimized: PointModel[] = [firstPoint]
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1]
      const current = points[i]
      
      if (!prev || !current) continue
      
      const distance = Math.sqrt(
        Math.pow(current.x - prev.x, 2) + Math.pow(current.y - prev.y, 2)
      )
      
      if (distance > threshold) {
        optimized.push(current)
      }
    }
    
    const lastPoint = points[points.length - 1]
    if (lastPoint) {
      optimized.push(lastPoint)
    }
    return optimized
  }

  /**
   * Calculate drawing bounds
   */
  static calculateBounds(points: PointModel[]): { minX: number; minY: number; maxX: number; maxY: number } {
    if (!points || points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    }

    const firstPoint = points[0]
    if (!firstPoint) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    }

    let minX = firstPoint.x
    let minY = firstPoint.y
    let maxX = firstPoint.x
    let maxY = firstPoint.y

    for (const point of points) {
      if (!point) continue
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    return { minX, minY, maxX, maxY }
  }
}
