/**
 * Recommendation Routes
 * TASK-016: API Routes - FR-001 through FR-007
 * 
 * This file defines all recommendation-related API endpoints including
 * generating recommendations, analytics, and management.
 */

import { Router, Request, Response } from 'express';
import { RecommendationEngine } from '../../../lib/services/RecommendationEngine';
import { ProductService } from '../../../lib/services/ProductService';
import { asyncHandler, validationError, notFoundError, authError } from '../middleware/errorHandler';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

export const recommendationRoutes = (recommendationEngine: RecommendationEngine, productService: ProductService) => {
  const router = Router();

  // Helper function to enrich recommendations with product data
  const enrichRecommendationsWithProducts = async (recommendations: any[]) => {
    try {
      if (recommendations.length === 0) return [];
      
      const productIds = recommendations.map(rec => rec.productId);
      const products = await productService.getProductsByIds(productIds);
      const productMap = new Map(products.map(p => [p.id, p]));
      
      const enriched = recommendations.map(rec => {
        const product = productMap.get(rec.productId);
        
        const productData = product ? {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          brand: product.brand,
          imageUrl: product.imageUrl,
          availability: product.availability,
          style: product.style,
          rating: product.rating,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        } : null;
        
        return {
          ...rec,
          product: productData
        };
      });
      
      const filtered = enriched.filter(rec => rec.product !== null);
      return filtered;
    } catch (error) {
      console.error('❌ enrichRecommendationsWithProducts ERROR:', error);
      // Return original recommendations if enrichment fails
      return recommendations;
    }
  };

  /**
   * GET /api/v1/recommendations/test-products
   * Test endpoint to debug getProductsByIds method
   */
  router.get('/test-products', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const productIds = [10, 8, 9];
    
    try {
      const products = await productService.getProductsByIds(productIds);
      
      res.json({
        success: true,
        data: {
          productIds,
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            brand: p.brand,
            imageUrl: p.imageUrl,
            availability: p.availability,
            style: p.style,
            rating: p.rating,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
          })),
          count: products.length
        }
      });
    } catch (error) {
      console.error('❌ getProductsByIds ERROR:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get products', details: error }
      });
    }
  }));

  /**
   * GET /api/v1/recommendations
   * Get personalized recommendations for the user
   */
  router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10', algorithm } = req.query;
    const userId = (req as any).user.userId;

    const limitNum = parseInt(limit as string, 10);
    if (limitNum < 1 || limitNum > 50) {
      throw validationError('Limit must be between 1 and 50');
    }

    let recommendations;

    if (algorithm) {
      const validAlgorithms = ['collaborative', 'content-based', 'hybrid', 'popularity'];
      if (!validAlgorithms.includes(algorithm as string)) {
        throw validationError('Invalid algorithm. Must be one of: collaborative, content-based, hybrid, popularity');
      }

      switch (algorithm) {
        case 'collaborative':
          recommendations = await recommendationEngine.generateCollaborativeRecommendations(userId, limitNum);
          break;
        case 'content-based':
          recommendations = await recommendationEngine.generateContentBasedRecommendations(userId, limitNum);
          break;
        case 'hybrid':
          recommendations = await recommendationEngine.generateHybridRecommendations(userId, limitNum);
          break;
        case 'popularity':
          // For popularity, we'll use the hybrid method but filter for popularity algorithm
          const allRecommendations = await recommendationEngine.generateHybridRecommendations(userId, limitNum * 2);
          recommendations = allRecommendations.filter(rec => rec.algorithm === 'popularity').slice(0, limitNum);
          break;
        default:
          recommendations = await recommendationEngine.generateRecommendations(userId, limitNum);
      }
    } else {
      recommendations = await recommendationEngine.generateRecommendations(userId, limitNum);
    }

    // Enrich recommendations with product data
    const enrichedRecommendations = await enrichRecommendationsWithProducts(recommendations);

    res.json({
      success: true,
      data: {
        recommendations: enrichedRecommendations,
        algorithm: algorithm || 'hybrid',
        count: enrichedRecommendations.length
      }
    });
  }));

  /**
   * GET /api/v1/recommendations/collaborative
   * Get collaborative filtering recommendations
   */
  router.get('/collaborative', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;
    const userId = (req as any).user.userId;

    const limitNum = parseInt(limit as string, 10);
    if (limitNum < 1 || limitNum > 50) {
      throw validationError('Limit must be between 1 and 50');
    }

    const recommendations = await recommendationEngine.generateCollaborativeRecommendations(userId, limitNum);

    // Enrich recommendations with product data
    const enrichedRecommendations = await enrichRecommendationsWithProducts(recommendations);

    res.json({
      success: true,
      data: {
        recommendations: enrichedRecommendations,
        algorithm: 'collaborative',
        count: enrichedRecommendations.length
      }
    });
  }));

  /**
   * GET /api/v1/recommendations/content-based
   * Get content-based filtering recommendations
   */
  router.get('/content-based', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;
    const userId = (req as any).user.userId;

    const limitNum = parseInt(limit as string, 10);
    if (limitNum < 1 || limitNum > 50) {
      throw validationError('Limit must be between 1 and 50');
    }

    const recommendations = await recommendationEngine.generateContentBasedRecommendations(userId, limitNum);

    // Enrich recommendations with product data
    const enrichedRecommendations = await enrichRecommendationsWithProducts(recommendations);

    res.json({
      success: true,
      data: {
        recommendations: enrichedRecommendations,
        algorithm: 'content-based',
        count: enrichedRecommendations.length
      }
    });
  }));

  /**
   * GET /api/v1/recommendations/hybrid
   * Get hybrid recommendations
   */
  router.get('/hybrid', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    console.log('🚀 HYBRID ROUTE CALLED');
    const { limit = '10' } = req.query;
    const userId = (req as any).user.userId;

    const limitNum = parseInt(limit as string, 10);
    if (limitNum < 1 || limitNum > 50) {
      throw validationError('Limit must be between 1 and 50');
    }

    console.log('🚀 Generating hybrid recommendations for user:', userId, 'limit:', limitNum);
    const recommendations = await recommendationEngine.generateHybridRecommendations(userId, limitNum);
    console.log('🚀 Generated recommendations:', recommendations.length);

    // Enrich recommendations with product data
    console.log('🚀 Calling enrichment function...');
    const enrichedRecommendations = await enrichRecommendationsWithProducts(recommendations);
    console.log('🚀 Enrichment complete, returning:', enrichedRecommendations.length);

    res.json({
      success: true,
      data: {
        recommendations: enrichedRecommendations,
        algorithm: 'hybrid',
        count: enrichedRecommendations.length
      }
    });
  }));

  /**
   * GET /api/v1/recommendations/score/:productId
   * Get recommendation score for a specific product
   */
  router.get('/score/:productId', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const userId = (req as any).user.userId;

    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      throw validationError('Invalid product ID');
    }

    const score = await recommendationEngine.getRecommendationScore(userId, productIdNum);

    res.json({
      success: true,
      data: {
        productId: productIdNum,
        score,
        confidence: score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low'
      }
    });
  }));

  /**
   * GET /api/v1/recommendations/stats
   * Get recommendation statistics for the user
   */
  router.get('/stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const stats = await recommendationEngine.getRecommendationStats(userId);

    res.json({
      success: true,
      data: stats
    });
  }));

  /**
   * POST /api/v1/recommendations/refresh
   * Refresh recommendations for the user
   */
  router.post('/refresh', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    await recommendationEngine.updateRecommendations(userId);

    res.json({
      success: true,
      message: 'Recommendations refreshed successfully'
    });
  }));

  /**
   * POST /api/v1/recommendations/refresh-all
   * Refresh all expired recommendations (Admin only)
   */
  router.post('/refresh-all', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
    await recommendationEngine.refreshExpiredRecommendations();

    res.json({
      success: true,
      message: 'All expired recommendations refreshed successfully'
    });
  }));

  return router;
};
