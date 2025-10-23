import { Request, Response } from 'express';
import { UserService } from '../lib/services/user';
import { UserCore } from '../lib/core/user';
import { UserRepository } from '../repositories/UserRepository';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const userCore = new UserCore();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userCore, userRepository);

export class UserController {
  // GET /api/v1/users/profile
  static async getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await userService.getUserProfile(req.user?.id || '');

      if (result.success) {
        res.status(200).json({
          success: true,
          ...result.user
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // PUT /api/v1/users/profile
  static async updateUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updateData = req.body;

      const result = await userService.updateUserProfile(req.user?.id || '', updateData);

      if (result.success) {
        res.status(200).json({
          success: true,
          ...result.user
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/users/stats
  static async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await userService.getUserStats(req.user?.id || '');

      if (result.success) {
        res.status(200).json({
          success: true,
          stats: result.stats
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
