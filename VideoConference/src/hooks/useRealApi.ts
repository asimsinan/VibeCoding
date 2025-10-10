/**
 * Real API Hook
 * Custom hook for interacting with real API services
 */

import { useState, useEffect, useCallback } from 'react';
import { apiServiceFactory } from '@/lib/video-conferencing/services/api-service.factory';
import { Room, Participant, Message } from '@/lib/video-conferencing/models';
import { AuthService } from '@/lib/auth/auth.service';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

export interface UseRealApiReturn {
  // State
  rooms: Room[];
  currentRoom: Room | null;
  participants: Participant[];
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  isAuthenticated: boolean;
  currentUser: any | null;
  
  // Authentication actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  
  // Room actions
  createRoom: (roomData: {
    name: string;
    maxParticipants: number;
    settings: {
      allowScreenShare: boolean;
      allowChat: boolean;
      allowCamera: boolean;
      allowMicrophone: boolean;
      recordingEnabled: boolean;
    };
  }) => Promise<void>;
  joinRoom: (roomId: string, participantName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  getRooms: () => Promise<void>;
  updateRoom: (roomId: string, updates: any) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  
  // Message actions
  sendMessage: (content: string) => Promise<void>;
  getMessages: (roomId: string) => Promise<void>;
  
  // Media actions
  updateMediaPermissions: (permissions: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
  }) => Promise<void>;
  
  // Utility actions
  retry: () => void;
  clearError: () => void;
}

export const useRealApi = (): UseRealApiReturn => {
  const [apiService] = useState(() => apiServiceFactory.createService('real'));
  const [authService] = useState(() => new AuthService(DatabaseService.getInstance()));
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<string>('');

  // Initialize authentication state
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
      // Verify token and get user info
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const user = await authService.getUserProfile(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  // Error handler
  const handleError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(errorMessage);
    console.error('Real API Error:', err);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // Retry function
  const retry = useCallback(async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setError(null);
      // Retry the last operation
      if (currentRoom) {
        await getRooms();
      }
    } else {
      setError('Maximum retry attempts reached. Please try again later.');
    }
  }, [retryCount, currentRoom]);

  // Authentication actions
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const result = await authService.login({ email, password });
      
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      
      // Load user's rooms after login
      await getRooms();
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [authService, handleError, clearError]);

  const register = useCallback(async (userData: { email: string; password: string; name: string }) => {
    try {
      setIsLoading(true);
      clearError();
      
      await authService.register(userData);
      
      // Auto-login after registration
      await login(userData.email, userData.password);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [authService, login, handleError, clearError]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
    } catch (err) {
      handleError(err);
    }
  }, [authService, handleError]);

  // Create room
  const createRoom = useCallback(async (roomData: {
    name: string;
    maxParticipants: number;
    settings: {
      allowScreenShare: boolean;
      allowChat: boolean;
      allowCamera: boolean;
      allowMicrophone: boolean;
      recordingEnabled: boolean;
    };
  }) => {
    try {
      if (!isAuthenticated || !currentUser) {
        throw new Error('User must be authenticated to create rooms');
      }

      setIsLoading(true);
      clearError();
      
      const result = await apiService.createRoom({
        name: roomData.name,
        maxParticipants: roomData.maxParticipants,
        createdBy: currentUser.id,
        settings: roomData.settings
      });
      
      setRooms(prev => [result.room, ...prev]);
      setCurrentRoom(result.room);
      
      // Don't automatically join the room as creator
      // User should explicitly join the room if they want to participate
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isAuthenticated, currentUser, handleError, clearError]);

  // Join room
  const joinRoom = useCallback(async (roomId: string, participantName: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const result = await apiService.joinRoom(roomId, {
        participantName,
        userId: currentUser?.id || 'anonymous'
      });
      
      setCurrentRoom(result.room);
      setParticipants(result.participants);
      setCurrentParticipantId(result.participant.id);
      
      // Load messages for the room
      await getMessages(roomId);
      
      // WebSocket removed - using PollingRealtimeService in WebRTCIntegration instead
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, currentUser, handleError, clearError]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    try {
      if (!currentRoom || !currentParticipantId) {
        return;
      }

      await apiService.leaveRoom(currentRoom.id);
      
      // WebSocket removed - using PollingRealtimeService in WebRTCIntegration instead
      
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
      setCurrentParticipantId('');
      
      // Refresh room list to update participant counts
      await getRooms();
    } catch (err) {
      handleError(err);
    }
  }, [currentRoom, currentParticipantId, apiService, handleError]);

  // Get rooms
  const getRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const result = await apiService.getRoom('');
      setRooms(result.rooms);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, handleError, clearError]);

  // Update room
  const updateRoom = useCallback(async (roomId: string, updates: any) => {
    try {
      if (!isAuthenticated || !currentUser) {
        throw new Error('User must be authenticated to update rooms');
      }

      setIsLoading(true);
      clearError();
      
      const result = await apiService.updateRoom(roomId, { ...updates, userId: currentUser.id });
      
      setRooms(prev => prev.map(room => 
        room.id === roomId ? result.room : room
      ));
      
      if (currentRoom?.id === roomId) {
        setCurrentRoom(result.room);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isAuthenticated, currentUser, currentRoom, handleError, clearError]);

  // Delete room
  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      if (!isAuthenticated || !currentUser) {
        throw new Error('User must be authenticated to delete rooms');
      }

      setIsLoading(true);
      clearError();
      
      await apiService.deleteRoom(roomId);
      
      setRooms(prev => prev.filter(room => room.id !== roomId));
      
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
        setParticipants([]);
        setMessages([]);
        // WebSocket removed - using PollingRealtimeService in WebRTCIntegration instead
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isAuthenticated, currentUser, currentRoom, handleError, clearError]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    try {
      if (!currentRoom || !currentParticipantId) {
        throw new Error('No room selected or participant not found');
      }
      
      const result = await apiService.sendMessage(currentRoom.id, {
        content,
        participantId: currentParticipantId,
        participantName: currentUser?.name || 'Anonymous',
        messageType: 'text'
      });
      
      setMessages(prev => [result.message, ...(prev || [])]);
    } catch (err) {
      handleError(err);
    }
  }, [currentRoom, currentParticipantId, currentUser, apiService, handleError]);

  // Get messages
  const getMessages = useCallback(async (roomId: string) => {
    try {
      const result = await apiService.getRoom(roomId);
      setMessages(result.messages);
    } catch (err) {
      handleError(err);
    }
  }, [apiService, handleError]);

  // Update media permissions
  const updateMediaPermissions = useCallback(async (permissions: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
  }) => {
    try {
      if (!currentRoom || !currentParticipantId) {
        throw new Error('No room selected or participant not found');
      }
      
      // TODO: Implement updateMediaPermissions when API service supports it
      // await apiService.updateMediaPermissions(currentRoom.id, currentParticipantId, permissions);
      
      // Update local participant state
      setParticipants(prev => prev.map(p => 
        p.id === currentParticipantId 
          ? { ...p, mediaPermissions: permissions }
          : p
      ));
    } catch (err) {
      handleError(err);
    }
  }, [currentRoom, currentParticipantId, apiService, handleError]);

  return {
    // State
    rooms,
    currentRoom,
    participants,
    messages,
    isLoading,
    error,
    retryCount,
    isAuthenticated,
    currentUser,
    
    // Authentication actions
    login,
    register,
    logout,
    
    // Room actions
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    updateRoom,
    deleteRoom,
    
    // Message actions
    sendMessage,
    getMessages,
 
    
    // Media actions
    updateMediaPermissions,
    
    // Utility actions
    retry,
    clearError
  };
};
