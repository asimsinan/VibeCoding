import { Router, Request, Response, NextFunction } from 'express';
import { SharedDesignService } from '../../lib/services/SharedDesignService.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();
const sharedDesignService = new SharedDesignService();

// GET /shared/:token - Get a shared design by token (public endpoint)
router.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const sharedDesign = await sharedDesignService.findByToken(token);

    if (!sharedDesign) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Shared design not found or expired' 
        } 
      });
    }

    res.status(200).json(sharedDesign);
  } catch (error) {
    next(error);
  }
});

// POST /shared - Create a new share link for a design
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

    const { designId, expiresInDays } = req.body;

    if (!designId) {
      return res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Missing required field: designId' 
        } 
      });
    }

    const share = await sharedDesignService.createShare(
      designId, 
      req.user.userId, 
      expiresInDays || 30
    );

    res.status(201).json(share);
  } catch (error) {
    next(error);
  }
});

export default router;

