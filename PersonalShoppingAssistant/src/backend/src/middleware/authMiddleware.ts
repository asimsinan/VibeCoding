/**
 * Authentication Middleware
 * TASK-015: Authentication Middleware - FR-001 through FR-007
 * 
 * This middleware handles JWT authentication and authorization
 * for protected API endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authError, authorizationError } from './errorHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user information to request
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw authError('Access token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw authError('Access token required');
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: number; email: string };

    // Add user information to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(authError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(authError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional Authentication Middleware
 * Verifies JWT token if present, but doesn't require it
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        const decoded = jwt.verify(token, jwtSecret) as { userId: number; email: string };
        
        req.user = {
          userId: decoded.userId,
          email: decoded.email
        };
      }
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Admin Authorization Middleware
 * Requires user to be authenticated and have admin privileges
 */
export const adminMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      throw authError('Authentication required');
    }

    // Check if user has admin privileges
    // This would typically check against a user role or permission system
    // For now, we'll implement a simple check based on user ID or email
    const isAdmin = await checkAdminPrivileges(req.user.userId, req.user.email);
    
    if (!isAdmin) {
      throw authorizationError('Admin privileges required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * User Ownership Middleware
 * Ensures user can only access their own resources
 */
export const userOwnershipMiddleware = (paramName: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw authError('Authentication required');
      }

      const resourceUserId = parseInt(req.params[paramName], 10);
      
      if (isNaN(resourceUserId)) {
        throw new Error('Invalid user ID parameter');
      }

      if (req.user.userId !== resourceUserId) {
        throw authorizationError('Access denied: You can only access your own resources');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has admin privileges
 * This is a placeholder implementation - in a real app, this would
 * check against a database or external authorization service
 */
const checkAdminPrivileges = async (userId: number, email: string): Promise<boolean> => {
  // For now, we'll use a simple check based on email domain
  // In a real application, this would check against a user roles table
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const adminDomains = process.env.ADMIN_DOMAINS?.split(',') || [];
  
  // Check if email is in admin list
  if (adminEmails.includes(email)) {
    return true;
  }
  
  // Check if email domain is in admin domains
  const emailDomain = email.split('@')[1];
  if (adminDomains.includes(emailDomain)) {
    return true;
  }
  
  // Check if user ID is in admin list (for testing)
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id, 10)) || [];
  if (adminUserIds.includes(userId)) {
    return true;
  }
  
  return false;
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: number, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  return jwt.sign(
    { userId, email },
    jwtSecret,
    { expiresIn } as jwt.SignOptions
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): { userId: number; email: string } => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.verify(token, jwtSecret) as { userId: number; email: string };
};

/**
 * Extract token from request
 */
export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};
