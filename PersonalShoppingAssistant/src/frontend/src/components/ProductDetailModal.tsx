/**
 * Product Detail Modal Component
 * 
 * Displays detailed product information in a modal
 */

import React, { useCallback } from 'react';
import { Product } from '../api';
import { StarRating } from './StarRating';
import { useAuth } from '../hooks/useAuth';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { getProductImageUrl, getProductImageAlt } from '../services/productImages';

export interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
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
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onLike,
  onDislike,
  onAddToFavorites,
  onRemoveFromFavorites,
  onProductRating,
  isLiked = false,
  isDisliked = false,
  isFavorite = false,
  getProductRating,
  isRated
}) => {
  const { isAuthenticated } = useAuth();
  const { addError } = useErrorHandler();
  const handleLike = useCallback(() => {
    if (!isAuthenticated) {
      addError('info', 'Sign in required', 'Please sign in to like products');
      return;
    }
    
    if (product && onLike) {
      onLike(product);
    }
  }, [product, onLike, isAuthenticated, addError]);

  const handleDislike = useCallback(() => {
    if (!isAuthenticated) {
      addError('info', 'Sign in required', 'Please sign in to dislike products');
      return;
    }
    
    if (product && onDislike) {
      onDislike(product);
    }
  }, [product, onDislike, isAuthenticated, addError]);

  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      addError('info', 'Sign in required', 'Please sign in to manage your favorites');
      return;
    }
    
    if (product) {
      if (isFavorite && onRemoveFromFavorites) {
        onRemoveFromFavorites(product);
      } else if (!isFavorite && onAddToFavorites) {
        onAddToFavorites(product);
      }
    }
  }, [product, isFavorite, onAddToFavorites, onRemoveFromFavorites, isAuthenticated, addError]);

  const handleRating = useCallback((rating: number) => {
    if (!isAuthenticated) {
      addError('info', 'Sign in required', 'Please sign in to rate products');
      return;
    }
    
    if (product && onProductRating) {
      onProductRating(product, rating);
    }
  }, [product, onProductRating, isAuthenticated, addError]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Product Image */}
          <div className="lg:w-1/2">
            <div className="relative">
              <img
                src={getProductImageUrl(product.id)}
                alt={getProductImageAlt(product.id)}
                className="w-full h-64 lg:h-full object-cover rounded-t-lg lg:rounded-l-lg lg:rounded-t-none"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('data:image/svg+xml')) {
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                  }
                }}
              />
              
              {/* Favorite Button */}
              <button
                onClick={handleFavorite}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <svg 
                  className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                  fill={isFavorite ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:w-1/2 p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
                {product.rating && (
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating!) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({product.rating.toFixed(1)})</span>
                  </div>
                )}
              </div>

              {/* User Rating Section */}
              {onProductRating && getProductRating && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                  <StarRating
                    rating={getProductRating(product.id.toString())}
                    onRatingChange={handleRating}
                    size="md"
                    interactive={isAuthenticated}
                    showValue={true}
                  />
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  {product.brand}
                </span>
                {product.style && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {product.style}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  product.availability 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.availability ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  !isAuthenticated
                    ? 'bg-gray-100 text-gray-400 border border-gray-300 opacity-50 cursor-not-allowed'
                    : isLiked 
                      ? 'bg-green-100 text-green-600 border border-green-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600 border border-gray-300'
                }`}
                disabled={!isAuthenticated}
                title={isAuthenticated ? (isLiked ? 'Remove like' : 'Like this product') : 'Sign in to like products'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                onClick={handleDislike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  !isAuthenticated
                    ? 'bg-gray-100 text-gray-400 border border-gray-300 opacity-50 cursor-not-allowed'
                    : isDisliked 
                      ? 'bg-red-100 text-red-600 border border-red-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 border border-gray-300'
                }`}
                disabled={!isAuthenticated}
                title={isAuthenticated ? (isDisliked ? 'Remove dislike' : 'Dislike this product') : 'Sign in to dislike products'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.834a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                </svg>
                <span>{isDisliked ? 'Disliked' : 'Dislike'}</span>
              </button>

              <button
                onClick={handleFavorite}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  !isAuthenticated
                    ? 'bg-gray-100 text-gray-400 border border-gray-300 opacity-50 cursor-not-allowed'
                    : isFavorite 
                      ? 'bg-red-100 text-red-600 border border-red-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 border border-gray-300'
                }`}
                disabled={!isAuthenticated}
                title={isAuthenticated ? (isFavorite ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to manage favorites'}
              >
                <svg 
                  className="w-4 h-4" 
                  fill={isFavorite ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
