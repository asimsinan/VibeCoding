/**
 * Interaction Routes
 * TASK-016: API Routes - FR-001 through FR-007
 * 
 * This file defines all interaction-related API endpoints including
 * recording interactions, analytics, and history.
 */

import { Router, Request, Response } from 'express';
import { InteractionService } from '../../../lib/services/InteractionService';
import { asyncHandler, validationError, notFoundError, authError } from '../middleware/errorHandler';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import { InteractionCreateData, InteractionType } from '../../../lib/recommendation-engine/models/Interaction';

export const interactionRoutes = (interactionService: InteractionService) => {
  const router = Router();

  /**
   * POST /api/v1/interactions
   * Record a new interaction
   */
  router.post('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { productId, type, metadata } = req.body;
    const userId = (req as any).user.userId;

    if (!productId || !type) {
      throw validationError('Product ID and interaction type are required');
    }

    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      throw validationError('Invalid product ID');
    }

    // Validate interaction type
    const validTypes: InteractionType[] = ['view', 'like', 'dislike', 'favorite', 'rating', 'purchase'];
    if (!validTypes.includes(type)) {
      throw validationError('Invalid interaction type. Must be one of: view, like, dislike, favorite, rating, purchase');
    }

    const interactionData: InteractionCreateData = {
      userId,
      productId: productIdNum,
      type,
      metadata: metadata || {}
    };

    const interaction = await interactionService.recordInteraction(interactionData);

    res.status(201).json({
      success: true,
      message: 'Interaction recorded successfully',
      data: interaction
    });
  }));

  /**
   * GET /api/v1/interactions
   * Get user's interactions with pagination
   */
  router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20' } = req.query;
    const userId = (req as any).user.userId;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    if (pageNum < 1 || limitNum < 1 || limitNum > 1000) {
      throw validationError('Invalid pagination parameters');
    }

    const interactions = await interactionService.getUserInteractions(userId, limitNum, offset);

    res.json({
      success: true,
      data: {
        interactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: interactions.length,
          hasMore: interactions.length === limitNum
        }
      }
    });
  }));

  /**
   * GET /api/v1/interactions/stats
   * Get user's interaction statistics
   */
  router.get('/stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const stats = await interactionService.getUserInteractionStats(userId);

    res.json({
      success: true,
      data: stats
    });
  }));

  /**
   * GET /api/v1/interactions/analytics
   * Get user's detailed analytics
   */
  router.get('/analytics', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const analytics = await interactionService.getUserAnalytics(userId);

    res.json({
      success: true,
      data: analytics
    });
  }));

  /**
   * GET /api/v1/interactions/recent
   * Get recent interactions
   */
  router.get('/recent', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { hours = '24' } = req.query;
    const userId = (req as any).user.userId;

    const hoursNum = parseInt(hours as string, 10);
    if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 168) { // Max 1 week
      throw validationError('Hours must be between 1 and 168');
    }

    const interactions = await interactionService.getRecentInteractions(userId, hoursNum);

    res.json({
      success: true,
      data: {
        interactions,
        timeRange: `${hoursNum} hours`
      }
    });
  }));

  /**
   * GET /api/v1/interactions/history/:productId
   * Get interaction history for a specific product
   */
  router.get('/history/:productId', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const userId = (req as any).user.userId;

    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      throw validationError('Invalid product ID');
    }

    const interactions = await interactionService.getInteractionHistory(userId, productIdNum);

    res.json({
      success: true,
      data: {
        productId: productIdNum,
        interactions
      }
    });
  }));

  /**
   * GET /api/v1/interactions/recommendation-history
   * Get user's recommendation history
   */
  router.get('/recommendation-history', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const history = await interactionService.getUserRecommendationHistory(userId);

    res.json({
      success: true,
      data: history
    });
  }));

  /**
   * GET /api/v1/interactions/top-products
   * Get top products by interactions (Admin only)
   */
  router.get('/top-products', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10', timeRange = 'week' } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const validTimeRanges = ['day', 'week', 'month'];
    
    if (limitNum < 1 || limitNum > 100) {
      throw validationError('Limit must be between 1 and 100');
    }

    if (!validTimeRanges.includes(timeRange as string)) {
      throw validationError('Time range must be one of: day, week, month');
    }

    const topProducts = await interactionService.getTopProducts(limitNum, timeRange as 'day' | 'week' | 'month');

    res.json({
      success: true,
      data: {
        topProducts,
        timeRange
      }
    });
  }));

  /**
   * PUT /api/v1/interactions/:id
   * Update an interaction
   */
  router.put('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, metadata } = req.body;
    const userId = (req as any).user.userId;

    const interactionId = parseInt(id, 10);
    if (isNaN(interactionId)) {
      throw validationError('Invalid interaction ID');
    }

    if (!type) {
      throw validationError('Interaction type is required');
    }

    const validTypes: InteractionType[] = ['view', 'like', 'dislike', 'favorite', 'rating', 'purchase'];
    if (!validTypes.includes(type)) {
      throw validationError('Invalid interaction type. Must be one of: view, like, dislike, favorite, rating, purchase');
    }

    const updatedInteraction = await interactionService.updateInteraction(interactionId, type, metadata);

    res.json({
      success: true,
      message: 'Interaction updated successfully',
      data: updatedInteraction
    });
  }));

  /**
   * DELETE /api/v1/interactions/:id
   * Delete an interaction
   */
  router.delete('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const interactionId = parseInt(id, 10);
    if (isNaN(interactionId)) {
      throw validationError('Invalid interaction ID');
    }

    const deleted = await interactionService.deleteInteraction(interactionId);

    if (!deleted) {
      throw notFoundError('Interaction not found');
    }

    res.json({
      success: true,
      message: 'Interaction deleted successfully'
    });
  }));

  /**
   * DELETE /api/v1/interactions/product/:productId/type/:type
   * Delete an interaction by product ID and type
   */
  router.delete('/product/:productId/type/:type', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { productId, type } = req.params;
    const userId = (req as any).user.userId;

    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      throw validationError('Invalid product ID');
    }

    // Validate interaction type
    const validTypes: InteractionType[] = ['view', 'like', 'dislike', 'favorite', 'rating', 'purchase'];
    if (!validTypes.includes(type as InteractionType)) {
      throw validationError('Invalid interaction type. Must be one of: view, like, dislike, favorite, rating, purchase');
    }

    const deleted = await interactionService.deleteInteractionByUserProductType(userId, productIdNum, type as InteractionType);

    if (!deleted) {
      throw notFoundError('Interaction not found');
    }

    res.json({
      success: true,
      message: 'Interaction deleted successfully'
    });
  }));

  return router;
};
