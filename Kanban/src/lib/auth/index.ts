/**
 * Auth module exports
 * Centralized exports for authentication functionality
 */

// Types
export type {
  UserProfile,
  AuthError,
} from './types';

// Services
export { AuthService, supabase } from './services/authService';

// Hooks
export { useAuth, AuthProvider } from './hooks/useAuth';

// Components
export { LoginForm } from './components/LoginForm';
export { SignupForm } from './components/SignupForm';
export { AuthGuard } from './components/AuthGuard';
