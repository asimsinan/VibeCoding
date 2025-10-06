/**
 * User Domain Model
 * Core business logic for user entities
 * 
 * @fileoverview User domain model with validation and business rules
 * @version 1.0.0
 */

import { User as UserType, Position, UpdateUserPresenceParams } from '@/contracts/types/domain'
import { supabase } from '@/lib/supabase/client'
import { ValidationResult, ValidationError } from '@/contracts/types/domain'

export class User implements UserType {
  readonly id: string
  readonly displayName: string
  readonly lastSeen: Date
  readonly cursorPosition?: Position
  readonly whiteboardId: string
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(
    id: string,
    displayName: string,
    lastSeen: Date,
    cursorPosition: Position | undefined,
    whiteboardId: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id
    this.displayName = displayName
    this.lastSeen = lastSeen
    this.cursorPosition = cursorPosition
    this.whiteboardId = whiteboardId
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  /**
   * Create or update user
   * FR-006: User management functionality
   */
  static async upsert(id: string, displayName: string): Promise<User> {
    const validation = User.validateUserData(id, displayName)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.map((e: ValidationError) => e.message).join(', ') || 'Unknown validation error'}`)
    }

    const { data, error } = await (supabase as any)
      .from('users')
      .upsert({
        id,
        display_name: displayName,
        last_seen: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert user: ${error.message}`)
    }

    return new User(
      data.id,
      data.display_name,
      new Date(data.last_seen),
      data.cursor_position,
      data.whiteboard_id || '',
      new Date(data.created_at || data.last_seen),
      new Date(data.updated_at || data.last_seen)
    )
  }

  /**
   * Get user by ID
   * FR-006: Retrieve user functionality
   */
  static async getById(id: string): Promise<User | null> {
    const { data, error } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get user: ${error.message}`)
    }

    return new User(
      data.id,
      data.display_name,
      new Date(data.last_seen),
      data.cursor_position,
      data.whiteboard_id || '',
      new Date(data.created_at || data.last_seen),
      new Date(data.updated_at || data.last_seen)
    )
  }

  /**
   * Update user presence
   * FR-006: Update user presence functionality
   */
  async updatePresence(params: UpdateUserPresenceParams): Promise<User> {
    const validation = User.validatePresenceParams(params)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.map((e: ValidationError) => e.message).join(', ') || 'Unknown validation error'}`)
    }

    const updateData: any = {
      last_seen: new Date().toISOString()
    }

    if (params.cursorPosition !== undefined) {
      updateData.cursor_position = params.cursorPosition
    }

    const { data, error } = await (supabase as any)
      .from('users')
      .update(updateData)
      .eq('id', this.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user presence: ${error.message}`)
    }

    return new User(
      data.id,
      data.display_name,
      new Date(data.last_seen),
      data.cursor_position,
      data.whiteboard_id || '',
      new Date(data.created_at || data.last_seen),
      new Date(data.updated_at || data.last_seen)
    )
  }

  /**
   * Get active users
   * FR-006: Get active users functionality
   */
  static async getActiveUsers(): Promise<User[]> {
    const { data, error } = await (supabase as any)
      .from('users')
      .select('*')
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('last_seen', { ascending: false })

    if (error) {
      throw new Error(`Failed to get active users: ${error.message}`)
    }

    return data.map((user: any) => new User(
      user.id,
      user.display_name,
      new Date(user.last_seen),
      user.cursor_position,
      user.whiteboard_id || '',
      new Date(user.created_at),
      new Date(user.updated_at)
    ))
  }

  /**
   * Get active users for whiteboard
   * FR-006: Get active users for whiteboard functionality
   */
  static async getActiveUsersForWhiteboard(whiteboardId: string): Promise<User[]> {
    const { data, error } = await (supabase as any).rpc('get_active_users', {
      whiteboard_uuid: whiteboardId
    })

    if (error) {
      throw new Error(`Failed to get active users for whiteboard: ${error.message}`)
    }

    return data.map((user: any) => new User(
      user.id,
      user.display_name,
      new Date(user.last_seen),
      user.cursor_position,
      user.whiteboard_id || '',
      new Date(user.created_at || user.last_seen),
      new Date(user.updated_at || user.last_seen)
    ))
  }

  /**
   * Validate user data
   */
  private static validateUserData(id: string, displayName: string): ValidationResult<{id: string, displayName: string}> {
    const errors: ValidationError[] = []

    if (!id || id.trim().length === 0) {
      errors.push({
        field: 'id',
        message: 'User ID is required',
        code: 'REQUIRED'
      })
    }

    if (!displayName || displayName.trim().length === 0) {
      errors.push({
        field: 'displayName',
        message: 'Display name is required',
        code: 'REQUIRED'
      })
    }

    if (displayName && displayName.length > 50) {
      errors.push({
        field: 'displayName',
        message: 'Display name must be 50 characters or less',
        code: 'MAX_LENGTH'
      })
    }

    return {
      success: errors.length === 0,
      errors
    }
  }

  /**
   * Validate presence parameters
   */
  private static validatePresenceParams(params: UpdateUserPresenceParams): ValidationResult<UpdateUserPresenceParams> {
    const errors: ValidationError[] = []

    if (params.cursorPosition !== undefined) {
      if (!params.cursorPosition.x || !params.cursorPosition.y) {
        errors.push({
          field: 'cursorPosition',
          message: 'Cursor position must have x and y coordinates',
          code: 'REQUIRED'
        })
      }

      if (params.cursorPosition.x !== undefined && typeof params.cursorPosition.x !== 'number') {
        errors.push({
          field: 'cursorPosition.x',
          message: 'X coordinate must be a number',
          code: 'TYPE'
        })
      }

      if (params.cursorPosition.y !== undefined && typeof params.cursorPosition.y !== 'number') {
        errors.push({
          field: 'cursorPosition.y',
          message: 'Y coordinate must be a number',
          code: 'TYPE'
        })
      }
    }

    return {
      success: errors.length === 0,
      errors
    }
  }
}
