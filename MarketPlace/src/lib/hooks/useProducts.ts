// Products Hook
// React hook for product data fetching and management

import { useState, useEffect, useCallback } from 'react';
import { productsService } from '../api/services/products';
import { Product, CreateProductRequest, UpdateProductRequest, ProductSearchRequest } from '../api/types';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

interface ProductsActions {
  fetchProducts: (searchParams?: ProductSearchRequest) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  createProduct: (productData: CreateProductRequest) => Promise<Product | null>;
  updateProduct: (id: string, productData: UpdateProductRequest) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<void>;
  clearError: () => void;
  clearProducts: () => void;
}

export function useProducts(): ProductsState & ProductsActions {
  const [state, setState] = useState<ProductsState>({
    products: [],
    isLoading: false,
    error: null,
    pagination: null,
  });

  const fetchProducts = useCallback(async (searchParams?: ProductSearchRequest) => {
    // Only run on client side
    if (typeof window === 'undefined') {return;}
    
    console.log('useProducts: fetchProducts called with searchParams:', searchParams);
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('useProducts: calling productsService.getProducts...');
      const response = await productsService.getProducts(searchParams);
      console.log('useProducts: received response:', response);
      console.log('useProducts: response.products:', response.products);
      console.log('useProducts: response.products length:', response.products?.length);
      setState(prev => ({
        ...prev,
        products: response.products || [],
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (error) {
      console.error('useProducts: error occurred:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        isLoading: false,
      }));
    }
  }, []);

  const fetchProduct = useCallback(async (id: string): Promise<Product | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const product = await productsService.getProductById(id);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return product;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const createProduct = useCallback(async (productData: CreateProductRequest): Promise<Product | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const product = await productsService.createProduct(productData);
      setState(prev => ({
        ...prev,
        products: [product, ...prev.products],
        isLoading: false,
      }));
      return product;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create product',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, productData: UpdateProductRequest): Promise<Product | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const product = await productsService.updateProduct(id, productData);
      setState(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === id ? product : p),
        isLoading: false,
      }));
      return product;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update product',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await productsService.deleteProduct(id);
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete product',
        isLoading: false,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearProducts = useCallback(() => {
    setState(prev => ({
      ...prev,
      products: [],
      pagination: null,
    }));
  }, []);

  return {
    ...state,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
    clearProducts,
  };
}

// Hook for single product
export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {return;}
    
    setIsLoading(true);
    setError(null);
    
    try {
      const productData = await productsService.getProductById(id);
      setProduct(productData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch product');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
}

// Hook for product search
export function useProductSearch() {
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const search = useCallback(async (searchParams: ProductSearchRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await productsService.searchProducts(searchParams);
      setSearchResults(response.products || []);
      setPagination(response.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setPagination(null);
    setError(null);
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    pagination,
    search,
    clearResults,
  };
}
