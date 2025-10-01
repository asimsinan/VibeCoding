/**
 * Product Service
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This service handles all product-related API calls
 * including product listing, search, filtering, and analytics.
 */

import { apiClient, ApiResponse } from '../client';

// Types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrl?: string;
  availability: boolean;
  style?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  priceMin?: number;
  priceMax?: number;
  availability?: boolean;
  available?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  minRating?: number;
  style?: string;
}

export interface ProductSearchParams {
  q: string;
  limit?: number;
  offset?: number;
}

export interface ProductStats {
  views: number;
  likes: number;
  purchases: number;
  averageRating: number;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: ProductFilter;
}

export interface ProductSearchResponse {
  products: Product[];
  query: string;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CategoriesResponse {
  categories: string[];
}

export interface BrandsResponse {
  brands: string[];
}

class ProductService {
  public readonly basePath = '/products';

  /**
   * Get products with optional filtering and pagination
   */
  async getProducts(filter: ProductFilter = {}): Promise<ApiResponse<ProductListResponse>> {
    const params = new URLSearchParams();
    
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.category) params.append('category', filter.category);
    if (filter.brand) params.append('brand', filter.brand);
    if (filter.minPrice !== undefined) params.append('minPrice', filter.minPrice.toString());
    if (filter.maxPrice !== undefined) params.append('maxPrice', filter.maxPrice.toString());
    if (filter.minRating !== undefined) params.append('minRating', filter.minRating.toString());
    if (filter.availability !== undefined) params.append('availability', filter.availability.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);

    const queryString = params.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    return apiClient.get(url);
  }

  /**
   * Search products by query
   */
  async searchProducts(params: ProductSearchParams): Promise<ApiResponse<ProductSearchResponse>> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    return apiClient.get(`${this.basePath}/search?${searchParams.toString()}`);
  }

  /**
   * Get product by ID
   */
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Get product statistics
   */
  async getProductStats(id: number): Promise<ApiResponse<ProductStats>> {
    return apiClient.get(`${this.basePath}/${id}/stats`);
  }

  /**
   * Get all product categories
   */
  async getCategories(): Promise<ApiResponse<CategoriesResponse>> {
    return apiClient.get(`${this.basePath}/categories`);
  }

  /**
   * Get all product brands
   */
  async getBrands(): Promise<ApiResponse<BrandsResponse>> {
    return apiClient.get(`${this.basePath}/brands`);
  }

  /**
   * Get popular products
   */
  async getPopularProducts(limit: number = 10): Promise<ApiResponse<{ products: Product[] }>> {
    return apiClient.get(`${this.basePath}/popular?limit=${limit}`);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, limit: number = 20, offset: number = 0): Promise<ApiResponse<{ products: Product[] }>> {
    return apiClient.get(`${this.basePath}?category=${encodeURIComponent(category)}&limit=${limit}&offset=${offset}`);
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(brand: string, limit: number = 20, offset: number = 0): Promise<ApiResponse<{ products: Product[] }>> {
    return apiClient.get(`${this.basePath}?brand=${encodeURIComponent(brand)}&limit=${limit}&offset=${offset}`);
  }

  /**
   * Get products by price range
   */
  async getProductsByPriceRange(minPrice: number, maxPrice: number, limit: number = 20, offset: number = 0): Promise<ApiResponse<{ products: Product[] }>> {
    return apiClient.get(`${this.basePath}?minPrice=${minPrice}&maxPrice=${maxPrice}&limit=${limit}&offset=${offset}`);
  }

  /**
   * Get available products only
   */
  async getAvailableProducts(limit: number = 20, offset: number = 0): Promise<ApiResponse<{ products: Product[] }>> {
    return apiClient.get(`${this.basePath}?availability=true&limit=${limit}&offset=${offset}`);
  }

  /**
   * Create product (Admin only)
   */
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> {
    return apiClient.post(this.basePath, product);
  }

  /**
   * Update product (Admin only)
   */
  async updateProduct(id: number, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Product>> {
    return apiClient.put(`${this.basePath}/${id}`, updates);
  }

  /**
   * Delete product (Admin only)
   */
  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.basePath}/${id}`);
  }
}

// Export singleton instance
export const productService = new ProductService();
export default productService;
