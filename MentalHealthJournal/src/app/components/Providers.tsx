/**
 * App Providers Component
 * 
 * Wraps the app with necessary providers for client-side functionality.
 * 
 * @fileoverview Providers wrapper component
 * @author Mental Health Journal App
 * @version 1.0.0
 */

'use client'

import { ReactNode } from 'react';
import { MoodApiProvider } from '@/app/contexts/MoodApiContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // API client configuration - use same domain in production
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      // Client-side: use current domain
      return '';
    }
    // Server-side: use environment variable or default
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  };

  const apiConfig = {
    baseURL: getApiBaseUrl(),
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    enableCaching: true,
    cacheTimeout: 300000, // 5 minutes
  };

  return (
    <MoodApiProvider config={apiConfig}>
      {children}
    </MoodApiProvider>
  );
}
