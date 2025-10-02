'use client';

// Product List Component
// Component for displaying a list of products with API integration

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '../../lib/hooks/useProducts';
import { ProductCard } from './ProductCard/ProductCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ProductSearchRequest } from '../../lib/api/types';
import { useCart } from '../../lib/contexts/CartContext';

interface ProductListProps {
  searchParams?: ProductSearchRequest;
  onProductView?: (product: any) => void;
  className?: string;
}

export function ProductList({
  searchParams,
  onProductView,
  className = '',
}: ProductListProps) {
  console.log('ProductList: Component rendered with searchParams:', searchParams);
  
  const router = useRouter();
  const { addToCart } = useCart();
  const {
    products,
    isLoading,
    error,
    pagination,
    fetchProducts,
    clearError,
  } = useProducts();
  
  console.log('ProductList: Current state - products:', products, 'isLoading:', isLoading, 'error:', error);

  // Fetch products when component mounts or search params change
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {return;}
    
    console.log('ProductList: useEffect triggered with searchParams:', searchParams);
    fetchProducts(searchParams);
  }, [fetchProducts, searchParams]);

  const handleProductView = (productId: string) => {
    if (onProductView) {
      // Find the product by ID and call the callback
      const product = products?.find(p => p.id === productId);
      if (product) {
        onProductView(product);
      }
    } else {
      // Default behavior: navigate to product details page
      router.push(`/products/${productId}`);
    }
  };

  const handleAddToCart = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      addToCart({
        id: product.id,
        title: product.title,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        images: product.images || [],
        seller: product.seller || { id: 'unknown', username: 'Unknown Seller' }
      });
    }
  };


  // Handle loading state
  if (isLoading && (!products || products.length === 0)) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={className}>
        <ErrorMessage error={error} onDismiss={clearError} />
      </div>
    );
  }

  // Handle empty products state
  if (!products || products.length === 0) {
    console.log('ProductList: Rendering empty state - products:', products, 'isLoading:', isLoading, 'error:', error);
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or create a new product.
          </p>
          <div className="mt-4 text-xs text-gray-400">
            Debug: products={JSON.stringify(products)}, isLoading={isLoading}, error={error}
            <br />
            SearchParams: {JSON.stringify(searchParams)}
            <br />
            Products length: {products?.length || 0}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Loading overlay for updates */}
      {isLoading && products && products.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products && products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              seller: product.seller || { id: 'unknown', username: 'Unknown Seller' }
            }}
            onViewDetails={handleProductView}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {/* Pagination Info */}
      {pagination && products && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {products.length} of {pagination.total} products
          {pagination.totalPages > 1 && (
            <span> (Page {pagination.page} of {pagination.totalPages})</span>
          )}
        </div>
      )}
    </div>
  );
}
