import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../../lib/services/UserService.js';
import { generateToken } from '../../lib/utils/jwt.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();
const userService = new UserService();

// POST /auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Email, password, and name are required' 
        } 
      });
    }

    const user = await userService.createUser({ email, password, name });
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          error: { 
            code: 'CONFLICT', 
            message: error.message 
          } 
        });
      }
      if (error.message.includes('Invalid') || error.message.includes('must be')) {
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

// POST /auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Email and password are required' 
        } 
      });
    }

    const isValid = await userService.verifyPassword(email, password);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Invalid email or password' 
        } 
      });
    }

    const user = await userService.findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Invalid email or password' 
        } 
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post('/logout', authenticateToken, (_req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint exists for consistency with the API contract
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;

