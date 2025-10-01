/**
 * Product List Component
 * TASK-021: UI-API Connection Implementation
 * 
 * Displays a grid of products with filtering, search, and pagination capabilities.
 */

import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect, memo } from 'react';
import { Product, ProductFilter } from '../api';
import { useApp } from '../contexts/AppContext';
import { useSimpleData } from '../hooks/useSimpleData';
import { productService } from '../api/services/productService';
import { ProductCard } from './ProductCard';
import { ProductFilters } from './ProductFilters';
import { SearchBar } from './SearchBar';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export interface ProductListProps {
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
  onRefetchReady?: (refetch: () => void) => void;
  isVisible?: boolean;
  shouldRefresh?: boolean; // New prop to trigger refresh
}

const ProductListComponent: React.FC<ProductListProps> = ({
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
  onRefetchReady,
  isVisible = true,
  shouldRefresh = false,
}) => {
  const { isProductLiked, isProductDisliked, isProductFavorite } = useApp();
  
  // Use props if provided, otherwise fall back to app context
  const isLiked = propIsLiked || isProductLiked;
  const isDisliked = propIsDisliked || isProductDisliked;
  const isFavorite = propIsFavorite || isProductFavorite;
  const getProductRating = propGetProductRating || (() => 0);
  const isRated = propIsRated || (() => false);
  // Simple state management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilter>({
    page: 1,
    limit: 12,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Memoize the API call to prevent infinite loops
  const apiCall = useCallback(() => {
    console.log('🔄 ProductList: Making API call with filters:', { ...filters, search: searchQuery || undefined });
    return productService.getProducts({ ...filters, search: searchQuery || undefined });
  }, [filters, searchQuery]);

  // Simple data loading with memoized API call
  const { data: productsData, loading: isLoading, error, refresh } = useSimpleData(
    apiCall,
    true
  );

  const products = useMemo(() => productsData?.data?.products || [], [productsData?.data?.products]);

  // Refresh when shouldRefresh prop changes (browse tab clicked)
  useEffect(() => {
    if (shouldRefresh) {
      refresh();
    }
  }, [shouldRefresh, refresh]);


  // Expose refetch function to parent component
  useLayoutEffect(() => {
    if (onRefetchReady) {
      onRefetchReady(refresh);
    }
  }, [onRefetchReady, refresh]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // The useSimpleData hook will automatically refresh when searchQuery changes
    // due to the memoized apiCall dependency
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<ProductFilter>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
    // The useSimpleData hook will automatically refresh when filters change
    // due to the memoized apiCall dependency
  }, []);

  const handleSortChange = useCallback((newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setFilters(prev => ({
      ...prev,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
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

  // Sort products client-side if needed
  const sortedProducts = React.useMemo(() => {
    if (!products || !products.length) return products || [];
    
    return [...products].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });
  }, [products, sortBy, sortOrder]);

  if (error) {
    return (
      <div className={`p-8 ${className}`}>
        <ErrorMessage 
          message={error} 
          onRetry={refresh}
        />
      </div>
    );
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`space-y-6 no-flicker stable-content smooth-transition ${className}`}>
      {/* Header with Search and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search products..."
            className="w-full"
          />
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy, sortOrder)}
                className="px-3 py-1 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="createdAt">Date Added</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => handleSortChange(sortBy, sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm transition-colors flex items-center gap-1 ${
                sortOrder === 'DESC' 
                  ? 'bg-gray-100 text-gray-800 border-gray-400' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={`Sort ${sortOrder === 'ASC' ? 'descending' : 'ascending'}`}
              title={`Currently sorting ${sortOrder === 'ASC' ? 'ascending' : 'descending'}. Click to sort ${sortOrder === 'ASC' ? 'descending' : 'ascending'}.`}
            >
              <svg 
                className={`w-4 h-4 transform transition-transform ${sortOrder === 'DESC' ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-xs font-medium">
                {sortOrder === 'ASC' ? 'A-Z' : 'Z-A'}
              </span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'}`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'}`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        className="bg-gray-50 p-4 rounded-lg"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="loading-stable no-flicker">
          <LoadingSpinner size="large" />
        </div>
      )}

      {/* Products Grid/List */}
      {!isLoading && (
        <>
          {sortedProducts.length > 0 ? (
            <div className={`${
              viewMode === 'grid' 
                ? 'product-grid no-flicker smooth-transition' 
                : 'space-y-4 no-flicker smooth-transition'
            }`}>
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
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
                  className={viewMode === 'list' ? 'flex flex-row' : ''}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                {searchQuery ? 'No products found matching your search' : 'No products available'}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {!searchQuery && productsData?.data?.pagination && (
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={filters.page || 1}
                totalPages={Math.ceil((productsData.data.pagination.total || 0) / (filters.limit || 12))}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ProductList = memo(ProductListComponent);

export default ProductList;
