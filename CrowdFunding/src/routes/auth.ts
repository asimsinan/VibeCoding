import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Authentication routes
router.post('/login', ...AuthController.login);
router.post('/register', ...AuthController.register);
router.post('/refresh', authenticate, AuthController.refresh);
router.post('/change-password', authenticate, ...AuthController.changePassword);

export default router;
