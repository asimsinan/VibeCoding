/**
 * Session Management Service - Supabase Implementation
 * 
 * Provides comprehensive session management functionality using Supabase
 * 
 * @fileoverview Session Management Service for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { supabase } from '../../supabase'
import { Session, CreateSessionRequest, UpdateSessionRequest, SessionStatus } from '../../models/Session'

export class SessionService {
  private supabase = supabase

  constructor() {
    // No need to create new client - use shared instance
  }

  /**
   * Create a new session
   */
  async createSession(sessionData: CreateSessionRequest): Promise<Session> {
    try {
      const session: Session = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: sessionData.eventId,
        title: sessionData.title,
        description: sessionData.description,
        speaker: {
          name: sessionData.speaker?.name || '',
          email: sessionData.speaker?.email || '',
          linkedinUrl: sessionData.speaker?.linkedinUrl || '',
          bio: sessionData.speaker?.bio || '',
          isExternal: sessionData.speaker?.isExternal || false
        },
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        currentAttendees: 0,
        status: 'scheduled' as SessionStatus,
        type: sessionData.type || 'presentation',
        metadata: {
          ...sessionData.metadata
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('sessions')
        .insert({
          id: session.id,
          event_id: session.eventId,
          title: session.title,
          description: session.description,
          speaker: session.speaker,
          start_time: session.startTime,
          end_time: session.endTime,
          status: session.status,
          type: session.type,
          metadata: session.metadata
        })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return session
    } catch (error) {
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToSession(data)
    } catch (error) {
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, updateData: UpdateSessionRequest): Promise<Session> {
    try {
      const updateFields: any = {}
      
      if (updateData.title !== undefined) updateFields.title = updateData.title
      if (updateData.description !== undefined) updateFields.description = updateData.description
      if (updateData.speaker !== undefined) updateFields.speaker = updateData.speaker
      if (updateData.startTime !== undefined) updateFields.start_time = updateData.startTime
      if (updateData.endTime !== undefined) updateFields.end_time = updateData.endTime
      if (updateData.status !== undefined) updateFields.status = updateData.status
      if (updateData.type !== undefined) updateFields.type = updateData.type
      if (updateData.metadata !== undefined) updateFields.metadata = updateData.metadata

      updateFields.updated_at = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('sessions')
        .update(updateFields)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToSession(data)
    } catch (error) {
      throw new Error(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return true
    } catch (error) {
      throw new Error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List event sessions
   */
  async listEventSessions(eventId: string, filters: {
    status?: SessionStatus
    page?: number
    limit?: number
  } = {}): Promise<{
    data: Session[]
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
        .from('sessions')
        .select('*', { count: 'exact' })
        .eq('event_id', eventId)

      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Order by start time
      query = query.order('start_time', { ascending: true })

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const sessions = data.map((row: any) => this.mapRowToSession(row))

      return {
        data: sessions,
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      throw new Error(`Failed to list event sessions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<Session> {
    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToSession(data)
    } catch (error) {
      throw new Error(`Failed to update session status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Join session
   */
  async joinSession(sessionId: string, attendeeId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('session_attendees')
        .insert({
          session_id: sessionId,
          attendee_id: attendeeId,
          joined_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return true
    } catch (error) {
      throw new Error(`Failed to join session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Leave session
   */
  async leaveSession(sessionId: string, attendeeId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('session_attendees')
        .update({
          left_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('attendee_id', attendeeId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return true
    } catch (error) {
      throw new Error(`Failed to leave session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get session attendees
   */
  async getSessionAttendees(sessionId: string): Promise<Array<{
    attendeeId: string
    joinedAt: string
    leftAt?: string
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('session_attendees')
        .select('attendee_id, joined_at, left_at')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data.map((row: any) => ({
        attendeeId: row.attendee_id,
        joinedAt: row.joined_at,
        leftAt: row.left_at
      }))
    } catch (error) {
      throw new Error(`Failed to get session attendees: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Map database row to Session object
   */
  private mapRowToSession(row: any): Session {
    return {
      id: row.id,
      eventId: row.event_id,
      title: row.title,
      description: row.description,
      speaker: row.speaker,
      startTime: row.start_time,
      endTime: row.end_time,
      currentAttendees: row.current_attendees || 0,
      status: row.status,
      type: row.type,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export default SessionService