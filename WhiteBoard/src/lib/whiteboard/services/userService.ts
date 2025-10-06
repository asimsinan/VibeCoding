/**
 * User Service
 * Business logic for user operations and presence tracking
 * 
 * @fileoverview User service with presence management and cursor tracking
 * @version 1.0.0
 */

import { User } from '../models/User'
import { UpdateUserPresenceParams, Position } from '@/contracts/types/domain'
import { whiteboardApi } from '@/lib/api/whiteboardApi'
import { supabase } from '@/lib/supabase/client'

export class UserService {
  /**
   * Create or update user
   * FR-006: User management functionality
   */
  static async upsertUser(id: string, displayName: string): Promise<User> {
    return await User.upsert(id, displayName)
  }

  /**
   * Get user by ID
   * FR-006: Retrieve user functionality
   */
  static async getUser(id: string): Promise<User | null> {
    return await User.getById(id)
  }

  /**
   * Update user presence
   * FR-006: Update user presence functionality
   */
  static async updateUserPresence(id: string, params: UpdateUserPresenceParams): Promise<User> {
    const user = await User.getById(id)
    if (!user) {
      throw new Error('User not found')
    }
    return await user.updatePresence(params)
  }

  /**
   * Get active users
   * FR-006: Get active users functionality
   */
  static async getActiveUsers(whiteboardId?: string): Promise<User[]> {
    try {
      if (whiteboardId) {
        const response = await whiteboardApi.getActiveUsers(whiteboardId)
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to get active users')
        }

        return response.data
      }
      
      // Fallback to direct database access for global active users
      return await User.getActiveUsers()
    } catch (error) {
      console.error('Error getting active users:', error)
      throw error
    }
  }

  /**
   * Get active users for whiteboard
   * FR-006: Get active users for whiteboard functionality
   */
  static async getActiveUsersForWhiteboard(whiteboardId: string): Promise<User[]> {
    return await User.getActiveUsersForWhiteboard(whiteboardId)
  }

  /**
   * Update user cursor position
   * FR-006: Cursor tracking functionality
   */
  static async updateCursorPosition(userId: string, position: Position): Promise<User> {
    return await this.updateUserPresence(userId, { cursorPosition: position })
  }

  /**
   * Update user last seen timestamp
   * FR-006: User activity tracking
   */
  static async updateLastSeen(userId: string): Promise<User> {
    return await this.updateUserPresence(userId, {})
  }

  /**
   * Get user activity status
   * Determines if user is active based on last seen timestamp
   */
  static isUserActive(user: User, thresholdMinutes: number = 5): boolean {
    const now = new Date()
    const lastSeen = new Date(user.lastSeen)
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    return diffMinutes <= thresholdMinutes
  }

  /**
   * Get users by activity status
   * Filters users based on activity
   */
  static getUsersByActivity(users: User[], active: boolean = true): User[] {
    return users.filter(user => this.isUserActive(user) === active)
  }

  /**
   * Get user count by activity
   * Returns count of active/inactive users
   */
  static getUserCountByActivity(users: User[], active: boolean = true): number {
    return this.getUsersByActivity(users, active).length
  }

  /**
   * Get user display name
   * Returns display name or fallback
   */
  static getUserDisplayName(user: User): string {
    return user.displayName || `User ${user.id.slice(0, 8)}`
  }

  /**
   * Get user initials
   * Returns initials from display name
   */
  static getUserInitials(user: User): string {
    const displayName = this.getUserDisplayName(user)
    const words = displayName.trim().split(/\s+/)
    
    if (words.length === 1) {
      return words[0]?.slice(0, 2).toUpperCase() || 'U'
    }
    
    return words
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
  }

  /**
   * Get user color
   * Returns consistent color for user based on ID
   */
  static getUserColor(user: User): string {
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
   * Returns avatar URL or generates one
   */
  static getUserAvatarUrl(user: User): string {
    // This would typically return a real avatar URL
    // For now, return a placeholder
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getUserDisplayName(user))}&background=${this.getUserColor(user).slice(1)}&color=fff`
  }

  /**
   * Validate user session
   * Checks if user session is valid
   */
  static async validateUserSession(userId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId)
      return user !== null && this.isUserActive(user)
    } catch (error) {
      return false
    }
  }

  /**
   * Clean up inactive users
   * Removes users who haven't been active for a while
   */
  static async cleanupInactiveUsers(thresholdHours: number = 24): Promise<void> {
    const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000)
    
    const { error } = await supabase
      .from('users')
      .delete()
      .lt('last_seen', threshold.toISOString())

    if (error) {
      throw new Error(`Failed to cleanup inactive users: ${error.message}`)
    }
  }

  /**
   * Get user statistics
   * Returns statistics about users
   */
  static getUserStatistics(users: User[]): {
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

  /**
   * Broadcast user presence update
   * Notifies other users of presence changes
   */
  static async broadcastPresenceUpdate(
    whiteboardId: string,
    userId: string,
    presenceData: any
  ): Promise<void> {
    // This would typically use a real-time service
    // For now, we'll just log it
    console.log(`Broadcasting presence update for user ${userId} on whiteboard ${whiteboardId}:`, presenceData)
  }
}

// Export a singleton instance
export const userService = new UserService()
export default userService
