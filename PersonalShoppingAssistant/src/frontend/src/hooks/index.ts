/**
 * Hooks Index
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This file exports all React hooks for API integration
 * and provides a centralized way to access all hook functionality.
 */

// Export API hooks
export {
  useApi,
  useApiWithParams,
  usePaginatedApi,
  useApiMutation,
  useApiPolling,
} from './useApi';

// Export API hook types
export type { UseApiState, UseApiOptions } from './useApi';

// Export authentication hooks
export {
  AuthProvider,
  useAuth,
  useUserProfile,
  useUpdateProfile,
  useUpdatePreferences,
  useLogin,
  useRegister,
  useLogout,
  useAuthStatus,
  useRequireAuth,
  useUserPreferences,
  useUserStats,
} from './useAuth';

// Export product hooks
export {
  useProducts,
  usePaginatedProducts,
  useProductSearch,
  useProduct,
  useProductStats,
  useCategories,
  useBrands,
  usePopularProducts,
  useProductsByCategory,
  useProductsByBrand,
  useProductsByPriceRange,
  useAvailableProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductFilter,
  useProductSearchWithDebounce,
  useProductComparison,
  useProductFavorites,
} from './useProducts';

// Export interaction hooks
export {
  useUserInteractions,
  useInteractionStats,
  useUserAnalytics,
  useRecentInteractions,
  useInteractionHistory,
  useRecommendationHistory,
  useTopProducts,
  useRecordInteraction,
  useUpdateInteraction,
  useDeleteInteraction,
  useRecordView,
  useRecordLike,
  useRecordDislike,
  useRecordPurchase,
  useInteractionTracker,
  useInteractionAnalytics,
  useInteractionHistoryWithFilter,
  useBatchInteractionRecorder,
} from './useInteractions';

// Export recommendation hooks
export {
  useRecommendations,
  useCollaborativeRecommendations,
  useContentBasedRecommendations,
  useHybridRecommendations,
  usePopularityRecommendations,
  useRecommendationScore,
  useRecommendationStats,
  useRefreshRecommendations,
  useRecommendationComparison,
  useRecommendationExplanation,
  useRecommendationFreshness,
  useRecommendationQuality,
  useRecommendationPolling,
  useRecommendationManager,
  useRecommendationFilter,
} from './useRecommendations';

// Export hook types from their respective modules
export type { AuthContextType } from './useAuth';