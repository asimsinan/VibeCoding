/**
 * Text Service
 * Business logic for text operations
 * 
 * @fileoverview Text service with CRUD operations and positioning
 * @version 1.0.0
 */

import { TextObjectModel } from '../models/CanvasObjectModel'
import { supabase } from '@/lib/supabase/client'

export class TextService {
  /**
   * Create a new text object
   */
  static async createText(whiteboardId: string, textData: Omit<TextObjectModel, 'id' | 'createdAt'>): Promise<TextObjectModel> {
    try {
      const { data, error } = await supabase
        .from('text_objects')
        .insert({
          whiteboard_id: whiteboardId,
          type: textData.type,
          content: textData.content,
          position: textData.position,
          font_size: textData.fontSize,
          color: textData.color,
          font_family: textData.fontFamily,
          font_weight: textData.fontWeight,
          user_id: textData.userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating text object:', error)
        throw new Error(`Failed to create text object: ${error.message}`)
      }

      // Convert database response to TextObjectModel
      return {
        id: data.id,
        type: data.type,
        content: data.content,
        position: data.position,
        fontSize: data.font_size,
        color: data.color,
        fontFamily: data.font_family,
        fontWeight: data.font_weight,
        userId: data.user_id,
        createdAt: new Date(data.created_at)
      } as TextObjectModel
    } catch (error) {
      console.error('Error creating text object:', error)
      throw error
    }
  }

  /**
   * Get text object by ID
   */
  static async getText(id: string): Promise<TextObjectModel | null> {
    try {
      const { data, error } = await supabase
        .from('text_objects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Text object not found
        }
        console.error('Error getting text object:', error)
        throw new Error(`Failed to get text object: ${error.message}`)
      }

      return {
        id: data.id,
        type: data.type,
        content: data.content,
        position: data.position,
        fontSize: data.font_size,
        color: data.color,
        fontFamily: data.font_family,
        fontWeight: data.font_weight,
        userId: data.user_id,
        createdAt: new Date(data.created_at)
      } as TextObjectModel
    } catch (error) {
      console.error('Error getting text object:', error)
      throw error
    }
  }

  /**
   * Update text object
   */
  static async updateText(id: string, updates: Partial<TextObjectModel>): Promise<TextObjectModel> {
    try {
      const updateData: any = {}
      
      if (updates.content) updateData.content = updates.content
      if (updates.position) updateData.position = updates.position
      if (updates.fontSize) updateData.font_size = updates.fontSize
      if (updates.color) updateData.color = updates.color
      if (updates.fontFamily) updateData.font_family = updates.fontFamily
      if (updates.fontWeight) updateData.font_weight = updates.fontWeight

      const { data, error } = await supabase
        .from('text_objects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating text object:', error)
        throw new Error(`Failed to update text object: ${error.message}`)
      }

      return {
        id: data.id,
        type: data.type,
        content: data.content,
        position: data.position,
        fontSize: data.font_size,
        color: data.color,
        fontFamily: data.font_family,
        fontWeight: data.font_weight,
        userId: data.user_id,
        createdAt: new Date(data.created_at)
      } as TextObjectModel
    } catch (error) {
      console.error('Error updating text object:', error)
      throw error
    }
  }

  /**
   * Delete text object
   */
  static async deleteText(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('text_objects')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting text object:', error)
        throw new Error(`Failed to delete text object: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting text object:', error)
      throw error
    }
  }

  /**
   * Get all text objects for a whiteboard
   */
  static async getTextsForWhiteboard(whiteboardId: string): Promise<TextObjectModel[]> {
    try {
      const { data, error } = await supabase
        .from('text_objects')
        .select('*')
        .eq('whiteboard_id', whiteboardId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting text objects for whiteboard:', error)
        throw new Error(`Failed to get text objects: ${error.message}`)
      }

      return data.map(text => ({
        id: text.id,
        type: text.type,
        content: text.content,
        position: text.position,
        fontSize: text.font_size,
        color: text.color,
        fontFamily: text.font_family,
        fontWeight: text.font_weight,
        userId: text.user_id,
        createdAt: new Date(text.created_at)
      })) as TextObjectModel[]
    } catch (error) {
      console.error('Error getting text objects for whiteboard:', error)
      throw error
    }
  }

  /**
   * Clear all text objects for a whiteboard
   */
  static async clearTextsForWhiteboard(whiteboardId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('text_objects')
        .delete()
        .eq('whiteboard_id', whiteboardId)

      if (error) {
        console.error('Error clearing text objects for whiteboard:', error)
        throw new Error(`Failed to clear text objects: ${error.message}`)
      }
    } catch (error) {
      console.error('Error clearing text objects for whiteboard:', error)
      throw error
    }
  }
}
