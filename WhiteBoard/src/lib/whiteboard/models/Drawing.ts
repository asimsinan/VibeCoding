/**
 * Drawing Domain Model
 * Core business logic for drawing entities
 * 
 * @fileoverview Drawing domain model with validation and business rules
 * @version 1.0.0
 */

import { Drawing as DrawingType, Point, CreateDrawingParams, UpdateDrawingParams } from '@/contracts/types/domain'
import { supabase } from '@/lib/supabase/client'
import { ValidationResult, ValidationError } from '@/contracts/types/domain'

export class Drawing implements DrawingType {
  readonly id: string
  readonly whiteboardId: string
  readonly tool: 'pen' | 'brush' | 'eraser'
  readonly color: string
  readonly size: number
  readonly points: Point[]
  readonly userId: string
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(
    id: string,
    whiteboardId: string,
    tool: 'pen' | 'brush' | 'eraser',
    color: string,
    size: number,
    points: Point[],
    userId: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id
    this.whiteboardId = whiteboardId
    this.tool = tool
    this.color = color
    this.size = size
    this.points = points
    this.userId = userId
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  /**
   * Create a new drawing
   * FR-002: Create drawing functionality
   */
  static async create(whiteboardId: string, params: CreateDrawingParams): Promise<Drawing> {
    const validation = Drawing.validateCreateParams(params)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.map((e: ValidationError) => e.message).join(', ') || 'Unknown validation error'}`)
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User must be authenticated to create drawings')
    }

    const { data, error } = await (supabase as any)
      .from('drawings')
      .insert({
        whiteboard_id: whiteboardId,
        tool: params.tool,
        color: params.color,
        size: params.size,
        points: params.points,
        user_id: params.userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create drawing: ${error.message}`)
    }

    return new Drawing(
      data.id,
      data.whiteboard_id,
      data.tool,
      data.color,
      data.size,
      data.points,
      data.user_id,
      new Date(data.created_at),
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Get drawing by ID
   * FR-002: Retrieve drawing functionality
   */
  static async getById(id: string): Promise<Drawing | null> {
    const { data, error } = await (supabase as any)
      .from('drawings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get drawing: ${error.message}`)
    }

    return new Drawing(
      data.id,
      data.whiteboard_id,
      data.tool,
      data.color,
      data.size,
      data.points,
      data.user_id,
      new Date(data.created_at),
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Update drawing
   * FR-002: Update drawing functionality
   */
  static async update(id: string, params: UpdateDrawingParams): Promise<Drawing> {
    const validation = Drawing.validateUpdateParams(params)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.map((e: ValidationError) => e.message).join(', ') || 'Unknown validation error'}`)
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User must be authenticated to update drawings')
    }

    const updateData: any = {}
    if (params.tool !== undefined) {
      updateData.tool = params.tool
    }
    if (params.color !== undefined) {
      updateData.color = params.color
    }
    if (params.size !== undefined) {
      updateData.size = params.size
    }
    if (params.points !== undefined) {
      updateData.points = params.points
    }

    const { data, error } = await (supabase as any)
      .from('drawings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update drawing: ${error.message}`)
    }

    return new Drawing(
      data.id,
      data.whiteboard_id,
      data.tool,
      data.color,
      data.size,
      data.points,
      data.user_id,
      new Date(data.created_at),
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Delete drawing
   * FR-002: Delete drawing functionality
   */
  async delete(): Promise<void> {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User must be authenticated to delete drawings')
    }

    const { error } = await (supabase as any)
      .from('drawings')
      .delete()
      .eq('id', this.id)

    if (error) {
      throw new Error(`Failed to delete drawing: ${error.message}`)
    }
  }

  /**
   * Update drawing (instance method)
   */
  async update(params: UpdateDrawingParams): Promise<Drawing> {
    return Drawing.update(this.id, params)
  }

  /**
   * Get drawings for whiteboard
   * FR-002: List drawings functionality
   */
  static async getByWhiteboardId(whiteboardId: string): Promise<Drawing[]> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('User must be authenticated to access drawings')
      }

      const { data, error } = await (supabase as any)
        .from('drawings')
        .select('*')
        .eq('whiteboard_id', whiteboardId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase error getting drawings:', error)
        throw new Error(`Failed to get drawings: ${error.message}`)
      }

      if (!data) {
        console.warn('No drawings data returned from database')
        return []
      }

      return data.map((drawing: any) => new Drawing(
        drawing.id,
        drawing.whiteboard_id,
        drawing.tool,
        drawing.color,
        drawing.size,
        drawing.points,
        drawing.user_id,
        new Date(drawing.created_at),
        new Date(drawing.updated_at || drawing.created_at)
      ))
    } catch (error) {
      console.error('Error in Drawing.getByWhiteboardId:', error)
      throw error
    }
  }

  /**
   * Validate create parameters
   */
  private static validateCreateParams(params: CreateDrawingParams): ValidationResult<CreateDrawingParams> {
    const errors: ValidationError[] = []

    if (!params.tool || !['pen', 'brush', 'eraser'].includes(params.tool)) {
      errors.push({
        field: 'tool',
        message: 'Tool must be pen, brush, or eraser',
        code: 'INVALID_VALUE'
      })
    }

    if (!params.color || !params.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push({
        field: 'color',
        message: 'Color must be a valid hex color',
        code: 'FORMAT'
      })
    }

    if (!params.size || params.size < 1 || params.size > 50) {
      errors.push({
        field: 'size',
        message: 'Size must be between 1 and 50',
        code: 'RANGE'
      })
    }

    if (!params.points || params.points.length === 0) {
      errors.push({
        field: 'points',
        message: 'Points array cannot be empty',
        code: 'REQUIRED'
      })
    }

    if (params.points) {
      for (let i = 0; i < params.points.length; i++) {
        const point = params.points[i]
        if (point && (typeof point.x !== 'number' || typeof point.y !== 'number')) {
          errors.push({
            field: `points[${i}]`,
            message: 'Point coordinates must be numbers',
            code: 'TYPE'
          })
        }
      }
    }

    if (!params.userId) {
      errors.push({
        field: 'userId',
        message: 'User ID is required',
        code: 'REQUIRED'
      })
    }

    return {
      success: errors.length === 0,
      errors
    }
  }

  /**
   * Validate update parameters
   */
  private static validateUpdateParams(params: UpdateDrawingParams): ValidationResult<UpdateDrawingParams> {
    const errors: ValidationError[] = []

    if (params.tool !== undefined && !['pen', 'brush', 'eraser'].includes(params.tool)) {
      errors.push({
        field: 'tool',
        message: 'Tool must be pen, brush, or eraser',
        code: 'INVALID_VALUE'
      })
    }

    if (params.color !== undefined && !params.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push({
        field: 'color',
        message: 'Color must be a valid hex color',
        code: 'FORMAT'
      })
    }

    if (params.size !== undefined && (params.size < 1 || params.size > 50)) {
      errors.push({
        field: 'size',
        message: 'Size must be between 1 and 50',
        code: 'RANGE'
      })
    }

    if (params.points !== undefined) {
      if (params.points.length === 0) {
        errors.push({
          field: 'points',
          message: 'Points array cannot be empty',
          code: 'REQUIRED'
        })
      }

      for (let i = 0; i < params.points.length; i++) {
        const point = params.points[i]
        if (!point) {
          errors.push({
            field: `points[${i}]`,
            message: 'Point cannot be null or undefined',
            code: 'REQUIRED'
          })
          continue
        }
        if (typeof point.x !== 'number') {
          errors.push({
            field: `points[${i}].x`,
            message: 'X coordinate must be a number',
            code: 'TYPE'
          })
        }
        if (typeof point.y !== 'number') {
          errors.push({
            field: `points[${i}].y`,
            message: 'Y coordinate must be a number',
            code: 'TYPE'
          })
        }
      }
    }

    return {
      success: errors.length === 0,
      errors
    }
  }
}
