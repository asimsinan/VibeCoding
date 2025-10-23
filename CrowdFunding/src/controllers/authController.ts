import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthService } from '../lib/services/auth';
import { UserRepository } from '../repositories/UserRepository';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { LoginDto, RegisterDto, ChangePasswordDto } from '../dto';
import { PrismaClient } from '@prisma/client';

const authService = new AuthService(new UserRepository(new PrismaClient()));

export class AuthController {
  // POST /api/v1/auth/login
  static login = [
    validateBody(LoginDto),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      try {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        if (result.success) {
          res.status(200).json({
            success: true,
            token: result.token,
            user: result.user
          });
        } else {
          res.status(401).json({
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
    })
  ];

  // POST /api/v1/auth/register
  static register = [
    validateBody(RegisterDto),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      try {
        const { email, password, name } = req.body;

        const result = await authService.register({ email, password, name });

        if (result.success) {
          res.status(201).json({
            success: true,
            token: result.token,
            user: result.user
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
    })
  ];

  // POST /api/v1/auth/refresh
  static refresh = [
    asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
          return;
        }

        const result = await authService.refreshToken(userId);

        if (result.success) {
          res.status(200).json({
            success: true,
            token: result.token,
            user: result.user
          });
        } else {
          res.status(401).json({
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
    })
  ];

  // POST /api/v1/auth/change-password
  static changePassword = [
    validateBody(ChangePasswordDto),
    asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) {
          res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
          return;
        }

        const result = await authService.changePassword(userId, currentPassword, newPassword);

        if (result.success) {
          res.status(200).json({
            success: true,
            message: 'Password changed successfully'
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
    })
  ];
}
