/**
 * Unit tests for useAuth hook
 * Tests authentication state management and Supabase integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../../src/lib/auth/hooks/useAuth';

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
  },
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should initialize with empty error state', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('Sign Up', () => {
    it('should sign up user successfully', async () => {
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

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User');
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

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    it('should handle sign up error', async () => {
      const mockError = { message: 'Email already registered' };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toEqual(mockError.message);
    });

    it('should validate email format', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('invalid-email', 'password123', 'Test User');
      });

      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
      expect(result.current.error).toContain('Invalid email format');
    });

    it('should validate password strength', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('test@example.com', '123', 'Test User');
      });

      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
      expect(result.current.error).toContain('Password must be at least 8 characters');
    });
  });

  describe('Sign In', () => {
    it('should sign in user successfully', async () => {
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

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    it('should handle sign in error', async () => {
      const mockError = { message: 'Invalid credentials' };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toEqual(mockError.message);
    });
  });

  describe('Sign Out', () => {
    it('should sign out user successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should handle sign out error', async () => {
      const mockError = { message: 'Sign out failed' };
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.error).toEqual(mockError.message);
    });
  });

  describe('Session Management', () => {
    it('should get current session on mount', async () => {
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

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should handle session retrieval error', async () => {
      const mockError = { message: 'Session retrieval failed' };
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toEqual(mockError.message);
    });
  });

  describe('Auth State Changes', () => {
    it('should listen to auth state changes', () => {
      const mockCallback = jest.fn();
      
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      renderHook(() => useAuth());

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should update state when auth state changes', async () => {
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

      let authStateCallback: (event: string, session: any) => void;

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      const { result } = renderHook(() => useAuth());

      // Simulate auth state change
      act(() => {
        authStateCallback('SIGNED_IN', mockSession);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });
  });

  describe('Error Handling', () => {
    it('should clear error when new operation starts', async () => {
      const { result } = renderHook(() => useAuth());

      // Set an error first
      act(() => {
        result.current.setError('Previous error');
      });

      expect(result.current.error).toBe('Previous error');

      // Start new operation
      act(() => {
        result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.error).toContain('Network error');
    });
  });
});
