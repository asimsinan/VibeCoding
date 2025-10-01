/**
 * Recommendation Service
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This service handles all recommendation-related API calls
 * including generating recommendations, analytics, and management.
 */

import { apiClient, ApiResponse } from '../client';
import { Product } from './productService';

// Types
export interface Recommendation {
  productId: number;
  product: Product;
  score: number;
  algorithm: RecommendationAlgorithm;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  expiresAt: string;
}

export type RecommendationAlgorithm = 'collaborative' | 'content_based' | 'hybrid' | 'popularity';

export interface RecommendationParams {
  limit?: number;
  algorithm?: RecommendationAlgorithm;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  algorithm: string;
  count: number;
}

export interface RecommendationScoreResponse {
  productId: number;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface RecommendationStats {
  total: number;
  averageScore: number;
  algorithmDistribution: Record<string, number>;
}

export interface RefreshResponse {
  message: string;
}

class RecommendationService {
  public readonly basePath = '/recommendations';

  /**
   * Get personalized recommendations for the user
   */
  async getRecommendations(params: RecommendationParams = {}): Promise<ApiResponse<RecommendationResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.algorithm) queryParams.append('algorithm', params.algorithm);

    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    return apiClient.get(url);
  }

  /**
   * Get collaborative filtering recommendations
   */
  async getCollaborativeRecommendations(limit: number = 10): Promise<ApiResponse<RecommendationResponse>> {
    if (limit === 0) {
      return { success: true, data: { recommendations: [], count: 0, algorithm: 'collaborative' } };
    }
    return apiClient.get(`${this.basePath}/collaborative?limit=${limit}`);
  }

  /**
   * Get content-based filtering recommendations
   */
  async getContentBasedRecommendations(limit: number = 10): Promise<ApiResponse<RecommendationResponse>> {
    if (limit === 0) {
      return { success: true, data: { recommendations: [], count: 0, algorithm: 'content_based' } };
    }
    return apiClient.get(`${this.basePath}/content-based?limit=${limit}`);
  }

  /**
   * Get hybrid recommendations
   */
  async getHybridRecommendations(limit: number = 10): Promise<ApiResponse<RecommendationResponse>> {
    if (limit === 0) {
      return { success: true, data: { recommendations: [], count: 0, algorithm: 'hybrid' } };
    }
    return apiClient.get(`${this.basePath}/hybrid?limit=${limit}`);
  }

  /**
   * Get popularity-based recommendations
   */
  async getPopularityRecommendations(limit: number = 10): Promise<ApiResponse<RecommendationResponse>> {
    if (limit === 0) {
      return { success: true, data: { recommendations: [], count: 0, algorithm: 'popularity' } };
    }
    return apiClient.get(`${this.basePath}?algorithm=popularity&limit=${limit}`);
  }

  /**
   * Get recommendation score for a specific product
   */
  async getRecommendationScore(productId: number): Promise<ApiResponse<RecommendationScoreResponse>> {
    return apiClient.get(`${this.basePath}/score/${productId}`);
  }

  /**
   * Get recommendation statistics for the user
   */
  async getRecommendationStats(): Promise<ApiResponse<RecommendationStats>> {
    return apiClient.get(`${this.basePath}/stats`);
  }

  /**
   * Refresh recommendations for the user
   */
  async refreshRecommendations(): Promise<ApiResponse<RefreshResponse>> {
    return apiClient.post(`${this.basePath}/refresh`);
  }

  /**
   * Refresh all expired recommendations (Admin only)
   */
  async refreshAllRecommendations(): Promise<ApiResponse<RefreshResponse>> {
    return apiClient.post(`${this.basePath}/refresh-all`);
  }

  /**
   * Get recommendations with specific algorithm
   */
  async getRecommendationsByAlgorithm(algorithm: RecommendationAlgorithm, limit: number = 10): Promise<ApiResponse<RecommendationResponse>> {
    switch (algorithm) {
      case 'collaborative':
        return this.getCollaborativeRecommendations(limit);
      case 'content_based':
        return this.getContentBasedRecommendations(limit);
      case 'hybrid':
        return this.getHybridRecommendations(limit);
      case 'popularity':
        return this.getPopularityRecommendations(limit);
      default:
        return this.getRecommendations({ algorithm, limit });
    }
  }

  /**
   * Get multiple recommendation sets for comparison
   */
  async getRecommendationComparison(limit: number = 5): Promise<{
    collaborative: Recommendation[];
    contentBased: Recommendation[];
    hybrid: Recommendation[];
    popularity: Recommendation[];
  }> {
    try {
      const [collaborative, contentBased, hybrid, popularity] = await Promise.all([
        this.getCollaborativeRecommendations(limit),
        this.getContentBasedRecommendations(limit),
        this.getHybridRecommendations(limit),
        this.getPopularityRecommendations(limit)
      ]);

      return {
        collaborative: collaborative.data?.recommendations || [],
        contentBased: contentBased.data?.recommendations || [],
        hybrid: hybrid.data?.recommendations || [],
        popularity: popularity.data?.recommendations || []
      };
    } catch (error) {
      console.error('Error getting recommendation comparison:', error);
      return {
        collaborative: [],
        contentBased: [],
        hybrid: [],
        popularity: []
      };
    }
  }

  /**
   * Get recommendation explanation for a product
   */
  async getRecommendationExplanation(productId: number): Promise<string | null> {
    try {
      const response = await this.getRecommendationScore(productId);
      const score = response.data?.score || 0;
      const confidence = response.data?.confidence || 'low';

      if (score > 0.8) {
        return `Highly recommended (${confidence} confidence) - Score: ${score.toFixed(2)}`;
      } else if (score > 0.5) {
        return `Moderately recommended (${confidence} confidence) - Score: ${score.toFixed(2)}`;
      } else if (score > 0.2) {
        return `Somewhat recommended (${confidence} confidence) - Score: ${score.toFixed(2)}`;
      } else {
        return `Not recommended - Score: ${score.toFixed(2)}`;
      }
    } catch {
      return null;
    }
  }

  /**
   * Check if recommendations are fresh (less than 1 hour old)
   */
  async areRecommendationsFresh(): Promise<boolean> {
    try {
      const response = await this.getRecommendations({ limit: 1 });
      const recommendations = response.data?.recommendations || [];
      
      if (recommendations.length === 0) return false;

      const latestExpiry = Math.max(
        ...recommendations.map(rec => new Date(rec.expiresAt).getTime())
      );

      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return latestExpiry > oneHourAgo;
    } catch {
      return false;
    }
  }

  /**
   * Get recommendation quality metrics
   */
  async getRecommendationQuality(): Promise<{
    averageScore: number;
    highConfidenceCount: number;
    totalCount: number;
    algorithmDistribution: Record<string, number>;
  }> {
    try {
      const stats = await this.getRecommendationStats();
      const data = stats.data;

      return {
        averageScore: data?.averageScore || 0,
        highConfidenceCount: 0, // This would need to be calculated from individual recommendations
        totalCount: data?.total || 0,
        algorithmDistribution: data?.algorithmDistribution || {}
      };
    } catch {
      return {
        averageScore: 0,
        highConfidenceCount: 0,
        totalCount: 0,
        algorithmDistribution: {}
      };
    }
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
export default recommendationService;
