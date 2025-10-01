/**
 * Product Routes
 * TASK-016: API Routes - FR-001 through FR-007
 * 
 * This file defines all product-related API endpoints including
 * CRUD operations, search, filtering, and analytics.
 */

import { Router, Request, Response } from 'express';
import { ProductService } from '../../../lib/services/ProductService';
import { asyncHandler, validationError, notFoundError, authError } from '../middleware/errorHandler';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';
import { ProductCreateData, ProductUpdateData, ProductFilter } from '../../../lib/recommendation-engine/models/Product';

export const productRoutes = (productService: ProductService) => {
  const router = Router();

  /**
   * GET /api/v1/products
   * Get products with optional filtering and pagination
   */
  router.get('/', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const {
      page = '1',
      limit = '20',
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      availability,
      search,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw validationError('Invalid pagination parameters');
    }

    // Build filter object
    const filter: ProductFilter = {
      category: category as string,
      brand: brand as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      availability: availability ? availability === 'true' : undefined,
      searchQuery: search as string,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string).toUpperCase() as 'ASC' | 'DESC'
    };

    // Validate price range
    if (filter.minPrice !== undefined && filter.maxPrice !== undefined) {
      if (filter.minPrice < 0 || filter.maxPrice < 0) {
        throw validationError('Price values must be non-negative');
      }
      if (filter.minPrice > filter.maxPrice) {
        throw validationError('Minimum price must be less than or equal to maximum price');
      }
    }

    const products = await productService.filterProducts(filter, limitNum, offset);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: products.length,
          hasMore: products.length === limitNum
        },
        filters: filter
      }
    });
  }));

  /**
   * GET /api/v1/products/search
   * Search products by query
   */
  router.get('/search', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { q: query, limit = '20', offset = '0' } = req.query;

    if (!query || typeof query !== 'string') {
      throw validationError('Search query is required');
    }

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    if (limitNum < 1 || limitNum > 100 || offsetNum < 0) {
      throw validationError('Invalid pagination parameters');
    }

    const products = await productService.searchProducts(query, limitNum, offsetNum);

    res.json({
      success: true,
      data: {
        products,
        query,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: products.length
        }
      }
    });
  }));

  /**
   * GET /api/v1/products/categories
   * Get all product categories
   */
  router.get('/categories', asyncHandler(async (req: Request, res: Response) => {
    const categories = await productService.getCategories();

    res.json({
      success: true,
      data: {
        categories
      }
    });
  }));

  /**
   * GET /api/v1/products/brands
   * Get all product brands
   */
  router.get('/brands', asyncHandler(async (req: Request, res: Response) => {
    const brands = await productService.getBrands();

    res.json({
      success: true,
      data: {
        brands
      }
    });
  }));

  /**
   * GET /api/v1/products/popular
   * Get popular products
   */
  router.get('/popular', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    if (limitNum < 1 || limitNum > 50) {
      throw validationError('Limit must be between 1 and 50');
    }

    const products = await productService.getPopularProducts(limitNum);

    res.json({
      success: true,
      data: {
        products
      }
    });
  }));

  /**
   * GET /api/v1/products/:id
   * Get product by ID
   */
  router.get('/:id', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      throw validationError('Invalid product ID');
    }

    const product = await productService.getProduct(productId);

    if (!product) {
      throw notFoundError('Product not found');
    }

    res.json({
      success: true,
      data: product
    });
  }));

  /**
   * GET /api/v1/products/:id/stats
   * Get product statistics
   */
  router.get('/:id/stats', asyncHandler(async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      throw validationError('Invalid product ID');
    }

    const stats = await productService.getProductStats(productId);

    res.json({
      success: true,
      data: stats
    });
  }));

  /**
   * POST /api/v1/products
   * Create a new product (Admin only)
   */
  router.post('/', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const productData: ProductCreateData = req.body;

    // Validate required fields
    if (!productData.name || !productData.category || !productData.brand) {
      throw validationError('Name, category, and brand are required');
    }

    if (typeof productData.price !== 'number' || productData.price < 0) {
      throw validationError('Price must be a non-negative number');
    }

    if (productData.name.length > 255) {
      throw validationError('Product name is too long');
    }

    if (productData.description && productData.description.length > 1000) {
      throw validationError('Product description is too long');
    }

    const product = await productService.createProduct(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  }));

  /**
   * PUT /api/v1/products/:id
   * Update product (Admin only)
   */
  router.put('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id, 10);
    const updateData: ProductUpdateData = req.body;

    if (isNaN(productId)) {
      throw validationError('Invalid product ID');
    }

    if (updateData.price !== undefined && (typeof updateData.price !== 'number' || updateData.price < 0)) {
      throw validationError('Price must be a non-negative number');
    }

    if (updateData.name && updateData.name.length > 255) {
      throw validationError('Product name is too long');
    }

    if (updateData.description && updateData.description.length > 1000) {
      throw validationError('Product description is too long');
    }

    const updatedProduct = await productService.updateProduct(productId, updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  }));

  /**
   * DELETE /api/v1/products/:id
   * Delete product (Admin only)
   */
  router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      throw validationError('Invalid product ID');
    }

    const deleted = await productService.deleteProduct(productId);

    if (!deleted) {
      throw notFoundError('Product not found');
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  }));

  /**
   * PUT /api/v1/products/:id/rating
   * Update product's average rating based on all user ratings
   */
  router.put('/:id/rating', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      throw validationError('Invalid product ID');
    }

    const newAverageRating = await productService.updateProductRating(productId);

    res.json({
      success: true,
      data: {
        productId,
        averageRating: newAverageRating
      },
      message: 'Product rating updated successfully'
    });
  }));

  return router;
};
