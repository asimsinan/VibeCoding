'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token on mount
    const token = apiClient.getToken();
    if (token) {
      // Verify token and get user info
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any pending operations when component unmounts
      setUser(null);
      setLoading(false);
    };
  }, []);

  const verifyToken = async () => {
    try {
     
      const response = await apiClient.get('/users/profile');
     
      if (response.success && (response as any).id) {
        // The user data is at the root level of the response
        const userData = {
          id: (response as any).id,
          email: (response as any).email,
          name: (response as any).name,
          role: (response as any).role
        };
        setUser(userData as User);
        console.log('User set:', userData);
      } else {
        
        apiClient.clearToken();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      apiClient.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.success) {
        const { token, user: userData } = response as any;
        apiClient.setToken(token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      if (response.success) {
        const { token, user: userData } = response as any;
        apiClient.setToken(token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    router.push('/auth/login');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};