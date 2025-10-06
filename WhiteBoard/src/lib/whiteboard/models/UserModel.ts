/**
 * User Data Model
 * Comprehensive data model with validation and business rules
 * 
 * @fileoverview User data model with validation and business logic
 * @version 1.0.0
 */

import { z } from 'zod'

// Zod schemas for validation
export const PositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
})

export const UserDisplayNameSchema = z.string().min(1).max(50)

export const UpdateUserPresenceParamsSchema = z.object({
  cursorPosition: PositionSchema.optional()
})

export const UserSchema = z.object({
  id: z.string().uuid(),
  displayName: UserDisplayNameSchema,
  lastSeen: z.date(),
  cursorPosition: PositionSchema.optional()
})

// Type definitions
export type UserModel = z.infer<typeof UserSchema>
export type PositionModel = z.infer<typeof PositionSchema>
export type UpdateUserPresenceParamsModel = z.infer<typeof UpdateUserPresenceParamsSchema>

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

export class UserModelValidator {
  /**
   * Validate user display name
   */
  static validateDisplayName(displayName: string): ValidationResult {
    try {
      UserDisplayNameSchema.parse(displayName)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError && error.issues) {
        return {
          isValid: false,
          errors: error.issues.map(err => ({
            field: 'displayName',
            message: err.message,
            code: err.code
          }))
        }
      }
      return {
        isValid: false,
        errors: [{
          field: 'displayName',
          message: 'Invalid display name format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Validate user position
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
   * Validate update user presence parameters
   */
  static validateUpdatePresenceParams(params: UpdateUserPresenceParamsModel): ValidationResult {
    try {
      UpdateUserPresenceParamsSchema.parse(params)
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
   * Validate user data
   */
  static validateUser(user: Partial<UserModel>): ValidationResult {
    try {
      UserSchema.parse(user)
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
          field: 'user',
          message: 'Invalid user format',
          code: 'INVALID_FORMAT'
        }]
      }
    }
  }

  /**
   * Sanitize user data
   */
  static sanitizeUser(user: Partial<UserModel>): UserModel {
    const sanitized = {
      id: user.id || '',
      displayName: user.displayName || '',
      lastSeen: user.lastSeen || new Date(),
      cursorPosition: user.cursorPosition
    }

    return UserSchema.parse(sanitized)
  }

  /**
   * Check if user is active
   */
  static isUserActive(user: UserModel, thresholdMinutes: number = 5): boolean {
    const now = new Date()
    const lastSeen = new Date(user.lastSeen)
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    return diffMinutes <= thresholdMinutes
  }

  /**
   * Get users by activity status
   */
  static getUsersByActivity(users: UserModel[], active: boolean = true): UserModel[] {
    return users.filter(user => this.isUserActive(user) === active)
  }

  /**
   * Get user count by activity
   */
  static getUserCountByActivity(users: UserModel[], active: boolean = true): number {
    return this.getUsersByActivity(users, active).length
  }

  /**
   * Get user display name
   */
  static getUserDisplayName(user: UserModel): string {
    return user.displayName || `User ${user.id.slice(0, 8)}`
  }

  /**
   * Get user initials
   */
  static getUserInitials(user: UserModel): string {
    const displayName = this.getUserDisplayName(user)
    const words = displayName.trim().split(/\s+/)
    
    if (words.length === 1) {
      const firstWord = words[0]
      return firstWord ? firstWord.slice(0, 2).toUpperCase() : 'U'
    }
    
    return words
      .slice(0, 2)
      .map(word => word ? word.charAt(0) : '')
      .join('')
      .toUpperCase() || 'U'
  }

  /**
   * Get user color
   */
  static getUserColor(user: UserModel): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    
    // Use user ID to get consistent color
    const hash = user.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length] || '#FF6B6B'
  }

  /**
   * Get user avatar URL
   */
  static getUserAvatarUrl(user: UserModel): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getUserDisplayName(user))}&background=${this.getUserColor(user).slice(1)}&color=fff`
  }

  /**
   * Get user statistics
   */
  static getUserStatistics(users: UserModel[]): {
    total: number
    active: number
    inactive: number
    withCursor: number
  } {
    const active = this.getUsersByActivity(users, true)
    const inactive = this.getUsersByActivity(users, false)
    const withCursor = users.filter(user => user.cursorPosition !== undefined)

    return {
      total: users.length,
      active: active.length,
      inactive: inactive.length,
      withCursor: withCursor.length
    }
  }
}
