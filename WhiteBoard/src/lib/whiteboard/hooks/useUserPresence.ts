'use client'

import { useState, useCallback, useEffect } from 'react'
import { User } from '../models/User'
import { UserService } from '../services/userService'
import { useRealtimeSync } from './useRealtimeSync'

interface UseUserPresenceReturn {
  users: User[]
  updatePresence: (updates?: Partial<User>) => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * useUserPresence Hook
 * 
 * Custom hook for managing user presence and collaboration state.
 * Provides real-time user tracking and presence updates.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @param userId - Current user identifier
 * @returns User presence state and operations
 */
export const useUserPresence = (whiteboardId: string, userId: string): UseUserPresenceReturn => {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { subscribeToUsers, unsubscribeFromUsers } = useRealtimeSync(whiteboardId)

  // Load users from service
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const usersData = await UserService.getActiveUsersForWhiteboard(whiteboardId)
      setUsers(usersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [whiteboardId])

  // Update user presence
  const updatePresence = useCallback(async (updates?: Partial<User>) => {
    try {
      setError(null)
      const presenceData = {
        id: userId,
        whiteboardId,
        lastSeen: new Date().toISOString(),
        ...updates
      }
      
      await UserService.updateUserPresence(userId, presenceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update presence')
    }
  }, [whiteboardId, userId])

  // Load users on mount
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Subscribe to real-time updates
  useEffect(() => {
    subscribeToUsers()
    return () => unsubscribeFromUsers()
  }, [subscribeToUsers, unsubscribeFromUsers])

  // Update presence periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updatePresence()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [updatePresence])

  return {
    users,
    updatePresence,
    isLoading,
    error
  }
}

export default useUserPresence