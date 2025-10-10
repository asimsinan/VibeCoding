'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomList } from '@/components/RoomList';
import { useClientApi } from '@/hooks/useClientApi';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isAuthChecking, currentUser, logout, getRooms } = useClientApi();

  useEffect(() => {
    if (!isAuthChecking && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isAuthChecking, router]);

  const handleJoinRoom = (roomId: string, participantName: string) => {
    router.push(`/rooms/${roomId}`);
  };

  const handleLeaveConference = async () => {
    // Refresh room list to update participant counts immediately
    await getRooms();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

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

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="glass-card mx-4 mt-4 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Zuumcuk App
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Welcome, {currentUser?.name || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-destructive px-4 py-2 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <RoomList onJoinRoom={handleJoinRoom} />
      </main>
    </div>
  );
}