/**
 * Statistics Hook
 * 
 * React hook for fetching and managing real-time statistics
 * 
 * @fileoverview Statistics Hook for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { statisticsService, EventStats, SessionStats, AttendeeStats, MessageStats, ConnectionStats } from '../services/StatisticsService'

export interface UseStatisticsOptions {
  eventId?: string
  refreshInterval?: number
  autoRefresh?: boolean
}

export interface StatisticsData {
  eventStats: EventStats
  sessionStats: SessionStats
  attendeeStats: AttendeeStats
  messageStats: MessageStats
  connectionStats: ConnectionStats
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refetch: () => Promise<void>
}

export function useStatistics(options: UseStatisticsOptions = {}): StatisticsData {
  const { eventId, refreshInterval = 30000, autoRefresh = true } = options
  
  const [data, setData] = useState<StatisticsData>({
    eventStats: {
      totalAttendees: 0,
      onlineAttendees: 0,
      totalMessages: 0,
      totalSessions: 0,
      totalEvents: 0,
      activeConnections: 0
    },
    sessionStats: {
      totalSessions: 0,
      liveSessions: 0,
      completedSessions: 0,
      upcomingSessions: 0
    },
    attendeeStats: {
      totalAttendees: 0,
      onlineAttendees: 0,
      registeredToday: 0,
      activeAttendees: 0
    },
    messageStats: {
      totalMessages: 0,
      messagesToday: 0,
      averageResponseTime: 0,
      activeConversations: 0
    },
    connectionStats: {
      activeConnections: 0,
      totalConnections: 0,
      averageConnectionTime: 0,
      peakConnections: 0
    },
    isLoading: true,
    error: null,
    lastUpdated: null,
    refetch: async () => {} // Placeholder function
  })

  const fetchStatistics = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      const [
        eventStats,
        sessionStats,
        attendeeStats,
        messageStats,
        connectionStats
      ] = await Promise.all([
        statisticsService.getEventStats(eventId),
        statisticsService.getSessionStats(eventId),
        statisticsService.getAttendeeStats(eventId),
        statisticsService.getMessageStats(eventId),
        statisticsService.getConnectionStats(eventId)
      ])

      setData(prev => ({
        ...prev,
        eventStats,
        sessionStats,
        attendeeStats,
        messageStats,
        connectionStats,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      }))
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      }))
    }
  }, [eventId])

  // Initial fetch
  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchStatistics, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchStatistics, refreshInterval, autoRefresh])

  return {
    ...data,
    refetch: fetchStatistics
  }
}

// Hook for specific event statistics
export function useEventStatistics(eventId: string, options: Omit<UseStatisticsOptions, 'eventId'> = {}) {
  return useStatistics({ ...options, eventId })
}

// Hook for global statistics
export function useGlobalStatistics(options: Omit<UseStatisticsOptions, 'eventId'> = {}) {
  return useStatistics(options)
}
