/**
 * Recommendation List Component
 * TASK-021: UI-API Connection Implementation
 * 
 * Displays personalized product recommendations with different algorithms
 * and interaction capabilities.
 */

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { Product, RecommendationAlgorithm } from '../api';
import { useCollaborativeRecommendations, useContentBasedRecommendations, useHybridRecommendations, usePopularityRecommendations } from '../hooks';
import { useAuth } from '../hooks/useAuth';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export interface RecommendationListProps {
  onProductView?: (product: Product) => void;
  onProductLike?: (product: Product) => void;
  onProductDislike?: (product: Product) => void;
  onProductFavorite?: (product: Product) => void;
  onProductRating?: (product: Product, rating: number) => void;
  isLiked?: (productId: string) => boolean;
  isDisliked?: (productId: string) => boolean;
  isFavorite?: (productId: string) => boolean;
  getProductRating?: (productId: string) => number;
  isRated?: (productId: string) => boolean;
  className?: string;
}

const ALGORITHM_OPTIONS: { value: RecommendationAlgorithm; label: string; description: string }[] = [
  { value: 'collaborative', label: 'Collaborative', description: 'Based on similar users' },
  { value: 'content_based', label: 'Content-Based', description: 'Based on your likes + product similarity' },
  { value: 'hybrid', label: 'Hybrid', description: 'Combines multiple approaches' },
  { value: 'popularity', label: 'Popular', description: 'Most popular products' },
];

