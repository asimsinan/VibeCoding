/**
 * User Routes
 * TASK-016: API Routes - FR-001 through FR-007
 * 
 * This file defines all user-related API endpoints including
 * registration, authentication, profile management, and preferences.
 */

import { Router, Request, Response } from 'express';
import { UserService } from '../../../lib/services/UserService';
import { asyncHandler, validationError, authError, notFoundError } from '../middleware/errorHandler';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import { UserRegisterData, UserLoginData, UserUpdateData } from '../../../lib/recommendation-engine/models/User';
import { UserPreferencesUpdateData } from '../../../lib/recommendation-engine/models/UserPreferences';

export const userRoutes = (userService: UserService) => {
  const router = Router();

  /**
   * POST /api/v1/users/register
   * Register a new user
   */
  router.post('/register', asyncHandler(async (req: Request, res: Response) => {
    const userData: UserRegisterData = req.body;

    // Validate required fields
    if (!userData.email || !userData.password) {
      throw validationError('Email and password are required');
    }

    if (!userData.preferences) {
      throw validationError('User preferences are required');
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(userData.email)) {
      throw validationError('Invalid email format');
    }

    // Validate password strength
    if (userData.password.length < 6) {
      throw validationError('Password must be at least 6 characters long');
    }

    const result = await userService.register(userData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          preferences: result.user.preferences,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt
        },
        token: result.token
      }
    });
  }));

  /**
   * POST /api/v1/users/login
   * Login user
   */
  router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const loginData: UserLoginData = req.body;

    // Validate required fields
    if (!loginData.email || !loginData.password) {
      throw validationError('Email and password are required');
    }

    const result = await userService.login(loginData);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          preferences: result.user.preferences,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt
        },
        token: result.token
      }
    });
  }));

  /**
   * GET /api/v1/users/profile
   * Get user profile
   */
  router.get('/profile', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const profile = await userService.getProfile(userId);

    res.json({
      success: true,
      data: profile
    });
  }));

  /**
   * PUT /api/v1/users/profile
   * Update user profile
   */
  router.put('/profile', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const updateData: UserUpdateData = req.body;

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(updateData.email)) {
        throw validationError('Invalid email format');
      }
    }

    // Validate password strength if provided
    if (updateData.password && updateData.password.length < 6) {
      throw validationError('Password must be at least 6 characters long');
    }

    const updatedUser = await userService.updateProfile(userId, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  }));

  /**
   * GET /api/v1/users/preferences
   * Get user preferences
   */
  router.get('/preferences', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    try {
      const preferences = await userService.getUserPreferences(userId);
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error: any) {
      if (error.message === 'User preferences not found') {
        // Return default preferences if none exist
        const defaultPreferences = {
          id: 0,
          userId: userId,
          categories: [],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        res.json({
          success: true,
          data: defaultPreferences
        });
      } else {
        throw error;
      }
    }
  }));

  /**
   * PUT /api/v1/users/preferences
   * Update user preferences
   */
  router.put('/preferences', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const preferencesData: UserPreferencesUpdateData = req.body;

    // Debug: Log what we're receiving
    console.log('🔍 Received preferences data:', preferencesData);
    console.log('🔍 Price range:', preferencesData.priceRange);

    // Validate preferences data
    if (preferencesData.categories && !Array.isArray(preferencesData.categories)) {
      throw validationError('Categories must be an array');
    }

    if (preferencesData.brands && !Array.isArray(preferencesData.brands)) {
      throw validationError('Brands must be an array');
    }

    if (preferencesData.stylePreferences && !Array.isArray(preferencesData.stylePreferences)) {
      throw validationError('Style preferences must be an array');
    }

    if (preferencesData.priceRange) {
      if (typeof preferencesData.priceRange.min !== 'number' || typeof preferencesData.priceRange.max !== 'number') {
        throw validationError('Price range must have numeric min and max values');
      }
      if (preferencesData.priceRange.min < 0 || preferencesData.priceRange.max < 0) {
        throw validationError('Price range values must be non-negative');
      }
      if (preferencesData.priceRange.min > preferencesData.priceRange.max) {
        throw validationError('Minimum price must be less than or equal to maximum price');
      }
    }

    const updatedPreferences = await userService.updatePreferences(userId, preferencesData);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedPreferences
    });
  }));

  /**
   * POST /api/v1/users/refresh-token
   * Refresh JWT token
   */
  router.post('/refresh-token', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const newToken = await userService.refreshToken(userId);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });
  }));

  /**
   * DELETE /api/v1/users/account
   * Delete user account
   */
  router.delete('/account', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      throw notFoundError('User not found');
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  }));

  /**
   * POST /api/v1/users/validate-token
   * Validate JWT token
   */
  router.post('/validate-token', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    // If we reach here, the token is valid (authMiddleware already validated it)
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: req.user!.userId,
          email: req.user!.email
        }
      }
    });
  }));

  return router;
};
