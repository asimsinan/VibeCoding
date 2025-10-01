/**
 * Product Card Component
 * TASK-022: API Data Flow Integration
 * 
 * Displays individual product information in a card format
 * with interaction capabilities and responsive design.
 * Enhanced with real-time interaction tracking and state management.
 */

import React, { useCallback } from 'react';
import { Product } from '../api';
import { useApp } from '../contexts/AppContext';
import { useInteractionTracker } from '../services/interactionTracker';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuth } from '../hooks/useAuth';
import { StarRating } from './StarRating';
import { getProductImageUrl, getProductImageAlt } from '../services/productImages';

export interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  onLike?: (product: Product) => void;
  onDislike?: (product: Product) => void;
  onAddToFavorites?: (product: Product) => void;
  onRemoveFromFavorites?: (product: Product) => void;
  onProductRating?: (product: Product, rating: number) => void;
  isLiked?: boolean;
  isDisliked?: boolean;
  isFavorite?: boolean;
  getProductRating?: (productId: string) => number;
  isRated?: (productId: string) => boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onView,
  onLike,
  onDislike,
  onAddToFavorites,
  onRemoveFromFavorites,
  onProductRating,
  isLiked: propIsLiked,
  isDisliked: propIsDisliked,
  isFavorite = false,
  getProductRating,
  isRated,
  className = '',
}) => {
  const { trackProductView, trackProductLike, trackProductDislike, isProductLiked, isProductDisliked } = useApp();
  const { isAuthenticated } = useAuth();
  const interactionTracker = useInteractionTracker();
  const { addError } = useErrorHandler();

  // Use app state if not provided as props
  const isLiked = propIsLiked ?? isProductLiked(product.id.toString());
  const isDisliked = propIsDisliked ?? isProductDisliked(product.id.toString());

  // Enhanced handlers with tracking
  const handleView = useCallback(() => {
    try {
      // Track interaction
      interactionTracker.trackProductView(product.id.toString(), {
        productName: product.name,
        category: product.category,
        price: product.price,
      });
      
      // Update app state
      trackProductView(product.id.toString());
      
      // Call original handler
      onView?.(product);
    } catch (error) {
      addError('error', 'Failed to track product view', 'Unable to record your interaction with this product');
    }
  }, [product, onView, interactionTracker, trackProductView, addError]);

  const handleLike = useCallback(() => {
    if (!isAuthenticated) {
      addError('info', 'Sign in required', 'Please sign in to like products');
      return;
    }
    
    try {
      // Track interaction
      interactionTracker.trackProductLike(product.id.toString(), {
        productName: product.name,
        category: product.category,
        price: product.price,
      });
      
      // Update app state
      trackProductLike(product.id.toString());
      
      // Call original handler
      onLike?.(product);
    } catch (error) {
      addError('error', 'Failed to track product like', 'Unable to record your preference for this product');
    }
  }, [product, onLike, interactionTracker, trackProductLike, addError, isAuthenticated]);

  const handleDislike = useCallback(() => {
    if (!isAuthenticated) {
      addError('info', 'Sign in required', 'Please sign in to dislike products');
      return;
    }
    
    try {
      // Track interaction
      interactionTracker.trackProductDislike(product.id.toString(), {
        productName: product.name,
        category: product.category,
        price: product.price,
      });
      
      // Update app state
      trackProductDislike(product.id.toString());
      
      // Call original handler
      onDislike?.(product);
    } catch (error) {
      addError('error', 'Failed to track product dislike', 'Unable to record your preference for this product');
    }
  }, [product, onDislike, interactionTracker, trackProductDislike, addError, isAuthenticated]);

  const handleAddToFavorites = useCallback(() => {
    if (!isAuthenticated) {
      addError('info', 'Sign in required', 'Please sign in to add products to your favorites');
      return;
    }
    
    try {
      onAddToFavorites?.(product);
    } catch (error) {
      addError('error', 'Failed to add to favorites', 'Unable to add this product to your favorites');
    }
  }, [product, onAddToFavorites, addError, isAuthenticated]);

  const handleRemoveFromFavorites = useCallback(() => {
    if (!isAuthenticated) {
      addError('info', 'Sign in required', 'Please sign in to manage your favorites');
      return;
    }
    
    try {
      onRemoveFromFavorites?.(product);
    } catch (error) {
      addError('error', 'Failed to remove from favorites', 'Unable to remove this product from your favorites');
    }
  }, [product, onRemoveFromFavorites, addError, isAuthenticated]);

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      handleRemoveFromFavorites();
    } else {
      handleAddToFavorites();
    }
  }, [isFavorite, handleAddToFavorites, handleRemoveFromFavorites]);

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer ${className}`}
      onClick={handleView}
    >
      {/* Product Image */}
      <div className="relative">
        <img
          src={getProductImageUrl(product.id)}
          alt={getProductImageAlt(product.id)}
          className="w-full h-48 object-cover rounded-t-lg"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Set fallback image if the main image fails to load
            if (!target.src.includes('data:image/svg+xml')) {
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
            }
          }}
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-md transition-colors ${
            isAuthenticated 
              ? 'hover:bg-gray-50' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          aria-label={isAuthenticated ? (isFavorite ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to manage favorites'}
          disabled={!isAuthenticated}
        >
          <svg
            className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="mb-2">
          <span className="text-xl font-bold text-green-600">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Ratings */}
        <div className="mb-3 space-y-1">
          {/* Product's average rating */}
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <span className="ml-1 text-sm text-gray-600">
              Avg: {product.rating?.toFixed(1) || 'N/A'}
            </span>
          </div>
          
          {/* User's rating */}
          {onProductRating && getProductRating && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Your rating:</span>
              <StarRating
                rating={getProductRating(product.id.toString())}
                onRatingChange={(rating) => onProductRating(product, rating)}
                size="sm"
                interactive={isAuthenticated}
                showValue={true}
              />
            </div>
          )}
        </div>

        {/* Category and Brand */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {product.category}
          </span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
            {product.brand}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={`p-2 rounded-full transition-colors ${
                !isAuthenticated
                  ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                  : isLiked 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
              }`}
              aria-label={isAuthenticated ? "Like product" : "Sign in to like products"}
              disabled={!isAuthenticated}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDislike();
              }}
              className={`p-2 rounded-full transition-colors ${
                !isAuthenticated
                  ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                  : isDisliked 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
              }`}
              aria-label={isAuthenticated ? "Dislike product" : "Sign in to dislike products"}
              disabled={!isAuthenticated}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.834a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleView}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
