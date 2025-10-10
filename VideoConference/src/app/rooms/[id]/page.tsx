'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { VideoConference } from '@/components/VideoConference';
import { useClientApi } from '@/hooks/useClientApi';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isAuthChecking, currentUser } = useClientApi();
  const [isLoading, setIsLoading] = useState(true);

  const roomId = params.id as string;

  useEffect(() => {
    if (!isAuthChecking) {
      if (!isAuthenticated) {
        router.push('/');
        return;
      }
      
      if (!roomId) {
        router.push('/dashboard');
        return;
      }
      
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthChecking, roomId, router]);

  const handleLeaveConference = () => {
    router.push('/dashboard');
  };

  if (isAuthChecking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (!roomId) {
    return null; // Will redirect
  }

  return (
    <VideoConference
      roomId={roomId}
      participantName={currentUser?.name || 'Anonymous'}
      onLeave={handleLeaveConference}
    />
  );
}
