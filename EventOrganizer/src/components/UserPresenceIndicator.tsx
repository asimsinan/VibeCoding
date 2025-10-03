'use client'

import React, { useState, useEffect } from 'react'
import { ServerPresenceTracker } from '@/lib/services/ServerPresenceTracker'
import { UserDisplayService, UserDisplayInfo } from '@/lib/services/UserDisplayService'

interface UserPresenceIndicatorProps {
  userId: string
  userName?: string
  showLastSeen?: boolean
  size?: 'sm' | 'md' | 'lg'
  eventId: string
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  userId,
  userName,
  showLastSeen = false,
  size = 'md',
  eventId
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<Date | null>(null)
  const [status, setStatus] = useState<'active' | 'idle' | 'away' | 'offline'>('offline')

  useEffect(() => {
    // Show presence indicator after a short delay
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2'
      case 'lg':
        return 'w-4 h-4'
      default:
        return 'w-3 h-3'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      case 'away':
        return 'bg-orange-500'
      case 'offline':
      default:
        return 'bg-gray-400'
    }
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!isVisible) return null

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className={`${getSizeClasses()} ${getStatusColor()} rounded-full`} />
        {isOnline && status === 'active' && (
          <div className={`${getSizeClasses()} ${getStatusColor()} rounded-full absolute top-0 left-0 animate-ping`} />
        )}
      </div>
      
      {userName && (
        <span className="text-sm text-gray-700">{userName}</span>
      )}
      
      {showLastSeen && lastSeen && (
        <span className="text-xs text-gray-500">
          {isOnline ? status : formatLastSeen(lastSeen)}
        </span>
      )}
    </div>
  )
}

// Online users list component
interface OnlineUsersListProps {
  eventId: string
  maxDisplay?: number
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  eventId,
  maxDisplay = 5
}) => {
  const [users, setUsers] = useState<any[]>([])
  const [userDisplayInfo, setUserDisplayInfo] = useState<Map<string, UserDisplayInfo>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const activeUsers = await ServerPresenceTracker.getActiveUsers(eventId)
        setUsers(activeUsers)
        
        // Get display info for all users
        const userIds = activeUsers.map(user => user.userId).filter(Boolean)
        if (userIds.length > 0) {
          const displayInfo = await UserDisplayService.getMultipleUserDisplayInfo(userIds)
          setUserDisplayInfo(displayInfo)
        }
        
        setError(null)
      } catch (err) {
        setError('Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
    
    // Refresh every 3 seconds for more real-time updates
    const interval = setInterval(fetchUsers, 3000)
    return () => clearInterval(interval)
  }, [eventId])

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Online Users</div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Online Users</div>
        <div className="text-sm text-red-500">Error: {error}</div>
      </div>
    )
  }

  const onlineCount = users.length
  const displayedUsers = users.slice(0, maxDisplay)

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">
        Online ({onlineCount})
      </div>
      
      <div className="space-y-1">
        {displayedUsers.map((user, index) => {
          const userId = user.userId
          const displayInfo = userId ? userDisplayInfo.get(userId) : null
          const displayName = displayInfo?.displayName || `User ${userId ? userId.slice(0, 8) : 'Unknown'}`
          
          return (
            <div key={userId || index} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700">
                {displayName}
              </span>
              <span className="text-xs text-gray-500">
                {user.status}
              </span>
            </div>
          )
        })}
      </div>
      
      {users.length === 0 && (
        <div className="text-sm text-gray-500">No users online</div>
      )}
      
      {users.length > maxDisplay && (
        <div className="text-xs text-gray-500">
          +{users.length - maxDisplay} more
        </div>
      )}
    </div>
  )
}

// Real-time activity feed component
interface ActivityFeedProps {
  eventId: string
  maxItems?: number
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  eventId,
  maxItems = 10
}) => {
  const [activities, setActivities] = useState<any[]>([])
  const [userDisplayInfo, setUserDisplayInfo] = useState<Map<string, UserDisplayInfo>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        // For now, create some mock activity data based on online users
        const activeUsers = await ServerPresenceTracker.getActiveUsers(eventId)
        const mockActivities = activeUsers.map((user, index) => ({
          id: `activity_${user.userId}_${Date.now()}_${index}`,
          userId: user.userId,
          type: 'join',
          message: `joined the event`,
          timestamp: new Date().toISOString()
        }))
        setActivities(mockActivities.slice(0, maxItems))
        
        // Get display info for all users
        const userIds = activeUsers.map(user => user.userId).filter(Boolean)
        if (userIds.length > 0) {
          const displayInfo = await UserDisplayService.getMultipleUserDisplayInfo(userIds)
          setUserDisplayInfo(displayInfo)
        }
        
        setError(null)
      } catch (err) {
        setError('Failed to fetch activities')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
    
    // Refresh every 5 seconds for more real-time updates
    const interval = setInterval(fetchActivities, 5000)
    return () => clearInterval(interval)
  }, [eventId, maxItems])

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Recent Activity</div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Recent Activity</div>
        <div className="text-sm text-red-500">Error: {error}</div>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'join':
        return '👋'
      case 'leave':
        return '👋'
      case 'message':
        return '💬'
      case 'update':
        return '✏️'
      case 'view':
        return '👁️'
      case 'interact':
        return '🤝'
      default:
        return '📝'
    }
  }

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">
        Recent Activity
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-sm text-gray-500">No recent activity</div>
        ) : (
          activities.map(activity => {
            const displayInfo = activity.userId ? userDisplayInfo.get(activity.userId) : null
            const displayName = displayInfo?.displayName || `User ${activity.userId ? activity.userId.slice(0, 8) : 'Unknown'}`
            
            return (
              <div key={activity.id} className="flex items-start space-x-2 text-sm">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1">
                  <div>
                    <span className="font-medium">{displayName}</span>
                    <span className="text-gray-600"> {activity.message || activity.type}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
