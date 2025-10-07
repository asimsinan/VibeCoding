/**
 * Auth hook
 * Provides authentication state management and actions
 */

'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { AuthService, supabase } from '../services/authService';
// import { AuthError } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: typeof AuthService.signUp;
  signIn: typeof AuthService.signIn;
  signOut: typeof AuthService.signOut;
  updateUser: typeof AuthService.updateUser;
  resetPassword: typeof AuthService.resetPassword;
  socialSignIn: typeof AuthService.socialSignIn;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    AuthService.getSession().then((initialSession) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false);
    }).catch((err) => {
      setError(new Error(err.message));
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthAction = async (action: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await action();
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(new Error(err.message));
      setLoading(false);
      throw err;
    }
  };

  const value = {
    session,
    user,
    loading,
    error,
    signUp: (email: string, password: string, name?: string) =>
      handleAuthAction(() => AuthService.signUp(email, password, name)),
    signIn: (email: string, password: string) =>
      handleAuthAction(() => AuthService.signIn(email, password)),
    signOut: () => handleAuthAction(() => AuthService.signOut()),
    updateUser: (updates: { email?: string; password?: string; data?: object }) =>
      handleAuthAction(() => AuthService.updateUser(updates)),
    resetPassword: (email: string) =>
      handleAuthAction(() => AuthService.resetPassword(email)),
    socialSignIn: (provider: 'google' | 'github') =>
      handleAuthAction(() => AuthService.socialSignIn(provider)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};