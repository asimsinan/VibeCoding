/**
 * Models Index
 * Exports all data models and types
 */

// Room models
export * from './room.model';

// Participant models
export * from './participant.model';

// Message models
export * from './message.model';

// Re-export API types (only specific types to avoid conflicts)
export type {
  MediaPermissions,
  BaseResponse,
  ErrorResponse,
  SuccessResponse,
  CreateRoomRequest,
  JoinRoomRequest,
  LeaveRoomRequest,
  SendMessageRequest,
  CreateRoomResponse,
  JoinRoomResponse,
  GetRoomResponse,
  ListRoomsResponse,
  GetMessagesResponse,
  SendMessageResponse,
  RoomInfo,
  RoomSummary,
  WebSocketMessage,
  ParticipantJoinedMessage,
  ParticipantLeftMessage,
  MediaStateChangedMessage,
  RoomUpdatedMessage,
  WebSocketErrorMessage,
  ValidationError,
  ApiClientConfig,
  ApiRequestOptions,
  PaginatedResponse,
  JWTPayload,
} from '../../../contracts/types/api.types';

// Re-export API Message as ApiMessage to avoid conflicts
export type { Message as ApiMessage } from '../../../contracts/types/api.types';

// Re-export API Participant as ApiParticipant to avoid conflicts
export type { Participant as ApiParticipant } from '../../../contracts/types/api.types';

// Common types
export interface DatabaseEntity {
  id: string;
  created_at: Date;
  updated_at?: Date;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';
  value: any;
}

export interface QueryParams {
  pagination?: PaginationParams;
  sort?: SortParams[];
  filters?: FilterParams[];
  search?: string;
}

// Validation result type
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

// Service response type
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Model base class
export abstract class BaseModel<T, CreateT, UpdateT> {
  abstract validate(data: unknown): ValidationResult<T>;
  abstract validateCreate(data: unknown): ValidationResult<CreateT>;
  abstract validateUpdate(data: unknown): ValidationResult<UpdateT>;
  
  protected validateRequired(data: any, requiredFields: string[]): string[] {
    const errors: string[] = [];
    requiredFields.forEach(field => {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`${field} is required`);
      }
    });
    return errors;
  }

  protected validateLength(value: string, min: number, max: number, field: string): string[] {
    const errors: string[] = [];
    if (value.length < min) {
      errors.push(`${field} must be at least ${min} characters long`);
    }
    if (value.length > max) {
      errors.push(`${field} must be no more than ${max} characters long`);
    }
    return errors;
  }

  protected validatePattern(value: string, pattern: RegExp, field: string, message: string): string[] {
    const errors: string[] = [];
    if (!pattern.test(value)) {
      errors.push(`${field} ${message}`);
    }
    return errors;
  }

  protected validateRange(value: number, min: number, max: number, field: string): string[] {
    const errors: string[] = [];
    if (value < min) {
      errors.push(`${field} must be at least ${min}`);
    }
    if (value > max) {
      errors.push(`${field} must be no more than ${max}`);
    }
    return errors;
  }
}
