/**
 * Whiteboard API Service
 * 
 * API service for whiteboard operations using the API client.
 * Provides type-safe methods for all whiteboard-related API calls.
 * 
 * @fileoverview Whiteboard API service with full CRUD operations
 * @version 1.0.0
 */

import { apiClient, ApiResponse } from './client'
import { Whiteboard } from '../whiteboard/models/Whiteboard'
import { Drawing } from '../whiteboard/models/Drawing'
import { StickyNote } from '../whiteboard/models/StickyNote'
import { User } from '../whiteboard/models/User'

// Request/Response Types
interface CreateWhiteboardRequest {
  name: string
  settings?: {
    width?: number
    height?: number
    backgroundColor?: string
  }
}

interface UpdateWhiteboardRequest {
  name?: string
  settings?: {
    width?: number
    height?: number
    backgroundColor?: string
  }
}

interface CreateDrawingRequest {
  tool: 'pen' | 'brush' | 'eraser'
  color: string
  size: number
  points: Array<{ x: number; y: number }>
  userId: string
}

interface UpdateDrawingRequest {
  tool?: 'pen' | 'brush' | 'eraser'
  color?: string
  size?: number
  points?: Array<{ x: number; y: number }>
}

interface CreateStickyNoteRequest {
  content: string
  position: { x: number; y: number }
  color: string
  userId: string
}

interface UpdateStickyNoteRequest {
  content?: string
  position?: { x: number; y: number }
  color?: string
}

interface WhiteboardWithData extends Whiteboard {
  drawings: Drawing[]
  stickyNotes: StickyNote[]
  users: User[]
}

/**
 * Whiteboard API Service Class
 */
export class WhiteboardApiService {
  private apiClient = apiClient

  /**
   * Get all whiteboards
   */
  async getWhiteboards(): Promise<ApiResponse<Whiteboard[]>> {
    return this.apiClient.get<Whiteboard[]>('/whiteboards')
  }

  /**
   * Get whiteboard by ID with all data
   */
  async getWhiteboard(id: string): Promise<ApiResponse<WhiteboardWithData>> {
    return this.apiClient.get<WhiteboardWithData>(`/whiteboards/${id}`)
  }

  /**
   * Create new whiteboard
   */
  async createWhiteboard(data: CreateWhiteboardRequest): Promise<ApiResponse<Whiteboard>> {
    return this.apiClient.post<Whiteboard>('/whiteboards', data)
  }

  /**
   * Update whiteboard
   */
  async updateWhiteboard(id: string, data: UpdateWhiteboardRequest): Promise<ApiResponse<Whiteboard>> {
    return this.apiClient.put<Whiteboard>(`/whiteboards/${id}`, data)
  }

  /**
   * Delete whiteboard
   */
  async deleteWhiteboard(id: string): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(`/whiteboards/${id}`)
  }

  /**
   * Get drawings for whiteboard
   */
  async getDrawings(whiteboardId: string): Promise<ApiResponse<Drawing[]>> {
    return this.apiClient.get<Drawing[]>(`/whiteboards/${whiteboardId}/drawings`)
  }

  /**
   * Create drawing
   */
  async createDrawing(whiteboardId: string, data: CreateDrawingRequest): Promise<ApiResponse<Drawing>> {
    return this.apiClient.post<Drawing>(`/whiteboards/${whiteboardId}/drawings`, data)
  }

  /**
   * Update drawing
   */
  async updateDrawing(whiteboardId: string, drawingId: string, data: UpdateDrawingRequest): Promise<ApiResponse<Drawing>> {
    return this.apiClient.put<Drawing>(`/whiteboards/${whiteboardId}/drawings/${drawingId}`, data)
  }

  /**
   * Delete drawing
   */
  async deleteDrawing(whiteboardId: string, drawingId: string): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(`/whiteboards/${whiteboardId}/drawings/${drawingId}`)
  }

  /**
   * Get sticky notes for whiteboard
   */
  async getStickyNotes(whiteboardId: string): Promise<ApiResponse<StickyNote[]>> {
    return this.apiClient.get<StickyNote[]>(`/whiteboards/${whiteboardId}/sticky-notes`)
  }

  /**
   * Create sticky note
   */
  async createStickyNote(whiteboardId: string, data: CreateStickyNoteRequest): Promise<ApiResponse<StickyNote>> {
    return this.apiClient.post<StickyNote>(`/whiteboards/${whiteboardId}/sticky-notes`, data)
  }

  /**
   * Update sticky note
   */
  async updateStickyNote(whiteboardId: string, noteId: string, data: UpdateStickyNoteRequest): Promise<ApiResponse<StickyNote>> {
    return this.apiClient.put<StickyNote>(`/whiteboards/${whiteboardId}/sticky-notes/${noteId}`, data)
  }

  /**
   * Delete sticky note
   */
  async deleteStickyNote(whiteboardId: string, noteId: string): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(`/whiteboards/${whiteboardId}/sticky-notes/${noteId}`)
  }

  /**
   * Get active users for whiteboard
   */
  async getActiveUsers(whiteboardId: string): Promise<ApiResponse<User[]>> {
    return this.apiClient.get<User[]>(`/whiteboards/${whiteboardId}/users`)
  }

  /**
   * Clear whiteboard content
   */
  async clearWhiteboard(whiteboardId: string): Promise<ApiResponse<void>> {
    return this.apiClient.post<void>(`/whiteboards/${whiteboardId}/clear`)
  }

  /**
   * Export whiteboard data
   */
  async exportWhiteboard(whiteboardId: string): Promise<ApiResponse<WhiteboardWithData>> {
    return this.apiClient.get<WhiteboardWithData>(`/whiteboards/${whiteboardId}/export`)
  }

  /**
   * Import whiteboard data
   */
  async importWhiteboard(whiteboardId: string, data: WhiteboardWithData): Promise<ApiResponse<WhiteboardWithData>> {
    return this.apiClient.post<WhiteboardWithData>(`/whiteboards/${whiteboardId}/import`, data)
  }
}

// Singleton instance
export const whiteboardApi = new WhiteboardApiService()

// Export types
export type {
  CreateWhiteboardRequest,
  UpdateWhiteboardRequest,
  CreateDrawingRequest,
  UpdateDrawingRequest,
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  WhiteboardWithData
}
