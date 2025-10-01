/**
 * Interaction Service
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This service handles all interaction-related API calls
 * including recording interactions, analytics, and history.
 */

import { apiClient, ApiResponse } from '../client';

// Types
export interface Interaction {
  id: number;
  userId: number;
  productId: number;
  type: InteractionType;
  metadata?: Record<string, any>;
  timestamp: string;
}

export type InteractionType = 'view' | 'like' | 'dislike' | 'favorite' | 'rating' | 'purchase';

export interface InteractionCreateData {
  productId: number;
  type: InteractionType;
  metadata?: Record<string, any>;
}

export interface InteractionStats {
  totalInteractions: number;
  purchases: number;
  likes: number;
  dislikes: number;
  views: number;
  uniqueProducts: number;
  activeDays: number;
  conversionRate: number;
}

export interface UserAnalytics {
  userId: number;
  totalInteractions: number;
  purchases: number;
  likes: number;
  dislikes: number;
  views: number;
  uniqueProducts: number;
  categoriesExplored: number;
  conversionRate: number;
  weeklyInteractions: number;
  monthlyInteractions: number;
}

export interface ProductAnalytics {
  productId: number;
  totalInteractions: number;
  purchases: number;
  likes: number;
  dislikes: number;
  views: number;
  uniqueUsers: number;
  conversionRate: number;
  recentInteractions: number;
}

export interface InteractionListResponse {
  interactions: Interaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface RecentInteractionsResponse {
  interactions: Interaction[];
  timeRange: string;
}

export interface InteractionHistoryResponse {
  productId: number;
  interactions: Interaction[];
}

export interface RecommendationHistoryResponse {
  productId: number;
  interactions: Interaction[];
}

export interface TopProductsResponse {
  topProducts: Array<{
    productId: number;
    score: number;
    interactions: number;
  }>;
  timeRange: string;
}

class InteractionService {
  public readonly basePath = '/interactions';

  /**
   * Record a new interaction
   */
  async recordInteraction(data: InteractionCreateData): Promise<ApiResponse<Interaction>> {
    return apiClient.post(this.basePath, data);
  }

  /**
   * Get user's interactions with pagination
   */
  async getUserInteractions(page: number = 1, limit: number = 20): Promise<ApiResponse<InteractionListResponse>> {
    return apiClient.get(`${this.basePath}?page=${page}&limit=${limit}`);
  }

  /**
   * Get user's interaction statistics
   */
  async getUserInteractionStats(): Promise<ApiResponse<InteractionStats>> {
    return apiClient.get(`${this.basePath}/stats`);
  }

  /**
   * Get user's detailed analytics
   */
  async getUserAnalytics(): Promise<ApiResponse<UserAnalytics>> {
    return apiClient.get(`${this.basePath}/analytics`);
  }

  /**
   * Get recent interactions
   */
  async getRecentInteractions(hours: number = 24): Promise<ApiResponse<RecentInteractionsResponse>> {
    return apiClient.get(`${this.basePath}/recent?hours=${hours}`);
  }

  /**
   * Get interaction history for a specific product
   */
  async getInteractionHistory(productId: number): Promise<ApiResponse<InteractionHistoryResponse>> {
    return apiClient.get(`${this.basePath}/history/${productId}`);
  }

  /**
   * Get user's recommendation history
   */
  async getRecommendationHistory(): Promise<ApiResponse<RecommendationHistoryResponse[]>> {
    return apiClient.get(`${this.basePath}/recommendation-history`);
  }

  /**
   * Get top products by interactions (Admin only)
   */
  async getTopProducts(limit: number = 10, timeRange: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<TopProductsResponse>> {
    return apiClient.get(`${this.basePath}/top-products?limit=${limit}&timeRange=${timeRange}`);
  }

  /**
   * Update an interaction
   */
  async updateInteraction(interactionId: number, type: InteractionType, metadata?: Record<string, any>): Promise<ApiResponse<Interaction>> {
    return apiClient.put(`${this.basePath}/${interactionId}`, { type, metadata });
  }

  /**
   * Delete an interaction
   */
  async deleteInteraction(interactionId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.basePath}/${interactionId}`);
  }

  /**
   * Record a view interaction
   */
  async recordView(productId: number, metadata?: Record<string, any>): Promise<ApiResponse<Interaction>> {
    return this.recordInteraction({
      productId,
      type: 'view',
      metadata: { source: 'product_page', ...metadata }
    });
  }

  /**
   * Record a like interaction
   */
  async recordLike(productId: number, metadata?: Record<string, any>): Promise<ApiResponse<Interaction>> {
    return this.recordInteraction({
      productId,
      type: 'like',
      metadata: { source: 'product_page', ...metadata }
    });
  }

  /**
   * Record a dislike interaction
   */
  async recordDislike(productId: number, metadata?: Record<string, any>): Promise<ApiResponse<Interaction>> {
    return this.recordInteraction({
      productId,
      type: 'dislike',
      metadata: { source: 'product_page', ...metadata }
    });
  }

  /**
   * Record a favorite interaction
   */
  async recordFavorite(productId: number, metadata?: Record<string, any>): Promise<ApiResponse<Interaction>> {
    return this.recordInteraction({
      productId,
      type: 'favorite',
      metadata: { source: 'product_page', ...metadata }
    });
  }

  /**
   * Record a rating interaction
   */
  async recordRating(productId: number, rating: number, metadata?: Record<string, any>): Promise<ApiResponse<Interaction>> {
    return this.recordInteraction({
      productId,
      type: 'rating',
      metadata: { 
        source: 'product_page', 
        rating: rating,
        ...metadata 
      }
    });
  }

  /**
   * Record a purchase interaction
   */
  async recordPurchase(productId: number, metadata?: Record<string, any>): Promise<ApiResponse<Interaction>> {
    return this.recordInteraction({
      productId,
      type: 'purchase',
      metadata: { 
        source: 'checkout', 
        timestamp: new Date().toISOString(),
        ...metadata 
      }
    });
  }

  /**
   * Delete an interaction by product ID and type
   */
  async deleteInteractionByProductType(productId: number, type: InteractionType): Promise<ApiResponse<void>> {
    return apiClient.delete(`/interactions/product/${productId}/type/${type}`);
  }

  /**
   * Update product's average rating based on all user ratings
   */
  async updateProductRating(productId: number): Promise<ApiResponse<{ productId: number; averageRating: number }>> {
    return apiClient.put(`/products/${productId}/rating`);
  }

  /**
   * Get interaction count for a product
   */
  async getProductInteractionCount(productId: number): Promise<number> {
    try {
      const response = await apiClient.get(`${this.basePath}?productId=${productId}&limit=1`);
      return response.data?.pagination?.total || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Check if user has interacted with a product
   */
  async hasUserInteractedWithProduct(productId: number, type?: InteractionType): Promise<boolean> {
    try {
      const response = await this.getInteractionHistory(productId);
      if (type) {
        return response.data?.interactions.some(i => i.type === type) || false;
      }
      return (response.data?.interactions.length || 0) > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const interactionService = new InteractionService();
export default interactionService;
