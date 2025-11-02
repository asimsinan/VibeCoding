/**
 * AppContext
 * Global application state management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeFirebase } from '@/lib/food-label-scanner/config/firebase';
import { AuthProvider } from './AuthContext';
import { ScanProvider } from './ScanContext';
import { ToastProvider } from './ToastContext';

interface AppStateType {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'tr';
  offlineMode: boolean;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'en' | 'tr') => void;
  setOfflineMode: (enabled: boolean) => void;
}

const AppStateContext = createContext<AppStateType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [language, setLanguage] = useState<'en' | 'tr'>('en');
  const [offlineMode, setOfflineMode] = useState(false);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  // Initialize Firebase when app starts
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await initializeFirebase();
        setFirebaseInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        // Don't block the app from loading, but log the error
      }
    };

    initFirebase();
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        theme,
        language,
        offlineMode,
        setTheme,
        setLanguage,
        setOfflineMode,
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <ScanProvider>{children}</ScanProvider>
        </AuthProvider>
      </ToastProvider>
    </AppStateContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

