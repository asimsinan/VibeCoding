/**
 * Supabase Database Types
 * Type definitions for database tables
 * 
 * @fileoverview Database type definitions for Supabase
 * @version 1.0.0
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string
          last_seen: string
          cursor_position: { x: number; y: number } | null
          whiteboard_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          last_seen: string
          cursor_position?: { x: number; y: number } | null
          whiteboard_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          last_seen?: string
          cursor_position?: { x: number; y: number } | null
          whiteboard_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      whiteboards: {
        Row: {
          id: string
          name: string
          description: string | null
          settings: {
            width: number
            height: number
            backgroundColor: string
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          settings?: {
            width: number
            height: number
            backgroundColor: string
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          settings?: {
            width: number
            height: number
            backgroundColor: string
          }
          created_at?: string
          updated_at?: string
        }
      }
      drawings: {
        Row: {
          id: string
          whiteboard_id: string
          tool: 'pen' | 'brush' | 'eraser'
          color: string
          size: number
          points: { x: number; y: number }[]
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          whiteboard_id: string
          tool: 'pen' | 'brush' | 'eraser'
          color: string
          size: number
          points: { x: number; y: number }[]
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          whiteboard_id?: string
          tool?: 'pen' | 'brush' | 'eraser'
          color?: string
          size?: number
          points?: { x: number; y: number }[]
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sticky_notes: {
        Row: {
          id: string
          whiteboard_id: string
          content: string
          position: { x: number; y: number }
          color: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          whiteboard_id: string
          content: string
          position: { x: number; y: number }
          color: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          whiteboard_id?: string
          content?: string
          position?: { x: number; y: number }
          color?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
