/**
 * AuthContext
 * Global state management for user authentication
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/food-label-scanner/models/User';
import { authService } from '@/lib/food-label-scanner/services/api/AuthService';
import { getFirebaseAuth, initializeFirebase } from '@/lib/food-label-scanner/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@food_lens_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase and load persisted user state
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Firebase first
        await initializeFirebase();
        
        // Load persisted user state
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to initialize Firebase or load persisted user:', err);
        setError('Failed to initialize app. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Listen to Firebase auth state changes
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Load user data from Firestore
          const { firestoreService } = require('@/lib/food-label-scanner/services/database/FirestoreService');
          const userData = await firestoreService.getUser(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
          }
        } catch (err: any) {
          console.error('Failed to load user data:', err);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(email, password, displayName);
      setUser(response.user);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const { firestoreService } = require('@/lib/food-label-scanner/services/database/FirestoreService');
      const userData = await firestoreService.getUser(user.uid);
      if (userData) {
        setUser(userData);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      }
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

