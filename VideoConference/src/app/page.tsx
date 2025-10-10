'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientApi } from '@/hooks/useClientApi';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isAuthChecking } = useClientApi();

  useEffect(() => {
    if (!isAuthChecking) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [isAuthenticated, isAuthChecking, router]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return null; // Will redirect
}
