/**
 * Mood API Context Provider
 * 
 * Provides API client context to all components in the app.
 * 
 * @fileoverview React context for API client
 * @author Mental Health Journal App
 * @version 1.0.0
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { MoodApiClient, MoodApiClientConfig } from '@/lib/mood-api';

interface MoodApiContextType {
  client: MoodApiClient;
}

const MoodApiContext = createContext<MoodApiContextType | undefined>(undefined);

interface MoodApiProviderProps {
  children: ReactNode;
  config: MoodApiClientConfig;
}

export function MoodApiProvider({ children, config }: MoodApiProviderProps) {
  const client = new MoodApiClient(config);

  return (
    <MoodApiContext.Provider value={{ client }}>
      {children}
    </MoodApiContext.Provider>
  );
}

export function useMoodApiContext(): MoodApiContextType {
  const context = useContext(MoodApiContext);
  if (context === undefined) {
    throw new Error('useMoodApiContext must be used within a MoodApiProvider');
  }
  return context;
}
