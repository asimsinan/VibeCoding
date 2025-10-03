/**
 * Attendee Management Service - Supabase Implementation
 * 
 * Provides comprehensive attendee management functionality using Supabase
 * 
 * @fileoverview Attendee Management Service for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { supabase } from '../../supabase'
import { Attendee, CreateAttendeeRequest, UpdateAttendeeRequest, AttendeeStatus } from '../../models/Attendee'

export class AttendeeService {
  private supabase = supabase

  constructor() {
    // No need to create new client - use shared instance
  }

  /**
   * Ensure user exists in our users table
   */
  private async ensureUserExists(userId: string): Promise<void> {
    try {
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (existingUser) {
        return
      }

      // If user doesn't exist, create them
      if (checkError && checkError.code === 'PGRST116') {
        
        // Get user info from auth
        const { data: authUser, error: authError } = await this.supabase.auth.getUser()
        
        if (authError || !authUser?.user) {
          throw new Error('User authentication failed')
        }

        if (authUser.user.id !== userId) {
          throw new Error('User ID mismatch')
        }

            // Create user in our users table
            const userName = authUser.user.user_metadata?.full_name || 
                           authUser.user.email?.split('@')[0] || 
                           'User'
            
            
            const userData = {
              id: userId,
              email: authUser.user.email || 'unknown@example.com',
              name: userName
            }


        const { data: newUser, error: insertError } = await this.supabase
          .from('users')
          .insert(userData as any)
          .select()
          .single()

        if (insertError) {
          throw new Error(`Failed to create user: ${insertError.message}`)
        }

      } else if (checkError) {
        throw new Error(`Failed to check user existence: ${checkError.message}`)
      }
    } catch (error) {
      throw new Error(`Failed to ensure user exists: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Register attendee for event
   */
  async registerAttendee(attendeeData: CreateAttendeeRequest): Promise<Attendee> {
    try {
      
      // First, ensure the user exists in our users table
      await this.ensureUserExists(attendeeData.userId)

      // Check if event is at capacity
      const { data: eventData, error: eventError } = await this.supabase
        .from('events')
        .select('capacity')
        .eq('id', attendeeData.eventId)
        .single()

      if (eventError || !eventData) {
        throw new Error('Event not found')
      }

      // Get current attendee count
      const { count: currentAttendees } = await this.supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', attendeeData.eventId)
        .eq('status', 'registered')

      if ((currentAttendees || 0) >= (eventData as any).capacity) {
        throw new Error('Event is at full capacity. Registration is no longer available.')
      }

      // Check if user is already registered for this event
      const { data: existingRegistration, error: checkError } = await this.supabase
        .from('attendees') // Try attendees table first
        .select('id, status')
        .eq('event_id', attendeeData.eventId)
        .eq('user_id', attendeeData.userId)
        .single()

      if (existingRegistration) {
        throw new Error('You are already registered for this event')
      }

      // If no existing registration found (checkError.code === 'PGRST116' means no rows found)
      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Failed to check existing registration: ${checkError.message}`)
      }

      const attendee: Attendee = {
        id: crypto.randomUUID(), // Use proper UUID format
        eventId: attendeeData.eventId,
        userId: attendeeData.userId,
        type: attendeeData.type || 'attendee',
        status: 'registered' as AttendeeStatus,
        registrationDate: new Date().toISOString(),
        metadata: {
          ...attendeeData.metadata,
          customFields: {
            ...attendeeData.metadata?.customFields
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('attendees')
        .insert({
          id: attendee.id,
          event_id: attendee.eventId,
          user_id: attendee.userId,
          status: attendee.status,
          registration_date: attendee.registrationDate,
          metadata: attendee.metadata
        } as any)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }


      return attendee
    } catch (error) {
      throw new Error(`Failed to register attendee: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if user is already registered for an event
   */
  async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check registration: ${error.message}`)
      }

      return !!data
    } catch (error) {
      return false
    }
  }

  /**
   * Get all attendees for a specific user
   */
  async getAttendeesByUser(userId: string): Promise<Attendee[]> {
    try {
      const { data, error } = await this.supabase
        .from('attendees')
        .select('*')
        .eq('user_id', userId)
        .order('registration_date', { ascending: false })

      if (error) {
        return [] // Return empty array instead of throwing
      }

      // Ensure data is an array
      if (!data || !Array.isArray(data)) {
        return []
      }

      return data.map(row => {
        try {
          return this.mapRowToAttendee(row)
        } catch (mapError) {
          // Return a minimal attendee object to prevent the whole operation from failing
          return {
            id: (row as any).id || 'unknown',
            eventId: (row as any).event_id || 'unknown',
            userId: (row as any).user_id || 'unknown',
            status: (row as any).status || 'registered',
            type: (row as any).type || 'attendee',
            registrationDate: (row as any).registration_date || new Date().toISOString(),
            checkInDate: (row as any).check_in_date,
            checkOutDate: (row as any).check_out_date,
            metadata: {
              customFields: {},
              notes: (row as any).notes || ''
            },
            createdAt: (row as any).created_at || new Date().toISOString(),
            updatedAt: (row as any).updated_at || new Date().toISOString()
          }
        }
      })
    } catch (error) {
      return [] // Return empty array instead of throwing
    }
  }

  /**
   * Get attendee by ID
   */
  async getAttendeeById(attendeeId: string): Promise<Attendee | null> {
    try {
      const { data, error } = await this.supabase
        .from('attendees')
        .select('*')
        .eq('id', attendeeId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToAttendee(data)
    } catch (error) {
      throw new Error(`Failed to get attendee: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update attendee
   */
  async updateAttendee(attendeeId: string, updateData: UpdateAttendeeRequest): Promise<Attendee> {
    try {
      const updateFields: any = {}
      
      if (updateData.status !== undefined) updateFields.status = updateData.status
      if (updateData.metadata !== undefined) updateFields.metadata = updateData.metadata
      if (updateData.checkInDate !== undefined) updateFields.check_in_date = updateData.checkInDate
      if (updateData.checkOutDate !== undefined) updateFields.check_out_date = updateData.checkOutDate

      updateFields.updated_at = new Date().toISOString()

      const { data, error } = await (this.supabase as any)
        .from('attendees')
        .update(updateFields)
        .eq('id', attendeeId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToAttendee(data)
    } catch (error) {
      throw new Error(`Failed to update attendee: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check in attendee
   */
  async checkInAttendee(attendeeId: string): Promise<Attendee> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('attendees')
        .update({
          status: 'checked_in',
          check_in_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attendeeId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToAttendee(data)
    } catch (error) {
      throw new Error(`Failed to check in attendee: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check out attendee
   */
  async checkOutAttendee(attendeeId: string): Promise<Attendee> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('attendees')
        .update({
          status: 'checked_out',
          check_out_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attendeeId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToAttendee(data)
    } catch (error) {
      throw new Error(`Failed to check out attendee: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List event attendees
   */
  async listEventAttendees(eventId: string, filters: {
    status?: AttendeeStatus
    page?: number
    limit?: number
  } = {}): Promise<{
    data: Attendee[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const {
        status,
        page = 1,
        limit = 20
      } = filters

      let query = this.supabase
        .from('attendees')
        .select('*', { count: 'exact' })
        .eq('event_id', eventId)

      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Order by registration date
      query = query.order('registration_date', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const attendees = data.map((row: any) => this.mapRowToAttendee(row))

      return {
        data: attendees,
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      throw new Error(`Failed to list event attendees: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get attendee count for event
   */
  async getEventAttendeeCount(eventId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      throw new Error(`Failed to get attendee count: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Cancel attendee registration
   */
  async cancelAttendeeRegistration(attendeeId: string): Promise<boolean> {
    try {
      const { error } = await (this.supabase as any)
        .from('attendees')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', attendeeId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return true
    } catch (error) {
      throw new Error(`Failed to cancel attendee registration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Map database row to Attendee object
   */
  private mapRowToAttendee(row: any): Attendee {
    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      status: row.status,
      type: row.type || 'attendee',
      registrationDate: row.registration_date,
      checkInDate: row.check_in_date,
      checkOutDate: row.check_out_date,
      metadata: {
        ...row.metadata,
        customFields: {
          ...row.metadata?.customFields,
          notes: row.notes || ''
        }
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export default AttendeeService