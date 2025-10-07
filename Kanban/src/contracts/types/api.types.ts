// Re-export all schema types for easy importing
export * from '../schemas/auth.schema';
export * from '../schemas/workspace.schema';
export * from '../schemas/board.schema';
export * from '../schemas/task.schema';
export * from '../schemas/user.schema';

// Common API response types
export interface ApiResponseData<T> {
  data: T;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    has_more?: boolean;
  };
}

// API Client configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: any) => boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
}

// API Request configuration
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Error response types
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  statusCode: number;
}

export interface ValidationErrorResponse extends ErrorResponse {
  error: 'VALIDATION_ERROR';
  details: Record<string, string[]>;
}

// HTTP status codes
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
}

// API endpoint types
export type ApiEndpoint = 
  | 'GET /api/v1/workspaces'
  | 'POST /api/v1/workspaces'
  | 'GET /api/v1/workspaces/{id}/boards'
  | 'POST /api/v1/workspaces/{id}/boards'
  | 'GET /api/v1/boards/{id}'
  | 'PUT /api/v1/boards/{id}'
  | 'DELETE /api/v1/boards/{id}'
  | 'GET /api/v1/boards/{id}/tasks'
  | 'POST /api/v1/boards/{id}/tasks'
  | 'GET /api/v1/tasks/{id}'
  | 'PUT /api/v1/tasks/{id}'
  | 'DELETE /api/v1/tasks/{id}'
  | 'POST /api/v1/tasks/{id}/move'
  | 'GET /api/v1/users/search';

// Request/Response mapping
export interface ApiRequestResponseMap {
  'GET /api/v1/workspaces': {
    request: void;
    response: any; // WorkspaceListResponse
  };
  'POST /api/v1/workspaces': {
    request: any; // CreateWorkspaceRequest
    response: any; // WorkspaceResponse
  };
  'GET /api/v1/workspaces/{id}/boards': {
    request: void;
    response: any; // BoardListResponse
  };
  'POST /api/v1/workspaces/{id}/boards': {
    request: any; // CreateBoardRequest
    response: any; // BoardResponse
  };
  'GET /api/v1/boards/{id}': {
    request: void;
    response: any; // BoardDetailResponse
  };
  'PUT /api/v1/boards/{id}': {
    request: any; // UpdateBoardRequest
    response: any; // BoardResponse
  };
  'DELETE /api/v1/boards/{id}': {
    request: void;
    response: void;
  };
  'GET /api/v1/boards/{id}/tasks': {
    request: any; // TaskFilter
    response: any; // TaskListResponse
  };
  'POST /api/v1/boards/{id}/tasks': {
    request: any; // CreateTaskRequest
    response: any; // TaskResponse
  };
  'GET /api/v1/tasks/{id}': {
    request: void;
    response: any; // TaskResponse
  };
  'PUT /api/v1/tasks/{id}': {
    request: any; // UpdateTaskRequest
    response: any; // TaskResponse
  };
  'DELETE /api/v1/tasks/{id}': {
    request: void;
    response: void;
  };
  'POST /api/v1/tasks/{id}/move': {
    request: any; // MoveTaskRequest
    response: any; // TaskResponse
  };
  'GET /api/v1/users/search': {
    request: any; // SearchUsersRequest
    response: any; // UserSearchResponse
  };
}

// Utility types for API calls
export type ApiRequest<T extends ApiEndpoint> = ApiRequestResponseMap[T]['request'];
export type ApiResponse<T extends ApiEndpoint> = ApiRequestResponseMap[T]['response'];

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version?: string;
  pagination?: PaginationMeta;
  duration?: number;
}

// Filter types
export interface BaseFilter extends PaginationParams {
  search?: string;
}

// Sort types
export type SortDirection = 'asc' | 'desc';

export interface SortParams {
  sort_by?: string;
  sort_direction?: SortDirection;
}

// Real-time event types
export interface RealtimeEvent<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: T;
  old_record?: T;
}

export interface RealtimeSubscription {
  id: string;
  table: string;
  filter?: string;
  callback: (event: RealtimeEvent) => void;
}

// WebSocket message types
export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  user_id?: string;
}

export interface TaskMoveMessage {
  task_id: string;
  from_column_id: string;
  to_column_id: string;
  from_position: number;
  to_position: number;
  user_id: string;
}

export interface UserPresenceMessage {
  user_id: string;
  board_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
}

// Error types
export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, 'FORBIDDEN', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'An unexpected error occurred') {
    super(500, 'INTERNAL_ERROR', message);
    this.name = 'InternalServerError';
  }
}

// Network and timeout error classes
export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public timeout?: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Type guards
export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && 'status' in error && 'error' in error && 'message' in error;
}

export function isValidationError(error: any): error is ValidationError {
  return isApiError(error) && error.error === 'VALIDATION_ERROR';
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: any): error is TimeoutError {
  return error instanceof TimeoutError;
}
