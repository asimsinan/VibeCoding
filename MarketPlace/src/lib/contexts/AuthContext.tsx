'use client';

// Authentication Context
// React context for sharing authentication state across components

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api/services/auth';
import { LoginRequest, RegisterRequest, UserProfile } from '../api/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    profile?: UserProfile;
  } | null;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

interface AuthContextType extends AuthState, AuthActions {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        authService.initializeAuth();
        
        if (authService.isAuthenticated()) {
          const user = await authService.getCurrentUser();
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user,
            isLoading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Authentication initialization failed',
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.login(credentials);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: response.user,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.register(userData);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: response.user,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authService.logout();
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Logout failed',
        isLoading: false,
      }));
    }
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const updatedProfile = await authService.updateProfile(profileData);
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, profile: updatedProfile } : null,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Profile update failed',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
