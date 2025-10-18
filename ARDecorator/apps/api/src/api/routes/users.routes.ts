import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../../lib/services/UserService.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();
const userService = new UserService();

// GET /users/me - Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const user = await userService.findUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'User not found' 
        } 
      });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

// PUT /users/me - Update current user profile
router.put('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { name, email } = req.body;
    const user = await userService.updateUser(req.user.userId, { name, email });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;

