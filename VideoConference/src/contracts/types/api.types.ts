/**
 * API Type Definitions
 * Generated from OpenAPI specification for type safety
 */

// Base response structure
export interface BaseResponse {
  success: boolean;
  timestamp: string;
}

// Error response structure
export interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// Success response structure
export interface SuccessResponse extends BaseResponse {
  success: true;
  message?: string;
}

// Media permissions
export interface MediaPermissions {
  camera: boolean;
  microphone: boolean;
  screenShare: boolean;
}

// Participant information
export interface Participant {
  participantId: string;
  name: string;
  isConnected: boolean;
  mediaPermissions: MediaPermissions;
  joinedAt: string;
  lastSeen?: string;
  connectionState?: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

// Room information
export interface RoomInfo {
  roomId: string;
  name?: string;
  participants: Participant[];
  createdAt: string;
  isActive: boolean;
}

// Room summary for listing
export interface RoomSummary {
  roomId: string;
  name?: string;
  participantCount: number;
  createdAt: string;
  isActive: boolean;
}

// Message information
export interface Message {
  messageId: string;
  roomId: string;
  participantId: string;
  participantName: string;
  message: string;
  messageType?: 'text' | 'system' | 'notification';
  timestamp: string;
  isEdited?: boolean;
  editedAt?: string;
}

// Request types
export interface CreateRoomRequest {
  participantName: string;
  mediaPermissions?: MediaPermissions;
}

export interface JoinRoomRequest {
  participantName: string;
  mediaPermissions?: MediaPermissions;
}

export interface LeaveRoomRequest {
  participantId: string;
}

export interface SendMessageRequest {
  participantId: string;
  message: string;
}

// Response types
export interface CreateRoomResponse extends BaseResponse {
  success: true;
  data: {
    roomId: string;
    accessToken: string;
    participantId: string;
    createdAt: string;
  };
}

export interface JoinRoomResponse extends BaseResponse {
  success: true;
  data: {
    participantId: string;
    accessToken: string;
    roomInfo: RoomInfo;
  };
}

export interface GetRoomResponse extends BaseResponse {
  success: true;
  data: RoomInfo;
}

export interface ListRoomsResponse extends BaseResponse {
  success: true;
  data: {
    rooms: RoomSummary[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface GetMessagesResponse extends BaseResponse {
  success: true;
  data: {
    messages: Message[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SendMessageResponse extends BaseResponse {
  success: true;
  data: Message;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'participant_joined' | 'participant_left' | 'message' | 'media_state_changed' | 'room_updated' | 'error';
  data: unknown;
  timestamp: string;
}

export interface ParticipantJoinedMessage extends WebSocketMessage {
  type: 'participant_joined';
  data: Participant;
}

export interface ParticipantLeftMessage extends WebSocketMessage {
  type: 'participant_left';
  data: {
    participantId: string;
    participantName: string;
  };
}

export interface ChatMessage extends WebSocketMessage {
  type: 'message';
  data: Message;
}

export interface MediaStateChangedMessage extends WebSocketMessage {
  type: 'media_state_changed';
  data: {
    participantId: string;
    mediaPermissions: MediaPermissions;
  };
}

export interface RoomUpdatedMessage extends WebSocketMessage {
  type: 'room_updated';
  data: RoomInfo;
}

export interface WebSocketErrorMessage extends WebSocketMessage {
  type: 'error';
  data: {
    error: string;
    code: string;
  };
}

// API Client types
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number>;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// JWT Token types
export interface JWTPayload {
  sub: string; // participant ID
  roomId: string;
  iat: number;
  exp: number;
  permissions: MediaPermissions;
}

// Database entity types (for internal use)
export interface RoomEntity {
  id: string;
  name?: string;
  created_at: Date;
  is_active: boolean;
  updated_at: Date;
}

export interface ParticipantEntity {
  id: string;
  room_id: string;
  name: string;
  is_connected: boolean;
  media_permissions: MediaPermissions;
  joined_at: Date;
  last_seen?: Date;
  connection_state: string;
}

export interface MessageEntity {
  id: string;
  room_id: string;
  participant_id: string;
  participant_name: string;
  message: string;
  message_type: string;
  created_at: Date;
  is_edited: boolean;
  edited_at?: Date;
}
