/**
 * Shape Service
 * Business logic for shape operations
 * 
 * @fileoverview Shape service with CRUD operations and positioning
 * @version 1.0.0
 */

import { ShapeObjectModel } from '../models/CanvasObjectModel'
import { supabase } from '@/lib/supabase/client'

export class ShapeService {
  /**
   * Create a new shape
   */
  static async createShape(whiteboardId: string, shapeData: Omit<ShapeObjectModel, 'id' | 'createdAt'>): Promise<ShapeObjectModel> {
    try {
      // Validate shape data before creating
      if (!shapeData.startPoint || typeof shapeData.startPoint.x !== 'number' || typeof shapeData.startPoint.y !== 'number') {
        throw new Error('Invalid startPoint: x and y coordinates must be numbers')
      }
      
      if (!shapeData.endPoint || typeof shapeData.endPoint.x !== 'number' || typeof shapeData.endPoint.y !== 'number') {
        throw new Error('Invalid endPoint: x and y coordinates must be numbers')
      }
      
      if (!shapeData.type || !['rectangle', 'circle', 'line', 'arrow'].includes(shapeData.type)) {
        throw new Error('Invalid shape type: must be rectangle, circle, line, or arrow')
      }
      
      if (!shapeData.userId) {
        throw new Error('User ID is required for shape creation')
      }

      console.log('Creating shape with validated data:', {
        type: shapeData.type,
        startPoint: shapeData.startPoint,
        endPoint: shapeData.endPoint,
        userId: shapeData.userId
      })

      const { data, error } = await supabase
        .from('shapes')
        .insert({
          whiteboard_id: whiteboardId,
          type: shapeData.type,
          start_point: shapeData.startPoint,
          end_point: shapeData.endPoint,
          stroke_color: shapeData.strokeColor,
          stroke_width: shapeData.strokeWidth,
          fill_color: shapeData.fillColor,
          user_id: shapeData.userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating shape:', error)
        throw new Error(`Failed to create shape: ${error.message}`)
      }

      // Convert database response to ShapeObjectModel
      return {
        id: data.id,
        type: data.type,
        startPoint: data.start_point,
        endPoint: data.end_point,
        strokeColor: data.stroke_color,
        strokeWidth: data.stroke_width,
        fillColor: data.fill_color,
        userId: data.user_id,
        createdAt: new Date(data.created_at)
      } as ShapeObjectModel
    } catch (error) {
      console.error('Error creating shape:', error)
      throw error
    }
  }

  /**
   * Get shape by ID
   */
  static async getShape(id: string): Promise<ShapeObjectModel | null> {
    try {
      const { data, error } = await supabase
        .from('shapes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Shape not found
        }
        console.error('Error getting shape:', error)
        throw new Error(`Failed to get shape: ${error.message}`)
      }

      return {
        id: data.id,
        type: data.type,
        startPoint: data.start_point,
        endPoint: data.end_point,
        strokeColor: data.stroke_color,
        strokeWidth: data.stroke_width,
        fillColor: data.fill_color,
        userId: data.user_id,
        createdAt: new Date(data.created_at)
      } as ShapeObjectModel
    } catch (error) {
      console.error('Error getting shape:', error)
      throw error
    }
  }

  /**
   * Update shape
   */
  static async updateShape(id: string, updates: Partial<ShapeObjectModel>): Promise<ShapeObjectModel> {
    try {
      const updateData: any = {}
      
      if (updates.startPoint) updateData.start_point = updates.startPoint
      if (updates.endPoint) updateData.end_point = updates.endPoint
      if (updates.strokeColor) updateData.stroke_color = updates.strokeColor
      if (updates.strokeWidth) updateData.stroke_width = updates.strokeWidth
      if (updates.fillColor) updateData.fill_color = updates.fillColor

      const { data, error } = await supabase
        .from('shapes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating shape:', error)
        throw new Error(`Failed to update shape: ${error.message}`)
      }

      return {
        id: data.id,
        type: data.type,
        startPoint: data.start_point,
        endPoint: data.end_point,
        strokeColor: data.stroke_color,
        strokeWidth: data.stroke_width,
        fillColor: data.fill_color,
        userId: data.user_id,
        createdAt: new Date(data.created_at)
      } as ShapeObjectModel
    } catch (error) {
      console.error('Error updating shape:', error)
      throw error
    }
  }

  /**
   * Delete shape
   */
  static async deleteShape(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shapes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting shape:', error)
        throw new Error(`Failed to delete shape: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting shape:', error)
      throw error
    }
  }

  /**
   * Get all shapes for a whiteboard
   */
  static async getShapesForWhiteboard(whiteboardId: string): Promise<ShapeObjectModel[]> {
    try {
      const { data, error } = await supabase
        .from('shapes')
        .select('*')
        .eq('whiteboard_id', whiteboardId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting shapes for whiteboard:', error)
        throw new Error(`Failed to get shapes: ${error.message}`)
      }

      return data.map(shape => ({
        id: shape.id,
        type: shape.type,
        startPoint: shape.start_point,
        endPoint: shape.end_point,
        strokeColor: shape.stroke_color,
        strokeWidth: shape.stroke_width,
        fillColor: shape.fill_color,
        userId: shape.user_id,
        createdAt: new Date(shape.created_at)
      })) as ShapeObjectModel[]
    } catch (error) {
      console.error('Error getting shapes for whiteboard:', error)
      throw error
    }
  }

  /**
   * Clear all shapes for a whiteboard
   */
  static async clearShapesForWhiteboard(whiteboardId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shapes')
        .delete()
        .eq('whiteboard_id', whiteboardId)

      if (error) {
        console.error('Error clearing shapes for whiteboard:', error)
        throw new Error(`Failed to clear shapes: ${error.message}`)
      }
    } catch (error) {
      console.error('Error clearing shapes for whiteboard:', error)
      throw error
    }
  }
}
