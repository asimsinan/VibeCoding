import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../lib/services/auth';
import { UserRepository } from '../repositories/UserRepository';
import { PrismaClient } from '@prisma/client';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Create auth service instance
const authService = new AuthService(new UserRepository(new PrismaClient()));

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const result = await authService.verifyToken(token);
    
    if (!result.success) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    req.user = result.user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

export function authorize(requiredRoles: string[], resourceIdParam?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Check if user has required role
      if (!requiredRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
        return;
      }

      // If resource ownership check is required
      if (resourceIdParam) {
        const resourceId = req.params[resourceIdParam];
        
       
        
        if (!resourceId) {
          console.log('No resource ID provided');
          res.status(400).json({
            success: false,
            error: 'Resource ID not provided'
          });
          return;
        }

        // Admin can access any resource
        if (req.user.role === 'ADMIN') {
          console.log('Admin access granted');
          next();
          return;
        }

        // For campaign operations, we need to check if user owns the campaign
        if (resourceIdParam === 'id' && (req.originalUrl?.includes('/campaigns/') || req.path?.includes('/campaigns/'))) {
          console.log('Campaign operation - skipping ownership check');
          // Skip ownership check here - let the controller handle it
          // The controller will check if the user owns the campaign
          next();
          return;
        }

        // Check if user owns the resource (for user profile operations)
        if (req.user.id !== resourceId) {
          res.status(403).json({
            success: false,
            error: 'Access denied to this resource'
          });
          return;
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Authorization failed'
      });
    }
  };
}