const RecommendationListComponent: React.FC<RecommendationListProps> = ({
  onProductView,
  onProductLike,
  onProductDislike,
  onProductFavorite,
  onProductRating,
  isLiked: propIsLiked,
  isDisliked: propIsDisliked,
  isFavorite: propIsFavorite,
  getProductRating: propGetProductRating,
  isRated: propIsRated,
  className = '',
}) => {
  console.log('🔄 RecommendationList: Component rendering');
  const { isAuthenticated } = useAuth();
  console.log('🔄 RecommendationList: isAuthenticated:', isAuthenticated);
  
  // Add error state for component-level error handling
  const [componentError, setComponentError] = useState<string | null>(null);
  
  // Use props if provided, otherwise use default functions
  const isLiked = propIsLiked || (() => false);
  const isDisliked = propIsDisliked || (() => false);
  const isFavorite = propIsFavorite || (() => false);
  const getProductRating = propGetProductRating || (() => 0);
  const isRated = propIsRated || (() => false);
  
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<RecommendationAlgorithm>('content_based');
  const [limit, setLimit] = useState(12);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Use only the hook for the currently selected algorithm to avoid rate limiting
  // Always call hooks but with limit 0 when not needed to avoid rate limiting
  const hybridResult = useHybridRecommendations(isAuthenticated && selectedAlgorithm === 'hybrid' ? limit : 0);
  const collaborativeResult = useCollaborativeRecommendations(isAuthenticated && selectedAlgorithm === 'collaborative' ? limit : 0);
  const contentBasedResult = useContentBasedRecommendations(isAuthenticated && selectedAlgorithm === 'content_based' ? limit : 0);
  const popularityResult = usePopularityRecommendations(isAuthenticated && selectedAlgorithm === 'popularity' ? limit : 0);

  // Get current data based on selected algorithm (memoized)
  const currentData = useMemo(() => {
    try {
      // If user is not authenticated, return empty data without loading
      if (!isAuthenticated) {
        return {
          data: { recommendations: [] },
          loading: false,
          error: null,
          refetch: () => Promise.resolve()
        };
      }
      
      switch (selectedAlgorithm) {
        case 'collaborative':
          return collaborativeResult;
        case 'content_based':
          return contentBasedResult;
        case 'hybrid':
          return hybridResult;
        case 'popularity':
          return popularityResult;
        default:
          return contentBasedResult;
      }
    } catch (error) {
      console.error('❌ Error in recommendation data processing:', error);
      setComponentError('Failed to process recommendation data. Please try again.');
      return {
        data: { recommendations: [] },
        loading: false,
        error: 'Failed to process recommendation data',
        refetch: () => Promise.resolve()
      };
    }
  }, [isAuthenticated, selectedAlgorithm, hybridResult, collaborativeResult, contentBasedResult, popularityResult]);

  const { data, loading, error, refetch } = currentData;
  const isLoading = loading;
  
  console.log('🔄 RecommendationList: Data state:', { 
    data: data?.recommendations?.length || 0, 
    loading, 
    error, 
    isAuthenticated,
    componentError 
  });
  
  // Memoize recommendations and products to prevent unnecessary re-renders
  const recommendations = useMemo(() => data?.recommendations || [], [data?.recommendations]);
  
  // Create enriched recommendations with product data
  const enrichedRecommendations = useMemo(() => {
    const validRecommendations = recommendations.filter(rec => {
      if (!rec) {
        return false;
      }
      if (!rec.product) {
        return false;
      }
      return true;
    });
    
    return validRecommendations;
  }, [recommendations]);
  
  const products = useMemo(() => {
    const productList = enrichedRecommendations.map(rec => rec.product);
    return productList;
  }, [enrichedRecommendations]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  const handleAlgorithmChange = useCallback((algorithm: RecommendationAlgorithm) => {
    setSelectedAlgorithm(algorithm);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const handleProductView = useCallback((product: Product) => {
    onProductView?.(product);
  }, [onProductView]);

  const handleProductLike = useCallback((product: Product) => {
    onProductLike?.(product);
  }, [onProductLike]);

  const handleProductDislike = useCallback((product: Product) => {
    onProductDislike?.(product);
  }, [onProductDislike]);

  const handleProductFavorite = useCallback((product: Product) => {
    onProductFavorite?.(product);
  }, [onProductFavorite]);

  if (error || componentError) {
    return (
      <div className={`p-8 ${className}`}>
        <ErrorMessage 
          message={error || componentError || 'An unknown error occurred'} 
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 no-flicker stable-content smooth-transition ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
          <p className="text-gray-600 mt-1">
            Personalized product recommendations based on your preferences
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Algorithm Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Algorithm:</label>
            <div className="relative">
              <select
                value={selectedAlgorithm}
                onChange={(e) => handleAlgorithmChange(e.target.value as RecommendationAlgorithm)}
                className="px-3 py-1 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                {ALGORITHM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Refresh Controls - Only show when authenticated */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            
              <button
                onClick={handleToggleAutoRefresh}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {autoRefresh ? 'Auto On' : 'Auto Off'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Algorithm Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              {ALGORITHM_OPTIONS.find(opt => opt.value === selectedAlgorithm)?.label} Recommendations
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {ALGORITHM_OPTIONS.find(opt => opt.value === selectedAlgorithm)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Results Count and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-gray-600">
          {isLoading ? 'Loading recommendations...' : `Showing ${products.length} recommendations`}
        </div>

        <div className="flex items-center gap-4">
          {/* Limit Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Show:</label>
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-3 py-1 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value={6}>6 products</option>
                <option value={12}>12 products</option>
                <option value={24}>24 products</option>
                <option value={48}>48 products</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Auto-refresh Interval */}
          {autoRefresh && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Refresh every:</label>
              <div className="relative">
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-1 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value={10000}>10 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={300000}>5 minutes</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Check */}
      {!isAuthenticated && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            Sign in to get personalized recommendations
          </div>
          <p className="text-gray-400 mb-4">
            Recommendations are personalized based on your preferences and interactions
          </p>
        </div>
      )}

      {/* Loading State */}
      {isAuthenticated && isLoading && (
        <div className="loading-stable no-flicker">
          <LoadingSpinner size="large" />
        </div>
      )}

      {/* Recommendations Grid */}
      {isAuthenticated && !isLoading && (
        <>
          {products.length > 0 ? (
            <div className="product-grid no-flicker smooth-transition">
              {products.map((product, index) => {
                if (!product || !product.id) return null; // Skip invalid products
                const recommendation = enrichedRecommendations.find(rec => rec && rec.product && rec.product.id === product.id);
                return (
                  <div key={product.id} className="relative">
                    {/* Recommendation Score Badge */}
                    {recommendation && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                          {Math.round(recommendation.score * 100)}% match
                        </div>
                      </div>
                    )}
                    
                    <ProductCard
                      product={product}
                      onView={handleProductView}
                      onLike={handleProductLike}
                      onDislike={handleProductDislike}
                      onAddToFavorites={handleProductFavorite}
                      onRemoveFromFavorites={handleProductFavorite}
                      isLiked={isLiked(product.id.toString())}
                      isDisliked={isDisliked(product.id.toString())}
                      isFavorite={isFavorite(product.id.toString())}
                      onProductRating={onProductRating}
                      getProductRating={getProductRating}
                      isRated={isRated}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                No recommendations available
              </div>
              <p className="text-gray-400 mb-4">
                Try interacting with some products to get personalized recommendations
              </p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Recommendations
              </button>
            </div>
          )}
        </>
      )}

      {/* Recommendation Stats */}
      {isAuthenticated && !isLoading && recommendations.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Recommendation Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Algorithm:</span>
              <span className="ml-2 font-medium">
                {ALGORITHM_OPTIONS.find(opt => opt.value === selectedAlgorithm)?.label}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Recommendations:</span>
              <span className="ml-2 font-medium">{recommendations.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Average Score:</span>
              <span className="ml-2 font-medium">
                {Math.round(
                  recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length * 100
                )}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const RecommendationList = memo(RecommendationListComponent);

export default RecommendationList;
