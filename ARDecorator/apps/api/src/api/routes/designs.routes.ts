import { Router, Request, Response, NextFunction } from 'express';
import { DesignService } from '../../lib/services/DesignService.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();
const designService = new DesignService();

// GET /designs - Get all designs for authenticated user
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const result = await designService.listDesigns(req.user.userId);
    const designs = result.designs;
    res.status(200).json(designs);
  } catch (error) {
    next(error);
  }
});

// POST /designs - Create a new design
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { roomPhotoId, name, furniture } = req.body;

    if (!roomPhotoId || !name) {
      return res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Missing required fields: roomPhotoId, name' 
        } 
      });
    }

    const design = await designService.createDesign({
      userId: req.user.userId,
      roomPhotoId,
      name,
      placedFurniture: furniture || [],
    });

    res.status(201).json(design);
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

// GET /designs/:id - Get a single design
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { id } = req.params;
    const design = await designService.getDesignById(id);

    if (!design) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Design not found' 
        } 
      });
    }

    // Check ownership
    if (design.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Access denied' 
        } 
      });
    }

    res.status(200).json(design);
  } catch (error) {
    next(error);
  }
});

// PUT /designs/:id - Update a design
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { id } = req.params;
    const { name, furniture } = req.body;

    // Check ownership
    const existing = await designService.getDesignById(id);
    if (!existing) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Design not found' 
        } 
      });
    }

    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Access denied' 
        } 
      });
    }

    const design = await designService.updateDesign(id, { name, placedFurniture: furniture });
    res.status(200).json(design);
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

// DELETE /designs/:id - Delete a design
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { id } = req.params;

    // Check ownership
    const existing = await designService.getDesignById(id);
    if (!existing) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Design not found' 
        } 
      });
    }

    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Access denied' 
        } 
      });
    }

    await designService.deleteDesign(id);
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

