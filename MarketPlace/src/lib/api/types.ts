// API Types
// Type definitions for API client and responses

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  success: boolean;
}

export class ApiError extends Error {
  endpoint: string;
  status?: number;
  response?: any;

  constructor(message: string, endpoint: string, stack?: string) {
    super(message);
    this.name = 'ApiError';
    this.endpoint = endpoint;
    this.stack = stack || '';
  }
}

export interface RequestConfig {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresAt: number;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    profile?: UserProfile;
  };
  tokens: AuthTokens;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  tokens: AuthTokens;
}

// User types
export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  transactionNotifications: boolean;
  productNotifications: boolean;
  orderNotifications: boolean;
  systemNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    username: string;
    profile?: UserProfile;
  };
}

export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: string;
  isAvailable?: boolean;
}

export interface ProductSearchRequest {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSearchResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Order types
export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  buyer?: {
    id: string;
    username: string;
    profile?: UserProfile;
  };
  seller?: {
    id: string;
    username: string;
    profile?: UserProfile;
  };
  product?: Product;
}

export interface CreateOrderRequest {
  productId: string;
  amount: number;
  currency?: string;
}

export interface UpdateOrderRequest {
  status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
}

// Payment types
export interface PaymentIntent {
  id: string;
  stripeId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  clientSecret: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;
  currency?: string;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'PURCHASE_CONFIRMATION' | 'SALE_CONFIRMATION' | 'PRODUCT_SOLD' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'PAYMENT_RECEIVED' | 'LISTING_UPDATED' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId: string;
  type: 'PURCHASE_CONFIRMATION' | 'SALE_CONFIRMATION' | 'PRODUCT_SOLD' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'PAYMENT_RECEIVED' | 'LISTING_UPDATED' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  data?: any;
}

export interface UpdateNotificationRequest {
  isRead?: boolean;
}

// Image upload types
export interface ImageUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface UploadImageRequest {
  file: File;
}

export interface UploadImageResponse {
  image: ImageUpload;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  validationErrors?: ValidationError[];
  timestamp: string;
  path: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis?: 'healthy' | 'unhealthy';
    stripe?: 'healthy' | 'unhealthy';
  };
}
