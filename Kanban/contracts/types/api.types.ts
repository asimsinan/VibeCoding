/**
 * API Types - Generated from OpenAPI 3.0 specification
 * FR-001: API-First Design - Comprehensive API type definitions
 */

// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseMeta {
  timestamp: string;
  version: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationMeta extends ResponseMeta {
  pagination: Pagination;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// User types
export interface User extends BaseEntity {
  email: string;
  fullName: string;
  avatar?: string;
}

// Workspace types
export interface Workspace extends BaseEntity {
  name: string;
  description?: string;
  ownerId: string;
  memberCount: number;
  boardCount: number;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

export interface WorkspaceResponse {
  data: Workspace;
  meta: ResponseMeta;
}

export interface WorkspaceListResponse {
  data: Workspace[];
  meta: PaginationMeta;
}

// Board types
export interface Column {
  id: string;
  name: string;
  position: number;
  color?: string;
  taskLimit?: number;
}

export interface Board extends BaseEntity {
  name: string;
  description?: string;
  workspaceId: string;
  columns: Column[];
  taskCount: number;
}

export interface CreateColumnRequest {
  name: string;
  color?: string;
  taskLimit?: number;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  columns?: CreateColumnRequest[];
}

export interface UpdateColumnRequest {
  id?: string;
  name?: string;
  color?: string;
  position?: number;
  taskLimit?: number;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  columns?: UpdateColumnRequest[];
}

export interface BoardResponse {
  data: Board;
  meta: ResponseMeta;
}

export interface BoardListResponse {
  data: Board[];
  meta: PaginationMeta;
}

// Task types
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  position: number;
  dueDate?: string;
  tags: string[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  tags?: string[];
  column_id?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
}

export interface MoveTaskRequest {
  columnId: string;
  position: number;
}

export interface TaskResponse {
  data: Task;
  meta: ResponseMeta;
}

export interface TaskListResponse {
  data: Task[];
  meta: PaginationMeta;
}

// User search types
export interface UserSearchResponse {
  data: User[];
  meta: ResponseMeta;
}

// Success response types
export interface SuccessResponse {
  success: boolean;
  message: string;
  meta: ResponseMeta;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  error: ErrorDetails;
  meta: ResponseMeta;
}

export interface ValidationErrorResponse {
  error: {
    code: string;
    message: string;
    details: {
      fields: ValidationError[];
    };
  };
  meta: ResponseMeta;
}

// API Client types
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// Query parameter types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TaskFilterParams extends PaginationParams {
  columnId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export interface UserSearchParams {
  q: string;
  limit?: number;
}

// API Endpoint types
export interface ApiEndpoints {
  // Authentication
  auth: {
    login: (data: LoginRequest) => Promise<ApiResponse<AuthResponse>>;
    register: (data: RegisterRequest) => Promise<ApiResponse<AuthResponse>>;
    logout: () => Promise<ApiResponse<SuccessResponse>>;
    refresh: (data: RefreshTokenRequest) => Promise<ApiResponse<AuthResponse>>;
  };
  
  // Workspaces
  workspaces: {
    list: (params?: PaginationParams) => Promise<ApiResponse<WorkspaceListResponse>>;
    get: (id: string) => Promise<ApiResponse<WorkspaceResponse>>;
    create: (data: CreateWorkspaceRequest) => Promise<ApiResponse<WorkspaceResponse>>;
    update: (id: string, data: UpdateWorkspaceRequest) => Promise<ApiResponse<WorkspaceResponse>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  
  // Boards
  boards: {
    list: (workspaceId: string, params?: PaginationParams) => Promise<ApiResponse<BoardListResponse>>;
    get: (id: string) => Promise<ApiResponse<BoardResponse>>;
    create: (workspaceId: string, data: CreateBoardRequest) => Promise<ApiResponse<BoardResponse>>;
    update: (id: string, data: UpdateBoardRequest) => Promise<ApiResponse<BoardResponse>>;
    delete: (id: string, permanent?: boolean) => Promise<ApiResponse<void>>;
  };
  
  // Tasks
  tasks: {
    list: (boardId: string, params?: TaskFilterParams) => Promise<ApiResponse<TaskListResponse>>;
    get: (id: string) => Promise<ApiResponse<TaskResponse>>;
    create: (boardId: string, data: CreateTaskRequest) => Promise<ApiResponse<TaskResponse>>;
    update: (id: string, data: UpdateTaskRequest) => Promise<ApiResponse<TaskResponse>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
    move: (id: string, data: MoveTaskRequest) => Promise<ApiResponse<TaskResponse>>;
  };
  
  // Users
  users: {
    search: (params: UserSearchParams) => Promise<ApiResponse<UserSearchResponse>>;
  };
}

// API Error types
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response: ErrorResponse,
    message?: string
  ) {
    super(message || response.error.message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: ValidationError[],
    message = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// API Response helpers
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: any): error is TimeoutError {
  return error instanceof TimeoutError;
}

// Type guards
export function isTaskStatus(value: any): value is TaskStatus {
  return ['todo', 'in_progress', 'done'].includes(value);
}

export function isTaskPriority(value: any): value is TaskPriority {
  return ['low', 'medium', 'high', 'urgent'].includes(value);
}

export function isUser(value: any): value is User {
  return value && typeof value.id === 'string' && typeof value.email === 'string';
}

export function isWorkspace(value: any): value is Workspace {
  return value && typeof value.id === 'string' && typeof value.name === 'string';
}

export function isBoard(value: any): value is Board {
  return value && typeof value.id === 'string' && typeof value.name === 'string';
}

export function isTask(value: any): value is Task {
  return value && typeof value.id === 'string' && typeof value.title === 'string';
}
