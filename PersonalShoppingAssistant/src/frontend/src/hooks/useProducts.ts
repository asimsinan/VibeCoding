/**
 * Product Hooks
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This file provides React hooks for product functionality
 * including product listing, search, filtering, and management.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { productService, Product, ProductFilter, ProductSearchParams } from '../api';
import { useApi, useApiWithParams, useApiMutation } from './useApi';

// Hook for product list with filtering
export function useProducts(filter: ProductFilter = {}) {
  const [debouncedFilter, setDebouncedFilter] = useState(filter);
  
  // Debounce the filter changes to prevent rapid re-renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 300); // Reduced debounce time for better UX
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [filter]);
  
  const apiCall = useCallback(
    (params: ProductFilter) => productService.getProducts(params),
    []
  );
  
  const result = useApiWithParams(apiCall, debouncedFilter);
  
  // Transform the data to extract products from the response
  const transformedResult = {
    ...result,
    data: result.data ? {
      ...result.data,
      products: result.data.products || []
    } : null,
    refetch: result.refetch // Explicitly include refetch function
  };
  
  return transformedResult;
}

// Hook for paginated products
export function usePaginatedProducts(initialPage: number = 1, initialLimit: number = 20) {
  return useApi(() => productService.getProducts({ page: initialPage, limit: initialLimit }));
}

// Hook for product search
export function useProductSearch(query: string, limit: number = 20, offset: number = 0) {
  const apiCall = useCallback(
    (params: ProductSearchParams) => productService.searchProducts(params),
    []
  );
  
  return useApiWithParams(
    apiCall,
    { q: query, limit, offset },
    { immediate: !!query }
  );
}

// Hook for single product
export function useProduct(id: number) {
  const apiCall = useCallback(
    (productId: number) => productService.getProduct(productId),
    []
  );
  
  return useApiWithParams(
    apiCall,
    id,
    { immediate: !!id }
  );
}

// Hook for product statistics
export function useProductStats(id: number) {
  const apiCall = useCallback(
    (productId: number) => productService.getProductStats(productId),
    []
  );
  
  return useApiWithParams(
    apiCall,
    id,
    { immediate: !!id }
  );
}

// Hook for product categories
export function useCategories() {
  const [data, setData] = useState<{ categories: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await productService.getCategories();
          
          if (response.success) {
            setData(response.data || null);
          } else {
            setError(response.error?.message || 'Failed to fetch categories');
          }
        } catch (err: any) {
          console.error('❌ useCategories: Error:', err);
          setError(err.message || 'Failed to fetch categories');
        } finally {
          setLoading(false);
        }
    };

    fetchCategories();
  }, []);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getCategories();
      if (response.success) {
        setData(response.data || null);
      } else {
        setError(response.error?.message || 'Failed to fetch categories');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refetch };
}

// Hook for product brands
export function useBrands() {
  const [data, setData] = useState<{ brands: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await productService.getBrands();
          
          if (response.success) {
            setData(response.data || null);
          } else {
            setError(response.error?.message || 'Failed to fetch brands');
          }
        } catch (err: any) {
          console.error('❌ useBrands: Error:', err);
          setError(err.message || 'Failed to fetch brands');
        } finally {
          setLoading(false);
        }
    };

    fetchBrands();
  }, []);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getBrands();
      if (response.success) {
        setData(response.data || null);
      } else {
        setError(response.error?.message || 'Failed to fetch brands');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refetch };
}

// Hook for popular products
export function usePopularProducts(limit: number = 10) {
  return useApiWithParams(
    (limit: number) => productService.getPopularProducts(limit),
    limit
  );
}

// Hook for products by category
export function useProductsByCategory(category: string, limit: number = 20, offset: number = 0) {
  return useApiWithParams(
    (params: { category: string; limit: number; offset: number }) => 
      productService.getProductsByCategory(params.category, params.limit, params.offset),
    { category, limit, offset },
    { immediate: !!category }
  );
}

// Hook for products by brand
export function useProductsByBrand(brand: string, limit: number = 20, offset: number = 0) {
  return useApiWithParams(
    (params: { brand: string; limit: number; offset: number }) => 
      productService.getProductsByBrand(params.brand, params.limit, params.offset),
    { brand, limit, offset },
    { immediate: !!brand }
  );
}

// Hook for products by price range
export function useProductsByPriceRange(minPrice: number, maxPrice: number, limit: number = 20, offset: number = 0) {
  return useApiWithParams(
    (params: { minPrice: number; maxPrice: number; limit: number; offset: number }) => 
      productService.getProductsByPriceRange(params.minPrice, params.maxPrice, params.limit, params.offset),
    { minPrice, maxPrice, limit, offset },
    { immediate: minPrice >= 0 && maxPrice >= 0 }
  );
}

// Hook for available products only
export function useAvailableProducts(limit: number = 20, offset: number = 0) {
  return useApiWithParams(
    (params: { limit: number; offset: number }) => 
      productService.getAvailableProducts(params.limit, params.offset),
    { limit, offset }
  );
}

// Hook for product creation (Admin)
export function useCreateProduct() {
  return useApiMutation(productService.createProduct);
}

// Hook for product update (Admin)
export function useUpdateProduct() {
  return useApiMutation((params: { id: number; updates: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">> }) => 
    productService.updateProduct(params.id, params.updates)
  );
}

// Hook for product deletion (Admin)
export function useDeleteProduct() {
  return useApiMutation(productService.deleteProduct);
}

// Hook for product filtering with state management
export function useProductFilter() {
  const [filter, setFilter] = useState<ProductFilter>({
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'ASC'
  });

  const { data, loading, error, refetch } = useProducts(filter);

  const updateFilter = useCallback((newFilter: Partial<ProductFilter>) => {
    setFilter(prev => ({
      ...prev,
      ...newFilter,
      page: 1 // Reset to first page when filter changes
    }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter({
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'ASC'
    });
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilter(prev => ({ ...prev, page }));
  }, []);

  const changeLimit = useCallback((limit: number) => {
    setFilter(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const sortBy = useCallback((field: string, order: 'ASC' | 'DESC' = 'ASC') => {
    setFilter(prev => ({ ...prev, sortBy: field, sortOrder: order, page: 1 }));
  }, []);

  const search = useCallback((query: string) => {
    setFilter(prev => ({ ...prev, search: query, page: 1 }));
  }, []);

  const filterByCategory = useCallback((category: string) => {
    setFilter(prev => ({ ...prev, category, page: 1 }));
  }, []);

  const filterByBrand = useCallback((brand: string) => {
    setFilter(prev => ({ ...prev, brand, page: 1 }));
  }, []);

  const filterByPriceRange = useCallback((minPrice: number, maxPrice: number) => {
    setFilter(prev => ({ ...prev, minPrice, maxPrice, page: 1 }));
  }, []);

  const filterByAvailability = useCallback((availability: boolean) => {
    setFilter(prev => ({ ...prev, availability, page: 1 }));
  }, []);

  return {
    filter,
    data,
    loading,
    error,
    refetch,
    updateFilter,
    resetFilter,
    goToPage,
    changeLimit,
    sortBy,
    search,
    filterByCategory,
    filterByBrand,
    filterByPriceRange,
    filterByAvailability,
  };
}

// Hook for product search with debouncing
export function useProductSearchWithDebounce(initialQuery: string = '', delay: number = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce the query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  const { data, loading, error, refetch } = useProductSearch(debouncedQuery);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    debouncedQuery,
    data,
    loading,
    error,
    refetch,
    updateQuery,
    clearQuery,
  };
}

// Hook for product comparison
export function useProductComparison() {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addProduct = useCallback(async (productId: number) => {
    if (selectedProducts.includes(productId)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await productService.getProduct(productId);
      if (response.success && response.data) {
        setSelectedProducts(prev => [...prev, productId]);
        setProducts(prev => [...prev, response.data!]);
      } else {
        setError('Failed to load product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [selectedProducts]);

  const removeProduct = useCallback((productId: number) => {
    setSelectedProducts(prev => prev.filter(id => id !== productId));
    setProducts(prev => prev.filter(product => product.id !== productId));
  }, []);

  const clearComparison = useCallback(() => {
    setSelectedProducts([]);
    setProducts([]);
  }, []);

  const isSelected = useCallback((productId: number) => {
    return selectedProducts.includes(productId);
  }, [selectedProducts]);

  const canAddMore = selectedProducts.length < 4; // Limit to 4 products

  return {
    selectedProducts,
    products,
    loading,
    error,
    addProduct,
    removeProduct,
    clearComparison,
    isSelected,
    canAddMore,
    count: selectedProducts.length,
  };
}

// Hook for product favorites
export function useProductFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => {
    const stored = localStorage.getItem('product_favorites');
    return stored ? JSON.parse(stored) : [];
  });

  const addToFavorites = useCallback((productId: number) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(productId) ? prev : [...prev, productId];
      localStorage.setItem('product_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const removeFromFavorites = useCallback((productId: number) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(id => id !== productId);
      localStorage.setItem('product_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const toggleFavorite = useCallback((productId: number) => {
    if (favorites.includes(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(productId);
    }
  }, [favorites, addToFavorites, removeFromFavorites]);

  const isFavorite = useCallback((productId: number) => {
    return favorites.includes(productId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem('product_favorites');
  }, []);

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    count: favorites.length,
  };
}
