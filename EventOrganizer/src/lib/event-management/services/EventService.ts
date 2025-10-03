/**
 * Event Management Service - Supabase Implementation
 * 
 * Provides comprehensive event management functionality using Supabase
 * 
 * @fileoverview Event Management Service for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { supabase } from '../../supabase'
import { Event, CreateEventRequest, UpdateEventRequest, EventStatus } from '../../models/Event'

export class EventService {
  private supabase = supabase

  constructor() {
    // No need to create new client - use shared instance
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    try {
      // Ensure organizer exists in users table first
      let organizerId = eventData.organizerId
      
      if (!organizerId) {
        throw new Error('Organizer ID is required')
      }

      // Check if organizer exists in users table
      const { data: existingUser, error: userCheckError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', organizerId)
        .single()

      if (userCheckError && userCheckError.code !== 'PGRST116') {
      }

      if (!existingUser) {
        // Get authenticated user info
        const { data: authUser, error: authError } = await this.supabase.auth.getUser()
        
        if (authError || !authUser?.user) {
          throw new Error('User not authenticated')
        }

        // Create user record in users table
        const userName = authUser.user.user_metadata?.full_name || 
                        authUser.user.email?.split('@')[0] || 
                        'Demo User'
        
        
        const { data: newUser, error: userCreateError } = await this.supabase
          .from('users')
          .insert({
            id: organizerId,
            email: authUser.user.email || 'demo@demo.com',
            name: userName
          })
          .select()
          .single()

        if (userCreateError || !newUser) {
          throw new Error(`Failed to create user record: ${userCreateError?.message || 'Unknown error'}`)
        }

      }

      const event: Event = {
        id: crypto.randomUUID(),
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        metadata: {
          ...eventData.metadata,
          timezone: 'UTC',
          tags: []
        },
        capacity: eventData.capacity,
        attendeeCount: 0,
        type: eventData.type || 'conference',
        status: 'draft' as EventStatus,
        organizerId: organizerId,
        isPublic: eventData.isPublic ?? true,
        registrationOpen: eventData.registrationOpen ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Now create the event (organizer exists)
      const { error } = await this.supabase
        .from('events')
        .insert({
          id: event.id,
          title: event.title,
          description: event.description,
          start_date: event.startDate,
          end_date: event.endDate,
          capacity: event.capacity,
          status: event.status,
          organizer_id: event.organizerId,
          is_public: event.isPublic,
          metadata: event.metadata
        })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return event
    } catch (error) {
      throw new Error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<Event | null> {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return await this.mapRowToEvent(data)
    } catch (error) {
      throw new Error(`Failed to get event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, updateData: UpdateEventRequest, organizerId?: string): Promise<Event> {
    try {
      // If organizerId is provided, verify ownership
      if (organizerId) {
        const event = await this.getEventById(eventId)
        if (!event) {
          throw new Error('Event not found')
        }
        if (event.organizerId !== organizerId) {
          throw new Error('You do not have permission to update this event')
        }
      }

      const updateFields: any = {}
      
      if (updateData.title !== undefined) updateFields.title = updateData.title
      if (updateData.description !== undefined) updateFields.description = updateData.description
      if (updateData.startDate !== undefined) updateFields.start_date = updateData.startDate
      if (updateData.endDate !== undefined) updateFields.end_date = updateData.endDate
      if (updateData.capacity !== undefined) updateFields.capacity = updateData.capacity
      if (updateData.status !== undefined) updateFields.status = updateData.status
      if (updateData.isPublic !== undefined) updateFields.is_public = updateData.isPublic
      if (updateData.metadata !== undefined) updateFields.metadata = updateData.metadata

      updateFields.updated_at = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('events')
        .update(updateFields)
        .eq('id', eventId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return await this.mapRowToEvent(data)
    } catch (error) {
      throw new Error(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string, organizerId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('organizer_id', organizerId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return true
    } catch (error) {
      throw new Error(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List events with filtering and pagination
   */
  async listEvents(filters: {
    organizerId?: string
    status?: EventStatus
    isPublic?: boolean
    search?: string
    page?: number
    limit?: number
    userId?: string
  } = {}): Promise<{
    data: Event[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const {
        organizerId,
        status,
        isPublic,
        search,
        page = 1,
        limit = 20,
        userId
      } = filters

      let query = this.supabase
        .from('events')
        .select('*', { count: 'exact' })

      if (organizerId) {
        query = query.eq('organizer_id', organizerId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (isPublic !== undefined) {
        query = query.eq('is_public', isPublic)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Order by created_at desc
      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const events = await Promise.all(data.map((row: any) => this.mapRowToEvent(row)))

      return {
        data: events,
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      throw new Error(`Failed to list events: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update event status
   */
  async updateEventStatus(eventId: string, status: EventStatus, organizerId: string): Promise<Event> {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('organizer_id', organizerId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return await this.mapRowToEvent(data)
    } catch (error) {
      throw new Error(`Failed to update event status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId: string): Promise<{
    totalRegistrations: number
    totalAttendees: number
    attendanceRate: number
    registrationTrend: Array<{date: string, count: number}>
    attendeeDemographics: {
      byLocation: Array<{location: string, count: number}>
      byTimezone: Array<{timezone: string, count: number}>
    }
    engagementMetrics: {
      averageSessionAttendance: number
      networkingConnections: number
      messageCount: number
    }
  }> {
    try {
      // Get registration data
      const { count: totalRegistrations } = await this.supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      // Get attendance data
      const { count: totalAttendees } = await this.supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'checked_in')

      // Get registration trend (simplified)
      const { data: trendData } = await this.supabase
        .from('attendees')
        .select('created_at')
        .eq('event_id', eventId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      // Process trend data
      const trendMap = new Map<string, number>()
      trendData?.forEach((attendee: any) => {
        const date = attendee.created_at.split('T')[0]
        trendMap.set(date, (trendMap.get(date) || 0) + 1)
      })

      const registrationTrend = Array.from(trendMap.entries()).map(([date, count]) => ({
        date,
        count
      }))

      // Get attendee demographics (simplified)
      const { data: attendeesData } = await this.supabase
        .from('attendees')
        .select(`
          user_id,
          users!inner(timezone)
        `)
        .eq('event_id', eventId)

      const timezoneMap = new Map<string, number>()
      attendeesData?.forEach((attendee: any) => {
        const timezone = attendee.users?.timezone || 'UTC'
        timezoneMap.set(timezone, (timezoneMap.get(timezone) || 0) + 1)
      })

      const byTimezone = Array.from(timezoneMap.entries()).map(([timezone, count]) => ({
        timezone,
        count
      }))

      // Get engagement metrics (simplified)
      const { count: connectionsCount } = await this.supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'accepted')

      // Skip messages count since messages table doesn't exist
      const messagesCount = 0

      return {
        totalRegistrations: totalRegistrations || 0,
        totalAttendees: totalAttendees || 0,
        attendanceRate: (totalRegistrations || 0) > 0 ? ((totalAttendees || 0) / (totalRegistrations || 1)) * 100 : 0,
        registrationTrend,
        attendeeDemographics: {
          byLocation: [], // Simplified for now
          byTimezone
        },
        engagementMetrics: {
          averageSessionAttendance: 0, // Simplified for now
          networkingConnections: connectionsCount || 0,
          messageCount: messagesCount || 0
        }
      }
    } catch (error) {
      throw new Error(`Failed to get event analytics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if event is at capacity
   */
  async isEventAtCapacity(eventId: string): Promise<boolean> {
    try {
      const event = await this.getEventById(eventId)
      if (!event) {
        throw new Error('Event not found')
      }

      // Get current attendee count
      const { count } = await this.supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'registered')

      return (count || 0) >= event.capacity
    } catch (error) {
      throw new Error(`Failed to check event capacity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get waitlist for event
   */
  async getEventWaitlist(eventId: string): Promise<Array<{
    userId: string
    position: number
    requestedAt: string
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('event_waitlist')
        .select('user_id, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data.map((row: any, index: number) => ({
        userId: row.user_id,
        position: index + 1,
        requestedAt: row.created_at
      }))
    } catch (error) {
      throw new Error(`Failed to get event waitlist: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Map database row to Event object
   */
  private async mapRowToEvent(row: any): Promise<Event> {
    // Get actual attendee count from attendees table (try both table names)
    let attendeeCount = 0
    try {
      // First try 'attendees' table (from database/schema.sql)
      const { count } = await this.supabase
        .from('attendees')
        .select('id', { count: 'exact' })
        .eq('event_id', row.id)
      
      attendeeCount = count || 0
    } catch (error) {
      
      try {
        // Fallback to 'event_attendees' table
        const { count } = await this.supabase
          .from('event_attendees')
          .select('id', { count: 'exact' })
          .eq('event_id', row.id)
        
        attendeeCount = count || 0
      } catch (fallbackError) {
        attendeeCount = 0
      }
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      capacity: row.capacity,
      attendeeCount: attendeeCount, // Use real count from database
      type: row.type || 'conference',
      status: row.status,
      organizerId: row.organizer_id,
      isPublic: row.is_public,
      registrationOpen: row.registration_open ?? true, // Default to true if column doesn't exist
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export default EventService