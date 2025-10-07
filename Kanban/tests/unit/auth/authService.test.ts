/**
 * Unit tests for authentication service
 * Tests authentication business logic and Supabase integration
 */

import { AuthService } from '../../../src/lib/auth/services/authService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
  },
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    authService = new AuthService();
  });

  describe('User Registration', () => {
    it('should register user with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: mockUser,
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Test User',
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ user: mockUser, session: mockSession });
      expect(result.error).toBeNull();
    });

    it('should handle registration with existing email', async () => {
      const mockError = { message: 'User already registered' };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await authService.signUp({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('User already registered');
    });

    it('should validate email format before registration', async () => {
      const result = await authService.signUp({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });

    it('should validate password strength before registration', async () => {
      const result = await authService.signUp({
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      });

      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least 8 characters');
    });

    it('should validate name is provided', async () => {
      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: '',
      });

      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Name is required');
    });
  });

  describe('User Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: mockUser,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ user: mockUser, session: mockSession });
      expect(result.error).toBeNull();
    });

    it('should handle authentication with invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid login credentials');
    });

    it('should validate email format before authentication', async () => {
      const result = await authService.signIn({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });

    it('should validate password is provided', async () => {
      const result = await authService.signIn({
        email: 'test@example.com',
        password: '',
      });

      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password is required');
    });
  });

  describe('User Sign Out', () => {
    it('should sign out user successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await authService.signOut();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle sign out error', async () => {
      const mockError = { message: 'Sign out failed' };
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: mockError,
      });

      const result = await authService.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out failed');
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: mockUser,
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.getCurrentSession();

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should handle session retrieval error', async () => {
      const mockError = { message: 'Session retrieval failed' };
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const result = await authService.getCurrentSession();

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Session retrieval failed');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.resetPassword('test@example.com');

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle password reset error', async () => {
      const mockError = { message: 'Password reset failed' };
      
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: mockError,
      });

      const result = await authService.resetPassword('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password reset failed');
    });

    it('should validate email format for password reset', async () => {
      const result = await authService.resetPassword('invalid-email');

      expect(mockSupabaseClient.auth.resetPasswordForEmail).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('User Profile Updates', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Updated Name' },
      };

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.updateProfile({
        name: 'Updated Name',
      });

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        data: {
          name: 'Updated Name',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should handle profile update error', async () => {
      const mockError = { message: 'Profile update failed' };
      
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const result = await authService.updateProfile({
        name: 'Updated Name',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile update failed');
    });
  });

  describe('Auth State Monitoring', () => {
    it('should set up auth state change listener', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const unsubscribe = authService.onAuthStateChange(mockCallback);

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(
        mockCallback
      );
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle unexpected errors', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        'Unexpected error'
      );

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('An unexpected error occurred');
    });
  });
});
