/**
 * API Mock Service
 * TASK-023: UI-API Integration Tests
 * 
 * Provides comprehensive API mocking for integration testing.
 */

import { Product, User, Recommendation, UserPreferences } from '../../api';

// Mock data
export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Test Product 1',
    description: 'A test product for integration testing',
    price: 99.99,
    category: 'electronics',
    brand: 'TestBrand',
    rating: 4.5,
    imageUrl: 'https://example.com/product1.jpg',
    inStock: true,
    style: 'modern',
  },
  {
    id: 2,
    name: 'Test Product 2',
    description: 'Another test product for integration testing',
    price: 149.99,
    category: 'clothing',
    brand: 'TestBrand2',
    rating: 4.2,
    imageUrl: 'https://example.com/product2.jpg',
    inStock: true,
    style: 'casual',
  },
];

export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

export const mockRecommendations: Recommendation[] = [
  {
    id: 1,
    userId: 1,
    productId: 1,
    score: 0.95,
    algorithm: 'content_based',
    createdAt: new Date('2023-01-01'),
    product: mockProducts[0],
  },
  {
    id: 2,
    userId: 1,
    productId: 2,
    score: 0.87,
    algorithm: 'collaborative',
    createdAt: new Date('2023-01-01'),
    product: mockProducts[1],
  },
];

