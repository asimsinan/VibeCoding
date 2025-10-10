/**
 * VideoConference Component
 * Main video conference interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useClientApi } from '@/hooks/useClientApi';
import { WebRTCIntegration } from './WebRTCIntegration';
import { MediaControls } from './MediaControls';
import { ParticipantList } from './ParticipantList';
import { ChatPanel } from './ChatPanel';
import { MediaTest } from './MediaTest';

interface VideoConferenceProps {
  roomId: string;
  participantName: string;
  onLeave: () => void;
}

export const VideoConference: React.FC<VideoConferenceProps> = ({
  roomId,
  participantName,
  onLeave
}) => {
  const {
    currentRoom,
    currentUser,
    participants,
    messages,
    error,
    sendMessage,
    getMessages,
    updateMediaPermissions,
    joinRoom,
    leaveRoom,
    getRoomParticipants
  } = useClientApi();

  const [mediaState] = useState({
    isCameraOn: true,
    isMicrophoneOn: true,
    isScreenSharing: false
  });

  // Track actual WebRTC stream states (not optimistic states)
  const [actualMediaState, setActualMediaState] = useState({
    isCameraOn: true,
    isMicrophoneOn: true,
    isScreenSharing: false
  });
  const [isRecording, setIsRecording] = useState(false);

  // Track real-time media state for each participant
  const [participantMediaStates, setParticipantMediaStates] = useState<Record<string, { isCameraOn: boolean; isMicrophoneOn: boolean }>>({});

  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants');
  const [webrtcParticipantId, setWebrtcParticipantId] = useState<string>('');
  const hasInitializedRef = React.useRef(false);
  const isCleaningUpRef = React.useRef(false);
  const webrtcRef = React.useRef<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [showMediaTest, setShowMediaTest] = useState(false);

  // Initialize conference - only run once
  useEffect(() => {
    if (hasInitializedRef.current || isCleaningUpRef.current) return;

    // CRITICAL: Wait for currentUser to be loaded before joining
    if (!currentUser) {
      return;
    }

    hasInitializedRef.current = true;

    const initializeConference = async () => {
      try {
        setIsJoining(true);
        // Join the room with real API and get the stable participant ID
        const { participantId } = await joinRoom(roomId, participantName);
        
        // Use the database participant ID instead of generating a random one
        // This ensures the ID stays the same if the user rejoins
        setWebrtcParticipantId(participantId);
        
        // Keep isJoining true until webrtcParticipantId is set
        // This ensures the loading screen stays until everything is ready
      } catch (err) {
        console.error('Failed to initialize conference:', err);
        hasInitializedRef.current = false; // Allow retry on error
        setIsJoining(false); // Only set to false on error
      }
    };

    initializeConference();

    // Cleanup on unmount
    return () => {
      if (hasInitializedRef.current && !isCleaningUpRef.current) {
        isCleaningUpRef.current = true;
 
        leaveRoom();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Re-run when currentUser loads

  // Set isJoining to false when webrtcParticipantId is set
  useEffect(() => {
    if (webrtcParticipantId && isJoining) {
      setIsJoining(false);
    }
  }, [webrtcParticipantId, isJoining]);

  // Initialize participantMediaStates for current user when webrtcParticipantId is set
  useEffect(() => {
    if (webrtcParticipantId && !participantMediaStates[webrtcParticipantId]) {
      
      setParticipantMediaStates(prev => ({
        ...prev,
        [webrtcParticipantId]: {
          isCameraOn: actualMediaState.isCameraOn,
          isMicrophoneOn: actualMediaState.isMicrophoneOn
        }
      }));
    }
  }, [webrtcParticipantId, actualMediaState, participantMediaStates]);

  // Update participantMediaStates when actualMediaState changes for current user
  useEffect(() => {
    if (webrtcParticipantId && participantMediaStates[webrtcParticipantId]) {
      const currentState = participantMediaStates[webrtcParticipantId];
      if (currentState.isCameraOn !== actualMediaState.isCameraOn || 
          currentState.isMicrophoneOn !== actualMediaState.isMicrophoneOn) {
        
        setParticipantMediaStates(prev => ({
          ...prev,
          [webrtcParticipantId]: {
            isCameraOn: actualMediaState.isCameraOn,
            isMicrophoneOn: actualMediaState.isMicrophoneOn
          }
        }));
      }
    }
  }, [webrtcParticipantId, actualMediaState, participantMediaStates]);

  // Cleanup on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Try to leave room when page is closing/refreshing
      const participantId = localStorage.getItem(`participant_${roomId}`);
      const accessToken = localStorage.getItem('accessToken');
      
      if (participantId && accessToken) {
        // Use sendBeacon for reliable cleanup on page unload
        // sendBeacon sends a POST request by default
        const formData = new FormData();
        formData.append('participantId', participantId);
        
        navigator.sendBeacon(
          `/api/rooms/${roomId}/leave`,
          new Blob([JSON.stringify({ participantId })], { type: 'application/json' })
        );
        
        // Clean up localStorage
        localStorage.removeItem(`participant_${roomId}`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId]);

  // Poll for participant updates every 1 second for faster updates
  useEffect(() => {
    if (!roomId) return;
    
    // Initial load
    getRoomParticipants(roomId);
    
    // Set up polling interval - faster polling for better responsiveness
    const interval = setInterval(() => {
      getRoomParticipants(roomId);
    }, 1000); // Reduced from 2000ms to 1000ms

    return () => {
      clearInterval(interval);
    };
  }, [roomId]); // Remove getRoomParticipants from dependencies

  // Poll for message updates every 2 seconds
  useEffect(() => {
    if (!roomId) return;
    
    // Set up polling interval for messages
    const interval = setInterval(() => {
      getMessages(roomId);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [roomId]); // Remove getMessages from dependencies

  // Send heartbeat to keep participant alive (every 10 seconds)
  useEffect(() => {
    if (!roomId || !currentRoom) return;

    // Get participant ID from localStorage
    const participantId = localStorage.getItem(`participant_${roomId}`);
    if (!participantId) return;

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/cleanup/participants', {
          method: 'POST',
          headers: {
            'X-Participant-Id': participantId,
          },
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    };

    // Send heartbeat immediately
    sendHeartbeat();

    // Send heartbeat every 10 seconds
    const interval = setInterval(() => {
      sendHeartbeat();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [roomId, currentRoom]);

  const handleCameraToggle = async () => {
    // Control actual WebRTC stream
    if (webrtcRef.current) {
      webrtcRef.current.toggleCamera();
    }
    
    // Update media permissions in database
    await updateMediaPermissions({
      camera: !actualMediaState.isCameraOn,
      microphone: actualMediaState.isMicrophoneOn,
      screenShare: actualMediaState.isScreenSharing
    });
  };

  const handleMicrophoneToggle = async () => {
    // Control actual WebRTC stream
    if (webrtcRef.current) {
      webrtcRef.current.toggleMicrophone();
    }
    
    // Update media permissions in database
    await updateMediaPermissions({
      camera: actualMediaState.isCameraOn,
      microphone: !actualMediaState.isMicrophoneOn,
      screenShare: actualMediaState.isScreenSharing
    });
  };

  const handleScreenShareToggle = async () => {
    // Control actual WebRTC stream
    if (webrtcRef.current) {
      webrtcRef.current.toggleScreenShare();
    }
    
    // Update media permissions in database
    await updateMediaPermissions({
      camera: actualMediaState.isCameraOn,
      microphone: actualMediaState.isMicrophoneOn,
      screenShare: !actualMediaState.isScreenSharing
    });
  };

  const handleRecordToggle = async () => {
    // Control recording
    if (webrtcRef.current) {
      webrtcRef.current.toggleRecording();
      setIsRecording(prev => !prev);
    }
  };

  // Handle media state changes from WebRTCIntegration
  const handleMediaStateChange = (participantId: string, mediaState: { isCameraOn: boolean; isMicrophoneOn: boolean; isScreenSharing?: boolean }) => {
    setParticipantMediaStates(prev => ({
      ...prev,
      [participantId]: {
        isCameraOn: mediaState.isCameraOn,
        isMicrophoneOn: mediaState.isMicrophoneOn
      }
    }));
    
    // Update actual media state if this is the current user
    if (participantId === webrtcParticipantId) {
      setActualMediaState(prev => ({
        ...prev,
        isCameraOn: mediaState.isCameraOn,
        isMicrophoneOn: mediaState.isMicrophoneOn,
        isScreenSharing: mediaState.isScreenSharing ?? prev.isScreenSharing
      }));
    }
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleLeaveRoom = async () => {
    try {
      // CRITICAL: Mark as cleaning up FIRST to prevent reconnections
      isCleaningUpRef.current = true;
      hasInitializedRef.current = false;
      
      
      // Call leaveRoom API
      await leaveRoom();
      
      // Clear the cached participant ID
      setWebrtcParticipantId('');
      
      // Navigate away
      onLeave();
    } catch (error) {
      console.error('Error leaving room:', error);
      // Still navigate away even if API call fails
      onLeave();
    }
  };

  // Show loading screen only when joining (not when other operations are loading)
  if (isJoining || (!currentRoom && !webrtcParticipantId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="glass-card p-12 text-center fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Joining Conference</h3>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we connect you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="glass-card p-12 text-center fade-in max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Failed to Join Conference
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error}
          </p>
          <button
            onClick={onLeave}
            className="btn btn-primary px-8 py-3 text-base font-semibold"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <div className="glass-card mx-4 mt-4 mb-2 shadow-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {currentRoom?.name || 'Zuumcuk Room'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''} • {participantName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${mediaState.isCameraOn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Camera</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${mediaState.isMicrophoneOn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Mic</span>
                </div>
              </div>
              
              {/* Media Test Button */}
              <button
                onClick={() => setShowMediaTest(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Test Media</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden mx-4 mb-4 gap-4">
        {/* Video Area */}
        <div className="flex-1 glass-card rounded-2xl overflow-hidden shadow-xl">
          <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
            {/* WebRTC Integration */}
            {webrtcParticipantId && currentUser && (
              <WebRTCIntegration
                ref={webrtcRef}
                roomId={roomId}
                participantId={webrtcParticipantId}
                participantName={participantName}
                userId={currentUser.id}
                participants={participants}
                onStreamReceived={() => {
                }}
                onParticipantJoined={() => {
                }}
                onParticipantLeft={() => {
                }}
                onMediaStateChange={handleMediaStateChange}
              />
            )}

            {/* Screen share indicator */}
            {mediaState.isScreenSharing && (
              <div className="absolute top-6 left-6 glass-card px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg fade-in">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Screen Sharing Active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 glass-card rounded-2xl shadow-xl flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 ${
                activeTab === 'participants'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Participants ({participants.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 ${
                activeTab === 'chat'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'participants' ? (
              <ParticipantList
                participants={participants.map(participant => ({
                  ...participant,
                  // Override mediaPermissions with real-time media state if available
                  mediaPermissions: {
                    ...participant.mediaPermissions,
                    camera: participantMediaStates[participant.id]?.isCameraOn ?? participant.mediaPermissions.camera,
                    microphone: participantMediaStates[participant.id]?.isMicrophoneOn ?? participant.mediaPermissions.microphone
                  }
                }))}
              />
            ) : (
              <ChatPanel
                messages={(messages || []).filter(msg => msg && msg.id).map(msg => ({
                  id: msg.id,
                  content: msg.content,
                  participantName: msg.participantName,
                  timestamp: msg.createdAt
                }))}
                onSendMessage={handleSendMessage}
                disabled={!currentRoom?.settings.allowChat}
              />
            )}
          </div>
        </div>
      </div>

      {/* Media Controls */}
      <MediaControls
        isCameraOn={actualMediaState.isCameraOn}
        isMicrophoneOn={actualMediaState.isMicrophoneOn}
        isScreenSharing={actualMediaState.isScreenSharing}
        isRecording={isRecording}
        onCameraToggle={handleCameraToggle}
        onMicrophoneToggle={handleMicrophoneToggle}
        onScreenShareToggle={handleScreenShareToggle}
        onRecordToggle={handleRecordToggle}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Media Test Modal */}
      {showMediaTest && (
        <MediaTest onClose={() => setShowMediaTest(false)} />
      )}
    </div>
  );
};
