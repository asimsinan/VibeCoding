import { supabase } from '../supabase'

export interface EventMessage {
  id: string
  eventId: string
  userId: string
  message: string
  userName: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateEventMessageRequest {
  eventId: string
  userId: string
  message: string
  userName: string
  metadata?: Record<string, any>
}

export class EventMessageService {
  private supabase = supabase

  constructor() {
    // No need to create new client - use shared instance
  }

  /**
   * Save a message to the database
   */
  async saveMessage(messageData: CreateEventMessageRequest): Promise<EventMessage> {
    try {
      const messageId = crypto.randomUUID()
      
      const { data, error } = await this.supabase
        .from('event_messages')
        .insert({
          id: messageId,
          event_id: messageData.eventId,
          user_id: messageData.userId,
          message: messageData.message,
          user_name: messageData.userName,
          metadata: messageData.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToMessage(data)
    } catch (error) {
      throw new Error(`Failed to save message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get messages for an event
   */
  async getEventMessages(eventId: string, limit: number = 50): Promise<EventMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('event_messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (data || []).map(row => this.mapRowToMessage(row))
    } catch (error) {
      return []
    }
  }

  /**
   * Map database row to EventMessage
   */
  private mapRowToMessage(row: any): EventMessage {
    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      message: row.message,
      userName: row.user_name,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

// Export singleton instance
export const eventMessageService = new EventMessageService()
