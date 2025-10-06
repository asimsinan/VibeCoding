/**
 * Whiteboard Domain Model
 * Core business logic for whiteboard entities
 * 
 * @fileoverview Whiteboard domain model with validation and business rules
 * @version 1.0.0
 */

import { Whiteboard as WhiteboardType, WhiteboardSettings, CreateWhiteboardParams, UpdateWhiteboardParams } from '@/contracts/types/domain'
import { supabase } from '@/lib/supabase/client'
import { ValidationResult, ValidationError } from '@/contracts/types/domain'

export class Whiteboard implements WhiteboardType {
  readonly id: string
  readonly name: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly settings: WhiteboardSettings
  readonly drawings: any[] = []
  readonly stickyNotes: any[] = []
  readonly activeUsers: any[] = []

  constructor(
    id: string,
    name: string,
    createdAt: Date,
    settings: WhiteboardSettings,
    updatedAt: Date
  ) {
    this.id = id
    this.name = name
    this.createdAt = createdAt
    this.settings = settings
    this.updatedAt = updatedAt
  }

  /**
   * Create a new whiteboard
   * FR-001: Create whiteboard functionality
   */
  static async create(params: CreateWhiteboardParams): Promise<Whiteboard> {
    const validation = Whiteboard.validateCreateParams(params)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.map((e: ValidationError) => e.message).join(', ') || 'Unknown validation error'}`)
    }

    const defaultSettings: WhiteboardSettings = {
      width: 1920,
      height: 1080,
      backgroundColor: '#FFFFFF',
      ...params.settings
    }

    const { data, error } = await (supabase as any)
      .from('whiteboards')
      .insert({
        name: params.name,
        settings: defaultSettings
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create whiteboard: ${error.message}`)
    }

    return new Whiteboard(
      data.id,
      data.name,
      new Date(data.created_at),
      data.settings,
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Get whiteboard by ID
   * FR-001: Retrieve whiteboard functionality
   */
  static async getById(id: string): Promise<Whiteboard | null> {
    const { data, error } = await (supabase as any)
      .from('whiteboards')
      .select(`
        *,
        drawings (*),
        sticky_notes (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get whiteboard: ${error.message}`)
    }

    return new Whiteboard(
      data.id,
      data.name,
      new Date(data.created_at),
      data.settings,
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Update whiteboard
   * FR-001: Update whiteboard functionality
   */
  async update(params: UpdateWhiteboardParams): Promise<Whiteboard> {
    const validation = Whiteboard.validateUpdateParams(params)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.map((e: ValidationError) => e.message).join(', ') || 'Unknown validation error'}`)
    }

    const updateData: any = {}
    if (params.name !== undefined) {
      updateData.name = params.name
    }
    if (params.settings !== undefined) {
      updateData.settings = { ...this.settings, ...params.settings }
    }

    const { data, error } = await (supabase as any)
      .from('whiteboards')
      .update(updateData)
      .eq('id', this.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update whiteboard: ${error.message}`)
    }

    return new Whiteboard(
      data.id,
      data.name,
      new Date(data.created_at),
      data.settings,
      new Date(data.updated_at || data.created_at)
    )
  }

  /**
   * Delete whiteboard
   * FR-001: Delete whiteboard functionality
   */
  async delete(): Promise<void> {
    const { error } = await (supabase as any)
      .from('whiteboards')
      .delete()
      .eq('id', this.id)

    if (error) {
      throw new Error(`Failed to delete whiteboard: ${error.message}`)
    }
  }

  /**
   * Clear all content from whiteboard
   * FR-007: Clear whiteboard functionality
   */
  async clear(): Promise<void> {
    try {
      // Clear drawings individually to ensure real-time events are triggered
      const { data: drawings } = await (supabase as any)
        .from('drawings')
        .select('id')
        .eq('whiteboard_id', this.id)

      if (drawings && drawings.length > 0) {
        const { error: drawingsError } = await (supabase as any)
          .from('drawings')
          .delete()
          .eq('whiteboard_id', this.id)

        if (drawingsError) {
          throw new Error(`Failed to clear drawings: ${drawingsError.message}`)
        }
      }

      // Clear sticky notes individually to ensure real-time events are triggered
      const { data: stickyNotes } = await (supabase as any)
        .from('sticky_notes')
        .select('id')
        .eq('whiteboard_id', this.id)

      if (stickyNotes && stickyNotes.length > 0) {
        const { error: stickyNotesError } = await (supabase as any)
          .from('sticky_notes')
          .delete()
          .eq('whiteboard_id', this.id)

        if (stickyNotesError) {
          throw new Error(`Failed to clear sticky notes: ${stickyNotesError.message}`)
        }
      }

      console.log(`✅ Cleared whiteboard ${this.id}: ${drawings?.length || 0} drawings, ${stickyNotes?.length || 0} sticky notes`)
    } catch (error) {
      console.error('Error clearing whiteboard:', error)
      throw new Error(`Failed to clear whiteboard: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get active users on whiteboard
   * FR-006: User presence functionality
   */
  async getActiveUsers(): Promise<any[]> {
    const { data, error } = await (supabase as any).rpc('get_active_users', {
      whiteboard_uuid: this.id
    })

    if (error) {
      throw new Error(`Failed to get active users: ${error.message}`)
    }

    return data || []
  }

  /**
   * Validate create parameters
   */
  private static validateCreateParams(params: CreateWhiteboardParams): ValidationResult<CreateWhiteboardParams> {
    const errors: ValidationError[] = []

    if (!params.name || params.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        code: 'REQUIRED'
      })
    }

    if (params.name && params.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must be 100 characters or less',
        code: 'MAX_LENGTH'
      })
    }

    if (params.settings) {
      if (params.settings.width && (params.settings.width < 100 || params.settings.width > 10000)) {
        errors.push({
          field: 'settings.width',
          message: 'Width must be between 100 and 10000 pixels',
          code: 'RANGE'
        })
      }

      if (params.settings.height && (params.settings.height < 100 || params.settings.height > 10000)) {
        errors.push({
          field: 'settings.height',
          message: 'Height must be between 100 and 10000 pixels',
          code: 'RANGE'
        })
      }

      if (params.settings.backgroundColor && !params.settings.backgroundColor.match(/^#[0-9A-Fa-f]{6}$/)) {
        errors.push({
          field: 'settings.backgroundColor',
          message: 'Background color must be a valid hex color',
          code: 'FORMAT'
        })
      }
    }

    return {
      success: errors.length === 0,
      errors
    }
  }

  /**
   * Validate update parameters
   */
  private static validateUpdateParams(params: UpdateWhiteboardParams): ValidationResult<UpdateWhiteboardParams> {
    const errors: ValidationError[] = []

    if (params.name !== undefined) {
      if (!params.name || params.name.trim().length === 0) {
        errors.push({
          field: 'name',
          message: 'Name cannot be empty',
          code: 'REQUIRED'
        })
      }

      if (params.name.length > 100) {
        errors.push({
          field: 'name',
          message: 'Name must be 100 characters or less',
          code: 'MAX_LENGTH'
        })
      }
    }

    if (params.settings) {
      if (params.settings.width && (params.settings.width < 100 || params.settings.width > 10000)) {
        errors.push({
          field: 'settings.width',
          message: 'Width must be between 100 and 10000 pixels',
          code: 'RANGE'
        })
      }

      if (params.settings.height && (params.settings.height < 100 || params.settings.height > 10000)) {
        errors.push({
          field: 'settings.height',
          message: 'Height must be between 100 and 10000 pixels',
          code: 'RANGE'
        })
      }

      if (params.settings.backgroundColor && !params.settings.backgroundColor.match(/^#[0-9A-Fa-f]{6}$/)) {
        errors.push({
          field: 'settings.backgroundColor',
          message: 'Background color must be a valid hex color',
          code: 'FORMAT'
        })
      }
    }

    return {
      success: errors.length === 0,
      errors
    }
  }
}
