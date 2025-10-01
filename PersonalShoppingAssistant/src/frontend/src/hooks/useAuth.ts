/**
 * Authentication Hooks
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This file provides React hooks for authentication functionality
 * including login, registration, profile management, and session handling.
 */

import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { authService, User, UserProfile, UserPreferences, RegisterData, LoginData, UpdateProfileData, apiClient } from '../api';
import { useApi, useApiMutation } from './useApi';

// Auth Context
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 Auth check - isAuthenticated():', authService.isAuthenticated());
      if (authService.isAuthenticated()) {
        try {
          console.log('🔐 Auth check - Getting profile...');
          const response = await authService.getProfile();
          console.log('🔐 Auth check - Profile response:', response);
        if (response.success && response.data) {
          setUser(response.data);
          console.log('🔐 Auth check - User set:', response.data);
        } else {
          console.log('🔐 Auth check - Profile failed, logging out');
          authService.logout();
        }
        } catch (error) {
          console.log('🔐 Auth check - Profile error, logging out:', error);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (data: LoginData) => {
    const response = await authService.login(data);
    if (response.success && response.data) {
      apiClient.setAuthToken(response.data.token);
      setUser(response.data.user);
    } else {
      throw new Error(response.error?.message || 'Login failed');
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authService.register(data);
    if (response.success && response.data) {
      apiClient.setAuthToken(response.data.token);
      setUser(response.data.user);
    } else {
      throw new Error(response.error?.message || 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    const response = await authService.updateProfile(data);
    if (response.success && response.data) {
      setUser(response.data);
    } else {
      throw new Error(response.error?.message || 'Profile update failed');
    }
  }, []);

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    const response = await authService.updatePreferences(preferences);
    if (response.success && response.data) {
      // Update user preferences in state
      setUser(prev => prev ? { ...prev, preferences: response.data! } : null);
    } else {
      throw new Error(response.error?.message || 'Preferences update failed');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (authService.isAuthenticated()) {
      try {
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    refreshProfile,
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for user profile
export function useUserProfile() {
  return useApi(() => authService.getProfile());
}

// Hook for profile update
export function useUpdateProfile() {
  return useApiMutation(authService.updateProfile);
}

// Hook for preferences update
export function useUpdatePreferences() {
  return useApiMutation(authService.updatePreferences);
}

// Hook for login
export function useLogin() {
  return useApiMutation(authService.login);
}

// Hook for registration
export function useRegister() {
  return useApiMutation(authService.register);
}

// Hook for logout
export function useLogout() {
  const { logout } = useAuth();

  return useCallback(() => {
    logout();
  }, [logout]);
}

// Hook for authentication status
export function useAuthStatus() {
  const { isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    isLoggedIn: isAuthenticated,
    isLoggedOut: !isAuthenticated && !isLoading,
  };
}

// Hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login or show login modal
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}

// Hook for user preferences
export function useUserPreferences() {
  const { user } = useAuth();
  
  return {
    preferences: user?.preferences || null,
    hasPreferences: !!user?.preferences,
    updatePreferences: useUpdatePreferences(),
  };
}

// Hook for user interaction stats
export function useUserStats() {
  const { user } = useAuth();
  
  return {
    stats: user && 'interactionStats' in user ? (user as UserProfile).interactionStats : null,
    hasStats: !!(user && 'interactionStats' in user),
  };
}
