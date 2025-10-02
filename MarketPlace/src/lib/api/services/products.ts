// Products API Service
// API service for product-related endpoints

import { apiClient } from '../client';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductSearchRequest,
  ProductSearchResponse,
} from '../types';

export class ProductsService {
  // Get all products with optional search parameters
  async getProducts(searchParams?: ProductSearchRequest): Promise<ProductSearchResponse> {
    const queryParams = new URLSearchParams();
    
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = queryParams.toString() 
      ? `/products?${queryParams.toString()}`
      : '/products';
    
    const response = await apiClient.get<ProductSearchResponse>(endpoint);
    return response.data;
  }

  // Get product by ID
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  }

  // Create new product
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post<Product>('/products', productData);
    return response.data;
  }

  // Update product
  async updateProduct(id: string, productData: UpdateProductRequest): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, productData);
    return response.data;
  }

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }

  // Get products by seller
  async getProductsBySeller(sellerId: string, pagination?: { page?: number; limit?: number }): Promise<ProductSearchResponse> {
    const queryParams = new URLSearchParams();
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/products/seller/${sellerId}?${queryParams.toString()}`
      : `/products/seller/${sellerId}`;
    
    const response = await apiClient.get<ProductSearchResponse>(endpoint);
    return response.data;
  }

  // Get products by category
  async getProductsByCategory(category: string, pagination?: { page?: number; limit?: number }): Promise<ProductSearchResponse> {
    const queryParams = new URLSearchParams();
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/products/category/${category}?${queryParams.toString()}`
      : `/products/category/${category}`;
    
    const response = await apiClient.get<ProductSearchResponse>(endpoint);
    return response.data;
  }

  // Search products
  async searchProducts(searchParams: ProductSearchRequest): Promise<ProductSearchResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get<ProductSearchResponse>(`/products/search?${queryParams.toString()}`);
    return response.data;
  }

  // Get featured products
  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/products/featured?${queryParams.toString()}`
      : '/products/featured';
    
    const response = await apiClient.get<Product[]>(endpoint);
    return response.data;
  }

  // Get recent products
  async getRecentProducts(limit?: number): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/products/recent?${queryParams.toString()}`
      : '/products/recent';
    
    const response = await apiClient.get<Product[]>(endpoint);
    return response.data;
  }

  // Get product categories
  async getCategories(): Promise<Array<{ id: string; name: string; description?: string }>> {
    const response = await apiClient.get<Array<{ id: string; name: string; description?: string }>>('/products/categories');
    return response.data;
  }

  // Upload product image
  async uploadProductImage(file: File): Promise<{ url: string; thumbnailUrl?: string }> {
    const response = await apiClient.uploadFile<{ url: string; thumbnailUrl?: string }>('/products/upload-image', file);
    return response.data;
  }

  // Get product analytics (for sellers)
  async getProductAnalytics(productId: string): Promise<{
    views: number;
    likes: number;
    shares: number;
    orders: number;
    revenue: number;
  }> {
    const response = await apiClient.get<{
      views: number;
      likes: number;
      shares: number;
      orders: number;
      revenue: number;
    }>(`/products/${productId}/analytics`);
    return response.data;
  }
}

// Create default instance
export const productsService = new ProductsService();
