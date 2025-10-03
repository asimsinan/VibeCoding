/**
 * User Display Service
 * 
 * Service for getting user display names and formatting them properly
 * 
 * @fileoverview User Display Service for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { supabase } from '@/lib/supabase'

export interface UserDisplayInfo {
  id: string
  displayName: string
  email?: string
  fullName?: string
  avatarUrl?: string
}

export class UserDisplayService {
  private static userCache = new Map<string, UserDisplayInfo>()
  private static cacheExpiry = new Map<string, number>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get user display information
   */
  static async getUserDisplayInfo(userId: string): Promise<UserDisplayInfo> {
    // Check cache first
    const cached = this.getCachedUser(userId)
    if (cached) {
      return cached
    }

    try {
      // Get user from database
            const { data: user, error } = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', userId)
              .single()

      if (error) {
        // Fallback to email-based display name
        return this.createFallbackDisplayInfo(userId)
      }

      if (!user) {
        // Try to get name from auth user metadata as fallback
        try {
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser?.user?.id === userId) {
            const fallbackName = authUser.user.user_metadata?.full_name || 
                               authUser.user.email?.split('@')[0] || 
                               'User'
            return {
              id: userId,
              displayName: fallbackName,
              email: authUser.user.email || undefined,
              avatarUrl: undefined
            }
          }
        } catch (error) {
        }
        return this.createFallbackDisplayInfo(userId)
      }


      // If user.name is empty or null, try to get from auth metadata
      let displayName = this.formatDisplayName(user.name, user.email)
      if (!user.name || user.name.trim() === '') {
        try {
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser?.user?.id === userId) {
            const fallbackName = authUser.user.user_metadata?.full_name || 
                               authUser.user.email?.split('@')[0] || 
                               'User'
            displayName = fallbackName
          }
        } catch (error) {
        }
      }

      const displayInfo: UserDisplayInfo = {
        id: user.id,
        displayName: displayName,
        email: user.email,
        avatarUrl: undefined
      }


      // Cache the result
      this.cacheUser(userId, displayInfo)
      return displayInfo

    } catch (error) {
      return this.createFallbackDisplayInfo(userId)
    }
  }

  /**
   * Get multiple user display information
   */
  static async getMultipleUserDisplayInfo(userIds: string[]): Promise<Map<string, UserDisplayInfo>> {
    const result = new Map<string, UserDisplayInfo>()
    const uncachedIds: string[] = []

    // Check cache for each user
    for (const userId of userIds) {
      const cached = this.getCachedUser(userId)
      if (cached) {
        result.set(userId, cached)
      } else {
        uncachedIds.push(userId)
      }
    }

    if (uncachedIds.length === 0) {
      return result
    }

    try {
      // Fetch uncached users from database
              const { data: users, error } = await supabase
                .from('users')
                .select('id, email, name')
                .in('id', uncachedIds)

      if (error) {
        // Create fallback for all uncached users
        for (const userId of uncachedIds) {
          result.set(userId, this.createFallbackDisplayInfo(userId))
        }
        return result
      }

      // Process fetched users
      for (const user of users || []) {
        // If user.name is empty or null, try to get from auth metadata
        let displayName = this.formatDisplayName(user.name, user.email)
        if (!user.name || user.name.trim() === '') {
          try {
            const { data: authUser } = await supabase.auth.getUser()
            if (authUser?.user?.id === user.id) {
              const fallbackName = authUser.user?.user_metadata?.full_name || 
                                 authUser.user?.email?.split('@')[0] || 
                                 'User'
              displayName = fallbackName
            }
          } catch (error) {
          }
        }
        
        const displayInfo: UserDisplayInfo = {
          id: user.id,
          displayName: displayName,
          email: user.email,
          avatarUrl: undefined
        }
        result.set(user.id, displayInfo)
        this.cacheUser(user.id, displayInfo)
      }

      // Create fallback for any missing users
      for (const userId of uncachedIds) {
        if (!result.has(userId)) {
          result.set(userId, this.createFallbackDisplayInfo(userId))
        }
      }

      return result

    } catch (error) {
      // Create fallback for all uncached users
      for (const userId of uncachedIds) {
        result.set(userId, this.createFallbackDisplayInfo(userId))
      }
      return result
    }
  }

  /**
   * Format display name from full name and email
   */
  private static formatDisplayName(fullName?: string, email?: string): string {
    
    if (fullName && fullName.trim()) {
      return fullName.trim()
    }

    if (email) {
      // Extract name from email (part before @)
      const emailName = email.split('@')[0]
      // Convert to title case
      const formattedName = emailName
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
      return formattedName
    }

    return 'Anonymous User'
  }

  /**
   * Create fallback display info when user data is not available
   */
  private static createFallbackDisplayInfo(userId: string): UserDisplayInfo {
    return {
      id: userId,
      displayName: `User ${userId.slice(0, 8)}`,
      email: 'unknown@example.com',
      fullName: undefined,
      avatarUrl: undefined
    }
  }

  /**
   * Get cached user info
   */
  private static getCachedUser(userId: string): UserDisplayInfo | null {
    const expiry = this.cacheExpiry.get(userId)
    if (expiry && Date.now() < expiry) {
      return this.userCache.get(userId) || null
    }
    return null
  }

  /**
   * Cache user info
   */
  private static cacheUser(userId: string, userInfo: UserDisplayInfo): void {
    this.userCache.set(userId, userInfo)
    this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION)
  }

  /**
   * Clear cache for a specific user
   */
  static clearUserCache(userId: string): void {
    this.userCache.delete(userId)
    this.cacheExpiry.delete(userId)
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    this.userCache.clear()
    this.cacheExpiry.clear()
  }
}
