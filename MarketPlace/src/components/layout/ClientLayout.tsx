'use client';

// Client Layout Wrapper
// Wrapper component to handle client-side layout rendering and prevent hydration mismatches

import React, { useState, useEffect } from 'react';
import { Layout } from './Layout/Layout';
import { useAuth } from '../../lib/hooks/useAuth';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const { isLoading } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent hydration mismatch by only rendering client-side after mount
  // Also wait for authentication to initialize
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          {/* Simple loading state that matches the server-rendered structure */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex-shrink-0">
                  <div className="h-8 w-32 bg-gray-200 rounded"></div>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </nav>
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="h-8 w-32 bg-gray-700 rounded mb-4"></div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
};