export const mockUserPreferences: UserPreferences = {
  id: 1,
  userId: 1,
  categories: ['electronics', 'clothing'],
  brands: ['Apple', 'Nike'],
  priceRange: { min: 50, max: 200 },
  stylePreferences: ['modern', 'casual'],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

// API Mock Implementation
export class ApiMock {
  private products: Product[] = [...mockProducts];
  private user: User | null = null;
  private recommendations: Recommendation[] = [...mockRecommendations];
  private userPreferences: UserPreferences = { ...mockUserPreferences };
  private delay: number = 100; // Simulate network delay

  // Set delay for testing
  setDelay(delay: number) {
    this.delay = delay;
  }

  // Simulate network delay
  private async delayResponse<T>(data: T): Promise<T> {
    return new Promise(resolve => {
      setTimeout(() => resolve(data), this.delay);
    });
  }

  // Simulate API error
  private async simulateError(message: string, status: number = 500) {
    await this.delayResponse(undefined);
    throw {
      response: {
        status,
        data: { message },
      },
      message,
    };
  }

  // Auth endpoints
  async login(email: string, password: string) {
    await this.delayResponse(undefined);
    
    if (email === 'test@example.com' && password === 'password') {
      this.user = { ...mockUser };
      return {
        user: this.user,
        token: 'mock-jwt-token',
      };
    }
    
    throw {
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
      message: 'Invalid credentials',
    };
  }

  async register(userData: any) {
    await this.delayResponse(undefined);
    
    this.user = {
      id: Date.now(),
      email: userData.email,
      name: userData.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return {
      user: this.user,
      token: 'mock-jwt-token',
    };
  }

  async logout() {
    await this.delayResponse(undefined);
    this.user = null;
  }

  async getCurrentUser() {
    await this.delayResponse(undefined);
    return this.user;
  }

  isAuthenticated() {
    return this.user !== null;
  }

  // Product endpoints
  async getProducts(page: number = 1, limit: number = 10, filters?: any) {
    await this.delayResponse(undefined);
    
    let filteredProducts = [...this.products];
    
    if (filters) {
      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }
      if (filters.priceMin) {
        filteredProducts = filteredProducts.filter(p => p.price >= filters.priceMin);
      }
      if (filters.priceMax) {
        filteredProducts = filteredProducts.filter(p => p.price <= filters.priceMax);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm)
        );
      }
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        hasMore: endIndex < filteredProducts.length,
      },
      filters: filters || {},
    };
  }

  async searchProducts(params: { q: string; limit?: number; offset?: number }) {
    await this.delayResponse(undefined);
    
    const { q, limit = 20, offset = 0 } = params;
    const searchTerm = q.toLowerCase();
    
    const filteredProducts = this.products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      p.brand.toLowerCase().includes(searchTerm)
    );
    
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
    
    return {
      products: paginatedProducts,
      query: q,
      pagination: {
        limit,
        offset,
        total: filteredProducts.length,
      },
    };
  }

  async getProduct(id: number) {
    await this.delayResponse(undefined);
    
    const product = this.products.find(p => p.id === id);
    if (!product) {
      throw {
        response: {
          status: 404,
          data: { message: 'Product not found' },
        },
        message: 'Product not found',
      };
    }
    
    return product;
  }

  async createProduct(productData: any) {
    await this.delayResponse(undefined);
    
    const newProduct: Product = {
      id: Date.now(),
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: any) {
    await this.delayResponse(undefined);
    
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw {
        response: {
          status: 404,
          data: { message: 'Product not found' },
        },
        message: 'Product not found',
      };
    }
    
    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    return this.products[index];
  }

  async deleteProduct(id: number) {
    await this.delayResponse(undefined);
    
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw {
        response: {
          status: 404,
          data: { message: 'Product not found' },
        },
        message: 'Product not found',
      };
    }
    
    this.products.splice(index, 1);
    return { success: true };
  }

  // Recommendation endpoints
  async getRecommendations(params: { limit?: number; algorithm?: string } = {}) {
    await this.delayResponse(undefined);
    
    const { limit = 10, algorithm = 'hybrid' } = params;
    const userRecommendations = this.recommendations.slice(0, limit);
    
    return {
      recommendations: userRecommendations,
      algorithm,
      count: userRecommendations.length,
    };
  }

  async getCollaborativeRecommendations(limit: number = 10) {
    await this.delayResponse(undefined);
    
    const userRecommendations = this.recommendations
      .filter(rec => rec.algorithm === 'collaborative')
      .slice(0, limit);
    
    return {
      recommendations: userRecommendations,
      algorithm: 'collaborative',
      count: userRecommendations.length,
    };
  }

  async getContentBasedRecommendations(limit: number = 10) {
    await this.delayResponse(undefined);
    
    const userRecommendations = this.recommendations
      .filter(rec => rec.algorithm === 'content_based')
      .slice(0, limit);
    
    return {
      recommendations: userRecommendations,
      algorithm: 'content_based',
      count: userRecommendations.length,
    };
  }

  async getHybridRecommendations(limit: number = 10) {
    await this.delayResponse(undefined);
    
    const userRecommendations = this.recommendations
      .filter(rec => rec.algorithm === 'hybrid')
      .slice(0, limit);
    
    return {
      recommendations: userRecommendations,
      algorithm: 'hybrid',
      count: userRecommendations.length,
    };
  }

  async getPopularityRecommendations(limit: number = 10) {
    await this.delayResponse(undefined);
    
    const userRecommendations = this.recommendations
      .filter(rec => rec.algorithm === 'popularity')
      .slice(0, limit);
    
    return {
      recommendations: userRecommendations,
      algorithm: 'popularity',
      count: userRecommendations.length,
    };
  }

  async generateRecommendations(params: { userId?: number; algorithm?: string } = {}) {
    await this.delayResponse(undefined);
    
    const { userId = 1, algorithm = 'hybrid' } = params;
    
    // Simulate generating new recommendations
    const newRecommendations = mockProducts.map((product, index) => ({
      id: Date.now() + index,
      userId,
      productId: product.id,
      score: Math.random() * 0.5 + 0.5, // Random score between 0.5 and 1.0
      algorithm: algorithm || 'hybrid',
      createdAt: new Date(),
      product,
    }));
    
    this.recommendations = [...this.recommendations, ...newRecommendations];
    
    return {
      recommendations: newRecommendations,
      algorithm,
      count: newRecommendations.length,
    };
  }

  // User preferences endpoints
  async getUserPreferences(userId: number) {
    await this.delayResponse(undefined);
    return this.userPreferences;
  }

  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>) {
    await this.delayResponse(undefined);
    
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences,
    };
    
    return this.userPreferences;
  }

  // Interaction endpoints
  async recordInteraction(interactionData: any) {
    await this.delayResponse(undefined);
    return { success: true, id: Date.now() };
  }

  async getUserInteractions(userId: number, page: number = 1, limit: number = 10) {
    await this.delayResponse(undefined);
    
    // Mock interactions data
    const interactions = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      userId,
      productId: mockProducts[index % mockProducts.length].id,
      type: ['view', 'like', 'dislike', 'search'][index % 4],
      metadata: { timestamp: new Date() },
      createdAt: new Date(),
    }));
    
    return {
      data: interactions,
      pagination: {
        page,
        limit,
        total: interactions.length,
        totalPages: 1,
      },
    };
  }

  // Error simulation methods
  async simulateNetworkError() {
    await this.simulateError('Network Error', 0);
  }

  async simulateServerError() {
    await this.simulateError('Internal Server Error', 500);
  }

  async simulateAuthError() {
    await this.simulateError('Unauthorized', 401);
  }

  async simulateNotFoundError() {
    await this.simulateError('Not Found', 404);
  }

  // Reset mock data
  reset() {
    this.products = [...mockProducts];
    this.user = null;
    this.recommendations = [...mockRecommendations];
    this.userPreferences = { ...mockUserPreferences };
  }
}

// Export singleton instance
export const apiMock = new ApiMock();
