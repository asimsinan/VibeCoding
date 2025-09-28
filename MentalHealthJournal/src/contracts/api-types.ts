/**
 * Generated TypeScript types from OpenAPI 3.0 specification
 * Mental Health Journal API - Version 1.0.0
 * 
 * This file contains TypeScript interfaces and types generated from the OpenAPI spec
 * for the Mental Health Journal API. These types ensure type safety across the application.
 */

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

// Mood Entry Types
export interface MoodEntry {
  id: string;
  rating: number;
  notes?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface MoodEntryRequest {
  rating: number;
  notes?: string;
  date: string;
}

export interface MoodEntryUpdateRequest {
  rating?: number;
  notes?: string;
  date?: string;
}

export interface MoodEntriesResponse extends ApiResponse<MoodEntry[]> {
  pagination: Pagination;
}

export interface MoodEntryResponse extends ApiResponse<MoodEntry> {}

// Mood Trend Types
export interface MoodDataPoint {
  date: string;
  rating: number;
  count?: number;
}

export interface MoodStatistics {
  average: number;
  min: number;
  max: number;
  totalEntries: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface MoodTrend {
  period: string;
  dataPoints: MoodDataPoint[];
  statistics: MoodStatistics;
  startDate?: string;
  endDate?: string;
}

export interface MoodTrendResponse extends ApiResponse<MoodTrend> {}

// User Settings Types
export interface ChartPreferences {
  defaultPeriod?: '7' | '30' | '90' | '365';
  chartType?: 'line' | 'bar' | 'area';
  showGrid?: boolean;
  showDataPoints?: boolean;
}

export interface PrivacySettings {
  dataSharing?: boolean;
  cloudSync?: boolean;
  exportData?: boolean;
}

export interface UserSettings {
  id: string;
  theme: 'light' | 'dark' | 'auto';
  chartPreferences: ChartPreferences;
  dataRetention: number;
  privacy: PrivacySettings;
  notifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsRequest {
  theme?: 'light' | 'dark' | 'auto';
  chartPreferences?: ChartPreferences;
  dataRetention?: number;
  privacy?: PrivacySettings;
  notifications?: boolean;
}

export interface UserSettingsResponse extends ApiResponse<UserSettings> {}

// API Query Parameters
export interface MoodEntriesQuery {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface MoodTrendsQuery {
  period: '7' | '30' | '90' | '365';
  startDate?: string;
  endDate?: string;
}

// HTTP Status Codes
export type HttpStatusCode = 
  | 200 | 201 | 400 | 404 | 409 | 500;

// API Endpoint Types
export interface ApiEndpoints {
  // Mood Entries
  'GET /api/v1/mood-entries': {
    query: MoodEntriesQuery;
    response: MoodEntriesResponse;
  };
  'POST /api/v1/mood-entries': {
    body: MoodEntryRequest;
    response: MoodEntryResponse;
  };
  'GET /api/v1/mood-entries/{id}': {
    params: { id: string };
    response: MoodEntryResponse;
  };
  'PUT /api/v1/mood-entries/{id}': {
    params: { id: string };
    body: MoodEntryUpdateRequest;
    response: MoodEntryResponse;
  };
  'DELETE /api/v1/mood-entries/{id}': {
    params: { id: string };
    response: ApiResponse;
  };
  
  // Mood Trends
  'GET /api/v1/mood-trends': {
    query: MoodTrendsQuery;
    response: MoodTrendResponse;
  };
  
  // User Settings
  'GET /api/v1/user/settings': {
    response: UserSettingsResponse;
  };
  'PUT /api/v1/user/settings': {
    body: UserSettingsRequest;
    response: UserSettingsResponse;
  };
}

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse extends ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: ValidationError[];
  };
}

// API Client Configuration
export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

// Request/Response Headers
export interface ApiHeaders {
  'Content-Type': 'application/json';
  'X-API-Key'?: string;
  'Authorization'?: string;
}

// Utility Types
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type ApiPath = keyof ApiEndpoints;

export type ApiRequest<T extends ApiPath> = ApiEndpoints[T] extends { body: infer B } ? B : never;
export type ApiResponseType<T extends ApiPath> = ApiEndpoints[T] extends { response: infer R } ? R : never;
export type ApiQuery<T extends ApiPath> = ApiEndpoints[T] extends { query: infer Q } ? Q : never;
export type ApiParams<T extends ApiPath> = ApiEndpoints[T] extends { params: infer P } ? P : never;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// API Constants
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const MOOD_RATING_MIN = 1;
export const MOOD_RATING_MAX = 10;
export const NOTES_MAX_LENGTH = 500;
export const DATA_RETENTION_MIN_DAYS = 30;
export const DATA_RETENTION_MAX_DAYS = 3650;

export const SUPPORTED_PERIODS = ['7', '30', '90', '365'] as const;
export const SUPPORTED_THEMES = ['light', 'dark', 'auto'] as const;
export const SUPPORTED_CHART_TYPES = ['line', 'bar', 'area'] as const;
export const SUPPORTED_TRENDS = ['increasing', 'decreasing', 'stable'] as const;

// Type Guards
export function isMoodEntry(obj: any): obj is MoodEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.rating === 'number' &&
    obj.rating >= MOOD_RATING_MIN &&
    obj.rating <= MOOD_RATING_MAX &&
    typeof obj.date === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string' &&
    typeof obj.synced === 'boolean'
  );
}

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj.success === false &&
    typeof obj.error === 'object' &&
    typeof obj.error.code === 'string' &&
    typeof obj.error.message === 'string' &&
    typeof obj.timestamp === 'string'
  );
}

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.success === 'boolean' &&
    typeof obj.timestamp === 'string'
  );
}
