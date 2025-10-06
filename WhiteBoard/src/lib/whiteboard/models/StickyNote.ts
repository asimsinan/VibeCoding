/**
 * Sticky Note Domain Model
 * Core business logic for sticky note entities
 * 
 * @fileoverview Sticky note domain model with validation and business rules
 * @version 1.0.0
 */

import { StickyNote as StickyNoteType, Position, CreateStickyNoteParams, UpdateStickyNoteParams } from '@/contracts/types/domain'
import { supabase } from '@/lib/supabase/client'
import { ValidationResult, ValidationError } from '@/contracts/types/domain'

export class StickyNote implements StickyNoteType {
  readonly id: string
  readonly content: string
  readonly position: Position
  readonly color: string
  readonly userId: string
  readonly whiteboardId: string
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(
    id: string,
    content: string,
    position: Position,
    color: string,
    userId: string,
    whiteboardId: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id
    this.content = content
    this.position = position
    this.color = color
    this.userId = userId
    this.whiteboardId = whiteboardId
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  /**
   * Create a new sticky note
   * FR-003: Create sticky note functionality
   */
  static async create(whiteboardId: string, params: CreateStickyNoteParams): Promise<StickyNote> {
    const validation = StickyNote.validateCreateParams(params)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.map((e: ValidationError) => e.message).join(', ') || 'Unknown validation error'}`)
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User must be authenticated to create sticky notes')
    }

    const { data, error } = await (supabase as any)
      .from('sticky_notes')
      .insert({
        whiteboard_id: whiteboardId,
        content: params.content,
        position: params.position,
        color: params.color,
        user_id: params.userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create sticky note: ${error.message}`)
    }

    return new StickyNote(
      data.id,
      data.content,
      data.position,
      data.color,
      data.user_id,
      data.whiteboard_id,
      new Date(data.created_at),
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Get sticky note by ID
   * FR-003: Retrieve sticky note functionality
   */
  static async getById(id: string): Promise<StickyNote | null> {
    const { data, error } = await (supabase as any)
      .from('sticky_notes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get sticky note: ${error.message}`)
    }

    return new StickyNote(
      data.id,
      data.content,
      data.position,
      data.color,
      data.user_id,
      data.whiteboard_id,
      new Date(data.created_at),
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Update sticky note
   * FR-003: Update sticky note functionality
   */
  static async update(id: string, params: UpdateStickyNoteParams): Promise<StickyNote> {
    const validation = StickyNote.validateUpdateParams(params)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.map((e: ValidationError) => e.message).join(', ') || 'Unknown validation error'}`)
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User must be authenticated to update sticky notes')
    }

    const updateData: any = {}
    if (params.content !== undefined) {
      updateData.content = params.content
    }
    if (params.position !== undefined) {
      updateData.position = params.position
    }
    if (params.color !== undefined) {
      updateData.color = params.color
    }

    const { data, error } = await (supabase as any)
      .from('sticky_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update sticky note: ${error.message}`)
    }

    return new StickyNote(
      data.id,
      data.content,
      data.position,
      data.color,
      data.user_id,
      data.whiteboard_id,
      new Date(data.created_at),
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Delete sticky note
   * FR-003: Delete sticky note functionality
   */
  async delete(): Promise<void> {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User must be authenticated to delete sticky notes')
    }

    const { error } = await (supabase as any)
      .from('sticky_notes')
      .delete()
      .eq('id', this.id)

    if (error) {
      throw new Error(`Failed to delete sticky note: ${error.message}`)
    }
  }

  /**
   * Update sticky note (instance method)
   */
  async update(params: UpdateStickyNoteParams): Promise<StickyNote> {
    return StickyNote.update(this.id, params)
  }

  /**
   * Get sticky notes for whiteboard
   * FR-003: List sticky notes functionality
   */
  static async getByWhiteboardId(whiteboardId: string): Promise<StickyNote[]> {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User must be authenticated to access sticky notes')
    }

    const { data, error } = await (supabase as any)
      .from('sticky_notes')
      .select('*')
      .eq('whiteboard_id', whiteboardId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to get sticky notes: ${error.message}`)
    }

    return data.map((note: any) => new StickyNote(
      note.id,
      note.content,
      note.position,
      note.color,
      note.user_id,
      note.whiteboard_id,
      new Date(note.created_at),
      new Date(note.updated_at || note.created_at)
    ))
  }

  /**
   * Validate create parameters
   */
  private static validateCreateParams(params: CreateStickyNoteParams): ValidationResult<CreateStickyNoteParams> {
    const errors: ValidationError[] = []

    if (!params.content || params.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Content is required',
        code: 'REQUIRED'
      })
    }

    if (params.content && params.content.length > 500) {
      errors.push({
        field: 'content',
        message: 'Content must be 500 characters or less',
        code: 'MAX_LENGTH'
      })
    }

    if (!params.position || typeof params.position.x !== 'number' || typeof params.position.y !== 'number') {
      errors.push({
        field: 'position',
        message: 'Position with x and y coordinates is required',
        code: 'REQUIRED'
      })
    }

    if (params.position) {
      if (typeof params.position.x !== 'number') {
        errors.push({
          field: 'position.x',
          message: 'X coordinate must be a number',
          code: 'TYPE'
        })
      }
      if (typeof params.position.y !== 'number') {
        errors.push({
          field: 'position.y',
          message: 'Y coordinate must be a number',
          code: 'TYPE'
        })
      }
    }

    if (!params.color || typeof params.color !== 'string' || !params.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push({
        field: 'color',
        message: 'Color must be a valid hex color',
        code: 'FORMAT'
      })
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
  private static validateUpdateParams(params: UpdateStickyNoteParams): ValidationResult<UpdateStickyNoteParams> {
    const errors: ValidationError[] = []

    if (params.content !== undefined) {
      if (!params.content || params.content.trim().length === 0) {
        errors.push({
          field: 'content',
          message: 'Content cannot be empty',
          code: 'REQUIRED'
        })
      }

      if (params.content.length > 500) {
        errors.push({
          field: 'content',
          message: 'Content must be 500 characters or less',
          code: 'MAX_LENGTH'
        })
      }
    }

    if (params.position !== undefined) {
      if (typeof params.position.x !== 'number' || typeof params.position.y !== 'number') {
        errors.push({
          field: 'position',
          message: 'Position must have x and y coordinates',
          code: 'REQUIRED'
        })
      }

      if (params.position.x !== undefined && typeof params.position.x !== 'number') {
        errors.push({
          field: 'position.x',
          message: 'X coordinate must be a number',
          code: 'TYPE'
        })
      }

      if (params.position.y !== undefined && typeof params.position.y !== 'number') {
        errors.push({
          field: 'position.y',
          message: 'Y coordinate must be a number',
          code: 'TYPE'
        })
      }
    }

    if (params.color !== undefined && !params.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push({
        field: 'color',
        message: 'Color must be a valid hex color',
        code: 'FORMAT'
      })
    }

    return {
      success: errors.length === 0,
      errors
    }
  }
}
