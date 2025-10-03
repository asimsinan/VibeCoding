'use client'

import React, { useState, useEffect } from 'react'
// import { useRealTime } from '@/lib/hooks/useRealTime'
import { useEventStatistics } from '@/lib/hooks/useStatistics'
import { ConnectionStatusIndicator } from './RealTimeNotificationProvider'
import { RealTimeEventUpdates, LiveAttendeeCounter, RealTimeChat } from './RealTimeEventUpdates'
import { UserPresenceIndicator, OnlineUsersList, ActivityFeed } from './UserPresenceIndicator'
import { connectionTracker } from '@/lib/services/ConnectionTracker'
import { ServerPresenceTracker } from '@/lib/services/ServerPresenceTracker'
import { EventService } from '@/lib/event-management/services/EventService'

interface RealTimeDashboardProps {
  eventId: string
  userId: string
}

export const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({
  eventId,
  userId
}) => {
  // const { isConnected, connectionStatus } = useRealTime()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const { 
    eventStats, 
    sessionStats, 
    attendeeStats, 
    messageStats, 
    connectionStats,
    isLoading: statsLoading,
    error: statsError,
    lastUpdated,
    refetch: refreshStats
  } = useEventStatistics(eventId, { refreshInterval: 2000 })
  const [eventData, setEventData] = useState<any>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'activity' | 'users'>('overview')
  
  const eventService = new EventService()

  // Test connection status
  useEffect(() => {
    const testConnection = async () => {
      try {
        setConnectionStatus('connecting')
        const { supabase } = await import('@/lib/supabase')
        
        // Test basic Supabase connection
        const { data, error } = await supabase.from('events').select('id').limit(1)
        
        if (error) {
          setConnectionStatus('error')
          setIsConnected(false)
        } else {
          setConnectionStatus('connected')
          setIsConnected(true)
        }
      } catch (err) {
        setConnectionStatus('error')
        setIsConnected(false)
      }
    }

    testConnection()
    
    // Test connection every 30 seconds
    const interval = setInterval(testConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Load event data
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setEventLoading(true)
        const event = await eventService.getEventById(eventId)
        setEventData(event)
      } catch (error) {
        setEventData(null)
      } finally {
        setEventLoading(false)
      }
    }

    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  // Track user connection to this event
  useEffect(() => {
    // Track connection when component mounts
    connectionTracker.trackConnection(userId, eventId)
    
    // Start server-side presence tracking
    ServerPresenceTracker.startTracking(eventId, userId)

    // Update last seen periodically
    const updateInterval = setInterval(() => {
      connectionTracker.updateLastSeen(userId, eventId)
      // ServerPresenceTracker handles its own heartbeat
    }, 30000) // Update every 30 seconds

    // Handle page unload
    const handleBeforeUnload = () => {
      ServerPresenceTracker.stopTracking(eventId, userId)
    }

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        ServerPresenceTracker.stopTracking(eventId, userId)
      } else {
        ServerPresenceTracker.startTracking(eventId, userId)
        // Force refresh stats when user returns to the page
        refreshStats()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup on unmount
    return () => {
      clearInterval(updateInterval)
      connectionTracker.removeConnection(userId, eventId)
      ServerPresenceTracker.stopTracking(eventId, userId)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, eventId])


  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'activity', label: 'Activity', icon: '📝' },
    { id: 'users', label: 'Users', icon: '👥' }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Event Dashboard</h1>
          <p className="text-gray-600">
            Live updates and interactions for {eventLoading ? 'Loading...' : eventData?.title || `Event #${eventId}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ConnectionStatusIndicator />
        </div>
      </div>

      {/* Connection Status Alert */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Connection Issue</h3>
              <p className="text-sm text-yellow-700">
                Real-time features are currently unavailable. Status: {connectionStatus}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Live Attendance */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Live Attendance</h3>
              <LiveAttendeeCounter 
                eventId={eventId} 
                initialCount={attendeeStats.onlineAttendees}
              />
            </div>

            {/* Full Width Event Updates */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Event Updates</h3>
                <div className="flex items-center space-x-2">
                  {statsLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  <button
                    onClick={refreshStats}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                    disabled={statsLoading}
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              {statsError ? (
                <div className="text-center text-red-600 text-sm bg-red-50 p-4 rounded-lg">
                  Error loading stats: {statsError}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Main Stats Grid - 2x2 Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Attendance Stats */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center shadow-sm">
                          <div className="text-4xl font-bold text-blue-600 mb-2">
                            {statsLoading ? '...' : eventStats.totalAttendees}
                          </div>
                          <div className="text-sm font-semibold text-blue-700 mb-1">Total Attendees</div>
                          <div className="text-xs text-blue-600">Registered users</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center shadow-sm">
                          <div className="text-4xl font-bold text-green-600 mb-2">
                            {statsLoading ? '...' : eventStats.onlineAttendees}
                          </div>
                          <div className="text-sm font-semibold text-green-700 mb-1">Online Now</div>
                          <div className="text-xs text-green-600">Currently active</div>
                        </div>
                      </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center shadow-sm">
                          <div className="text-4xl font-bold text-purple-600 mb-2">
                            {statsLoading ? '...' : eventStats.totalMessages}
                          </div>
                          <div className="text-sm font-semibold text-purple-700 mb-1">Messages Sent</div>
                          <div className="text-xs text-purple-600">In event chat</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Rate - Full Width */}
                  <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-3xl font-bold text-teal-600 mb-2">
                          {statsLoading ? '...' : Math.round((eventStats.onlineAttendees / Math.max(eventStats.totalAttendees, 1)) * 100)}%
                        </div>
                        <div className="text-lg font-semibold text-teal-700 mb-1">Engagement Rate</div>
                        <div className="text-sm text-teal-600">Percentage of attendees currently online</div>
                      </div>
                      <div className="w-16 h-16 bg-teal-200 rounded-full flex items-center justify-center ml-6">
                        <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                </div>
              )}
              
              {lastUpdated && (
                <div className="mt-4 text-xs text-gray-500 text-center bg-gray-50 px-3 py-2 rounded-md">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Event Chat</h3>
            <RealTimeChat eventId={eventId} userId={userId} />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <ActivityFeed eventId={eventId} maxItems={20} />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">User Presence</h3>
              <OnlineUsersList eventId={eventId} maxDisplay={10} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
