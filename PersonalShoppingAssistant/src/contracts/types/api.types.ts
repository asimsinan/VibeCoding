/**
 * API Types - Generated from OpenAPI 3.0 specification
 * TASK-001: Create API Contracts - FR-001 through FR-007
 */

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Product Types - FR-006
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  brand: string;
  imageUrl?: string;
  availability: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListResponse {
  products: Product[];
  pagination: Pagination;
}

// User Types - FR-007
export interface User {
  id: number;
  email: string;
  preferences: Preferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface Preferences {
  categories?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  brands?: string[];
  stylePreferences?: string[];
}

// Interaction Types - FR-004
export interface Interaction {
  id: number;
  userId: number;
  productId: number;
  type: InteractionType;
  timestamp: string;
}

export type InteractionType = 'view' | 'like' | 'dislike' | 'purchase';

// Authentication Types - FR-007
export interface UserRegistration {
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserUpdate {
  preferences?: Preferences;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Recommendation Types - FR-002
export interface RecommendationResponse {
  recommendations: Product[];
  algorithm: string;
}

// Search Types - FR-005
export interface SearchResponse {
  results: Product[];
  recommendations: Product[];
  pagination: Pagination;
}

// Pagination Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Query Parameters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  brand?: string;
}

export interface RecommendationQueryParams {
  limit?: number;
  category?: string;
}

export interface SearchQueryParams {
  q: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

// API Endpoint Types
export type ApiEndpoint = 
  | 'GET /api/v1/products'
  | 'GET /api/v1/products/{id}'
  | 'GET /api/v1/recommendations'
  | 'POST /api/v1/users/register'
  | 'POST /api/v1/users/login'
  | 'GET /api/v1/users/profile'
  | 'PUT /api/v1/users/profile'
  | 'POST /api/v1/interactions'
  | 'GET /api/v1/search';

// HTTP Status Codes
export type HttpStatusCode = 
  | 200 | 201 | 400 | 401 | 404 | 409 | 500;

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Request/Response Headers
export interface ApiHeaders {
  'Content-Type': 'application/json';
  'Authorization'?: string;
  'X-Request-ID'?: string;
}

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers: Partial<ApiHeaders>;
}

// Error Codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

// API Response Status
export enum ApiStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  LOADING = 'loading'
}

// Request Types for each endpoint
export interface GetProductsRequest {
  query: ProductQueryParams;
}

export interface GetProductRequest {
  params: { id: number };
}

export interface GetRecommendationsRequest {
  query: RecommendationQueryParams;
  headers: { Authorization: string };
}

export interface RegisterUserRequest {
  body: UserRegistration;
}

export interface LoginUserRequest {
  body: UserLogin;
}

export interface GetUserProfileRequest {
  headers: { Authorization: string };
}

export interface UpdateUserProfileRequest {
  body: UserUpdate;
  headers: { Authorization: string };
}

export interface RecordInteractionRequest {
  body: {
    productId: number;
    type: InteractionType;
  };
  headers: { Authorization: string };
}

export interface SearchProductsRequest {
  query: SearchQueryParams;
  headers: { Authorization: string };
}

// Response Types for each endpoint
export type GetProductsResponse = ApiResponse<ProductListResponse>;
export type GetProductResponse = ApiResponse<Product>;
export type GetRecommendationsResponse = ApiResponse<RecommendationResponse>;
export type RegisterUserResponse = ApiResponse<AuthResponse>;
export type LoginUserResponse = ApiResponse<AuthResponse>;
export type GetUserProfileResponse = ApiResponse<User>;
export type UpdateUserProfileResponse = ApiResponse<User>;
export type RecordInteractionResponse = ApiResponse<Interaction>;
export type SearchProductsResponse = ApiResponse<SearchResponse>;
