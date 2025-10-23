import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { UserController } from '../controllers/userController';
import { UpdateUserProfileDto } from '../dto';

const router = Router();

// User routes
router.get('/profile', authenticate, asyncHandler(UserController.getUserProfile));
router.put('/profile', authenticate, validateBody(UpdateUserProfileDto), asyncHandler(UserController.updateUserProfile));
router.get('/stats', authenticate, asyncHandler(UserController.getUserStats));

export default router;