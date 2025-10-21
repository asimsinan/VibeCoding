export * from './auth-service';
export * from './password-validator';
export * from '../models/user-model';
export * from '../models/session-model';
export * from '../controllers/auth-controller';

// Re-export AuthResult from auth-service to avoid conflicts
export type { AuthResult as AuthServiceResult } from './auth-service';
export type { AuthResult as AuthMiddlewareResult } from '../middleware/auth-middleware';

// Export middleware types and functions separately to avoid conflicts
export { AuthMiddleware } from '../middleware/auth-middleware';
export type { AuthMiddlewareConfig } from '../middleware/auth-middleware';
