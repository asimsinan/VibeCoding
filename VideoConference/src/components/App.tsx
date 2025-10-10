/**
 * Main Application Component
 * Handles authentication state and routing between components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AuthComponent } from './AuthComponent';
import { RoomList } from './RoomList';
import { VideoConference } from './VideoConference';
import { useClientApi } from '@/hooks/useClientApi';
import { useCleanupScheduler } from '@/hooks/useCleanupScheduler';

type AppState = 'auth' | 'rooms' | 'conference';

interface ConferenceState {
  roomId: string;
  participantName: string;
}

export const App: React.FC = () => {
  const { isAuthenticated, isAuthChecking, currentUser, logout, getRooms } = useClientApi();
  const [appState, setAppState] = useState<AppState>('auth');
  const [conferenceState, setConferenceState] = useState<ConferenceState | null>(null);
  
  // Enable automatic cleanup of stale participants
  useCleanupScheduler(true);

  useEffect(() => {
    if (isAuthenticated) {
      setAppState('rooms');
    } else {
      setAppState('auth');
      setConferenceState(null);
    }
  }, [isAuthenticated]);

  const handleAuthSuccess = () => {
    setAppState('rooms');
  };

  const handleJoinRoom = (roomId: string, participantName: string) => {
    setConferenceState({ roomId, participantName });
    setAppState('conference');
  };

  const handleLeaveConference = async () => {
    setConferenceState(null);
    setAppState('rooms');
    // Refresh room list to update participant counts immediately
    await getRooms();
  };

  const handleLogout = async () => {
    await logout();
    setAppState('auth');
  };

  const renderContent = () => {
    // Show loading spinner while checking authentication
    if (isAuthChecking) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    switch (appState) {
      case 'auth':
        return <AuthComponent onAuthSuccess={handleAuthSuccess} />;
      
      case 'rooms':
        return (
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                      Zuumcuk App
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      Welcome, {currentUser?.name || 'User'}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
      
      case 'conference':
        if (!conferenceState) return null;
        return (
          <VideoConference
            roomId={conferenceState.roomId}
            participantName={conferenceState.participantName}
            onLeave={handleLeaveConference}
          />
        );
      
      default:
        return <AuthComponent onAuthSuccess={handleAuthSuccess} />;
    }
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
};
