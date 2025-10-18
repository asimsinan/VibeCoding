import { Router, Request, Response, NextFunction } from 'express';
import { FurnitureService } from '../../lib/services/FurnitureService.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';

const router = Router();
const furnitureService = new FurnitureService();

// GET /furniture - Get all furniture items with optional filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, style, minPrice, maxPrice } = req.query;

    const filters: any = {};
    if (category) filters.category = category as string;
    if (style) filters.style = style as string;
    if (minPrice) filters.minPrice = parseFloat(minPrice as string);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);

    const result = await furnitureService.listFurniture(filters);
    const items = result.items;
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
});

// GET /furniture/:id - Get a single furniture item
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await furnitureService.getFurnitureById(id);

    if (!item) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Furniture item not found' 
        } 
      });
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

// POST /furniture - Create a new furniture item (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, category, style, price, dimensions, modelUrl, thumbnailUrl } = req.body;

    if (!name || !category || !price || !dimensions || !modelUrl || !thumbnailUrl) {
      return res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Missing required fields: name, category, price, dimensions, modelUrl, thumbnailUrl' 
        } 
      });
    }

    const item = await furnitureService.createFurniture({
      name,
      description,
      category,
      style,
      price,
      dimensions,
      modelUrl,
      thumbnailUrl,
    });

    res.status(201).json(item);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      return res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: error.message 
        } 
      });
    }
    next(error);
  }
});

// PUT /furniture/:id - Update a furniture item (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, category, style, price, dimensions, modelUrl, thumbnailUrl } = req.body;

    const item = await furnitureService.updateFurniture(id, {
      name,
      description,
      category,
      style,
      price,
      dimensions,
      modelUrl,
      thumbnailUrl,
    });

    res.status(200).json(item);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: { 
            code: 'NOT_FOUND', 
            message: error.message 
          } 
        });
      }
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: error.message 
          } 
        });
      }
    }
    next(error);
  }
});

// DELETE /furniture/:id - Delete a furniture item (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await furnitureService.deleteFurniture(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: error.message 
        } 
      });
    }
    next(error);
  }
});

export default router;

