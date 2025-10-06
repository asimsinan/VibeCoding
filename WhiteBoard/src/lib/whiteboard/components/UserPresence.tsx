'use client'

import React, { useEffect, useState } from 'react'
import { useUserPresence } from '../hooks/useUserPresence'

interface UserPresenceProps {
  whiteboardId: string
  currentUserId: string
  className?: string
}

/**
 * UserPresence Component
 * 
 * Displays active users on the whiteboard with their cursors and presence indicators.
 * Shows real-time user activity and collaboration status.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @param currentUserId - Current user identifier
 * @param className - Additional CSS classes
 */
export const UserPresence: React.FC<UserPresenceProps> = ({
  whiteboardId,
  currentUserId,
  className = ''
}) => {
  const { users, updatePresence } = useUserPresence(whiteboardId, currentUserId)
  const [isVisible, setIsVisible] = useState(true)

  // Update presence periodically with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const debouncedUpdatePresence = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updatePresence()
      }, 1000) // Debounce by 1 second
    }

    const interval = setInterval(debouncedUpdatePresence, 5000) // Update every 5 seconds

    return () => {
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [updatePresence])

  // Handle mouse movement for cursor tracking with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const handleMouseMove = (event: MouseEvent) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updatePresence({
          cursorPosition: {
            x: event.clientX,
            y: event.clientY
          }
        })
      }, 100) // Debounce mouse movements by 100ms
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(timeoutId)
    }
  }, [updatePresence])

  // Get user color based on user ID
  const getUserColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#F8BBD9', '#A8E6CF'
    ]
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length] || '#FF6B6B'
  }

  // Get user initials
  const getUserInitials = (displayName: string): string => {
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Filter out current user and check if user is active (last seen within 5 minutes)
  const otherUsers = users.filter(user => {
    const isActive = user.lastSeen && (Date.now() - user.lastSeen.getTime()) < 5 * 60 * 1000
    return user.id !== currentUserId && isActive
  })

  if (otherUsers.length === 0) {
    return null
  }

  return (
    <div className={`user-presence ${className}`}>
      {/* User Count Badge */}
      {isVisible && (
        <div className="fixed top-4 left-4 z-40 px-3 py-2 bg-blue-500 text-white rounded-lg shadow-md text-sm font-medium">
          {otherUsers.length + 1} user{otherUsers.length !== 0 ? 's' : ''} online
        </div>
      )}

      {/* User List */}
      {isVisible && (
        <div className="fixed top-16 left-4 z-40 flex flex-col gap-2">
          {otherUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200"
            >
              {/* User Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: getUserColor(user.id) }}
              >
                {getUserInitials(user.displayName)}
              </div>
              
              {/* User Info */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {user.displayName}
                </span>
                <span className="text-xs text-gray-500">
                  Active
                </span>
              </div>

              {/* Status Indicator */}
              <div
                className="w-3 h-3 rounded-full bg-green-500"
                title="Active"
              />
            </div>
          ))}
        </div>
      )}

      {/* Cursor Overlays */}
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none">
          {otherUsers.map(user => (
            user.cursorPosition && (
              <div
                key={`cursor-${user.id}`}
                className="absolute pointer-events-none z-50"
                style={{
                  left: user.cursorPosition.x,
                  top: user.cursorPosition.y,
                  transform: 'translate(-2px, -2px)'
                }}
              >
                {/* Cursor */}
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: getUserColor(user.id) }}
                />
                
                {/* User Label */}
                <div
                  className="absolute top-6 left-0 bg-white rounded px-2 py-1 shadow-md text-xs font-medium whitespace-nowrap"
                  style={{ color: getUserColor(user.id) }}
                >
                  {user.displayName}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Toggle Visibility */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-4 right-4 z-40 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        title={isVisible ? 'Hide user presence' : 'Show user presence'}
      >
        <span className="text-lg">{isVisible ? '👥' : '👤'}</span>
      </button>
    </div>
  )
}

export default UserPresence