/**
 * API Types
 * Type definitions for API requests and responses
 *
 * @fileoverview API type definitions for the collaborative whiteboard
 * @version 1.0.0
 */

// Basic Types
export interface Point {
  x: number
  y: number
}

export interface Position {
  x: number
  y: number
}

export interface WhiteboardSettings {
  width: number
  height: number
  backgroundColor: string
}

export interface Whiteboard {
  id: string
  name: string
  settings: WhiteboardSettings
  createdAt: Date
  updatedAt: Date
}

export interface Drawing {
  id: string
  whiteboardId: string
  tool: 'pen' | 'brush' | 'eraser'
  color: string
  size: number
  points: Point[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface StickyNote {
  id: string
  whiteboardId: string
  content: string
  position: Position
  color: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  displayName: string
  lastSeen: Date
  cursorPosition?: Position
  whiteboardId: string
  createdAt: Date
  updatedAt: Date
}

// Base API Response
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: any
  timestamp: string
}

// Whiteboard API Types
export interface CreateWhiteboardRequest {
  name: string
  settings?: {
    width?: number
    height?: number
    backgroundColor?: string
  }
}

export interface UpdateWhiteboardRequest {
  name?: string
  settings?: {
    width?: number
    height?: number
    backgroundColor?: string
  }
}

// Drawing API Types
export interface CreateDrawingRequest {
  tool: 'pen' | 'brush' | 'eraser'
  color: string
  size: number
  points: { x: number; y: number }[]
  userId: string
}

export interface UpdateDrawingRequest {
  tool?: 'pen' | 'brush' | 'eraser'
  color?: string
  size?: number
  points?: { x: number; y: number }[]
}

// Sticky Note API Types
export interface CreateStickyNoteRequest {
  content: string
  position: { x: number; y: number }
  color: string
  userId: string
}

export interface UpdateStickyNoteRequest {
  content?: string
  position?: { x: number; y: number }
  color?: string
}

// User API Types
export interface UpdateUserPresenceRequest {
  displayName?: string
  cursorPosition?: { x: number; y: number }
  whiteboardId?: string
}

// Error Types
export interface ApiError {
  message: string
  code: string
  details?: any
  timestamp: string
}

// Pagination Types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Real-time Event Types (moved to bottom of file)

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'event' | 'error' | 'ping' | 'pong'
  data?: any
  error?: string
  timestamp: string
}

// Authentication Types
export interface AuthToken {
  access_token: string
  refresh_token: string
  expires_at: number
  token_type: string
}

export interface UserSession {
  user: {
    id: string
    email: string
    displayName: string
  }
  token: AuthToken
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: 'up' | 'down' | 'degraded'
    realtime: 'up' | 'down' | 'degraded'
    storage: 'up' | 'down' | 'degraded'
  }
  version: string
  uptime: number
}

// Error Response Types
export interface ErrorResponse {
  success: false
  error: string
  code: string
  details?: any
  timestamp: string
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}

// Error Codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR', // Alias for backward compatibility
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Utility Functions
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
  return hexColorRegex.test(color)
}

export const isValidDrawingTool = (tool: string): boolean => {
  return ['pen', 'brush', 'eraser'].includes(tool)
}

// Response Types
export interface CreateWhiteboardResponse extends ApiResponse<{
  id: string
  name: string
  settings: {
    width: number
    height: number
    backgroundColor: string
  }
  createdAt: string
  updatedAt: string
}> {}

export interface GetWhiteboardResponse extends ApiResponse<{
  id: string
  name: string
  settings: {
    width: number
    height: number
    backgroundColor: string
  }
  drawings: any[]
  stickyNotes: any[]
  users: any[]
  createdAt: string
  updatedAt: string
}> {}

export interface UpdateWhiteboardResponse extends ApiResponse<{
  id: string
  name: string
  settings: {
    width: number
    height: number
    backgroundColor: string
  }
  updatedAt: string
}> {}

export interface ListWhiteboardsResponse extends ApiResponse<{
  whiteboards: Array<{
    id: string
    name: string
    settings: {
      width: number
      height: number
      backgroundColor: string
    }
    createdAt: string
    updatedAt: string
  }>
  total: number
  page: number
  limit: number
}> {}

export interface AddDrawingResponse extends ApiResponse<{
  id: string
  tool: string
  color: string
  size: number
  points: { x: number; y: number }[]
  userId: string
  createdAt: string
}> {}

export interface GetDrawingsResponse extends ApiResponse<{
  drawings: {
    id: string
    whiteboardId: string
    tool: string
    color: string
    size: number
    points: { x: number; y: number }[]
    userId: string
    createdAt: string
    updatedAt: string
  }[]
}> {}

export interface GetStickyNotesResponse extends ApiResponse<{
  stickyNotes: {
    id: string
    whiteboardId: string
    content: string
    position: { x: number; y: number }
    color: string
    userId: string
    createdAt: string
    updatedAt: string
  }[]
}> {}

export interface AddStickyNoteResponse extends ApiResponse<{
  id: string
  whiteboardId: string
  content: string
  position: { x: number; y: number }
  color: string
  userId: string
  createdAt: string
}> {}

export interface GetActiveUsersResponse extends ApiResponse<{
  users: Array<{
    id: string
    displayName: string
    lastSeen: string
    cursorPosition?: { x: number; y: number }
    whiteboardId: string
  }>
}> {}

export interface ClearWhiteboardResponse extends ApiResponse<{
  success: boolean
  clearedItems: {
    drawings: number
    stickyNotes: number
  }
}> {}

// Realtime Event Types
export interface RealtimeEvent {
  type: string
  data: any
  timestamp: string
}

export interface DrawingEvent extends RealtimeEvent {
  type: 'DRAWING_CREATED' | 'DRAWING_UPDATED' | 'DRAWING_DELETED'
  data: Drawing
}

export interface StickyNoteEvent extends RealtimeEvent {
  type: 'STICKY_NOTE_CREATED' | 'STICKY_NOTE_UPDATED' | 'STICKY_NOTE_DELETED'
  data: StickyNote
}

export interface UserPresenceEvent extends RealtimeEvent {
  type: 'USER_JOINED' | 'USER_LEFT' | 'USER_PRESENCE_UPDATED'
  data: User
}

export interface WhiteboardClearEvent extends RealtimeEvent {
  type: 'WHITEBOARD_CLEARED'
  data: {
    whiteboardId: string
    clearedItems: {
      drawings: number
      stickyNotes: number
    }
  }
}

export interface WhiteboardUpdateEvent extends RealtimeEvent {
  type: 'WHITEBOARD_UPDATED'
  data: Whiteboard
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}