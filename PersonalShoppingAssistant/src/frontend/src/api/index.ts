/**
 * API Services Index
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This file exports all API services and provides a centralized
 * way to access all API functionality.
 */

// Import services for default export
import { apiClient } from './client';
import { authService } from './services/authService';
import { productService } from './services/productService';
import { interactionService } from './services/interactionService';
import { recommendationService } from './services/recommendationService';

// Export API client
export { apiClient, TokenManager } from './client';
export type { ApiResponse, ApiError } from './client';

// Export all services
export { authService } from './services/authService';
export { productService } from './services/productService';
export { interactionService } from './services/interactionService';
export { recommendationService } from './services/recommendationService';

// Export service types
export type {
  User,
  UserProfile,
  UserPreferences,
  RegisterData,
  LoginData,
  UpdateProfileData,
  AuthResponse
} from './services/authService';

export type {
  Product,
  ProductFilter,
  ProductSearchParams,
  ProductStats,
  ProductListResponse,
  ProductSearchResponse,
  CategoriesResponse,
  BrandsResponse
} from './services/productService';

export type {
  Interaction,
  InteractionType,
  InteractionCreateData,
  InteractionStats,
  UserAnalytics,
  ProductAnalytics,
  InteractionListResponse,
  RecentInteractionsResponse,
  InteractionHistoryResponse,
  RecommendationHistoryResponse,
  TopProductsResponse
} from './services/interactionService';

export type {
  Recommendation,
  RecommendationAlgorithm,
  RecommendationParams,
  RecommendationResponse,
  RecommendationScoreResponse,
  RecommendationStats,
  RefreshResponse
} from './services/recommendationService';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://personal-shopping-assistant.vercel.app',
  VERSION: process.env.REACT_APP_API_VERSION || 'v1',
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
  RETRY_ATTEMPTS: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS || '3', 10),
  RETRY_DELAY: parseInt(process.env.REACT_APP_API_RETRY_DELAY || '1000', 10),
} as const;

// API Health Check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health');
    return response.success;
  } catch {
    return false;
  }
};

// API Error Handler
export const handleApiError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};

// API Response Helper
export const isApiSuccess = (response: any): response is { success: true; data: any } => {
  return response && response.success === true;
};

// API Loading States
export const createLoadingState = () => ({
  loading: false,
  error: null as string | null,
  data: null as any,
});

// API Hook Helper Types
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}


// Default export with all services
const api = {
  auth: authService,
  products: productService,
  interactions: interactionService,
  recommendations: recommendationService,
  client: apiClient,
  config: API_CONFIG,
  health: checkApiHealth,
  errorHandler: handleApiError,
  isSuccess: isApiSuccess,
  createLoadingState,
};

export default api;
