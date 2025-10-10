/**
 * Client-side API Hook
 * Handles API calls to Next.js API routes instead of direct database access
 */

import { useState, useEffect, useCallback } from 'react';

// Define types locally to avoid complex imports
interface Room {
  id: string;
  name: string;
  maxParticipants: number;
  createdBy: string;
  settings: {
    allowScreenShare: boolean;
    allowChat: boolean;
    allowCamera: boolean;
    allowMicrophone: boolean;
    recordingEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface Participant {
  id: string;
  name: string;
  userId: string;
  roomId: string;
  isConnected: boolean;
  mediaPermissions: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
  };
  joinedAt: string;
}

interface Message {
  id: string;
  content: string;
  participantId: string;
  participantName: string;
  roomId: string;
  messageType: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: string;
}

export interface UseClientApiReturn {
  // State
  rooms: (Room & { participantCount: number })[];
  currentRoom: Room | null;
  participants: Participant[];
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  currentUser: User | null;
  
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
  joinRoom: (roomId: string, participantName: string) => Promise<{ participantId: string; participant: Participant }>;
  leaveRoom: () => Promise<void>;
  getRooms: () => Promise<void>;
  getRoomParticipants: (roomId: string) => Promise<void>;
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

export const useClientApi = (): UseClientApiReturn => {
  const [rooms, setRooms] = useState<(Room & { participantCount: number })[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Add auth checking state
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<string>('');
  
  // Debug function to log participant ID changes
  const debugSetCurrentParticipantId = useCallback((id: string) => {
    setCurrentParticipantId(id);
  }, []);

  // Initialize participant ID from localStorage if available
  useEffect(() => {
    const restoreParticipantId = () => {
      // Check if we're in a room and have a stored participant ID
      if (currentRoom) {
        const storedParticipantId = localStorage.getItem(`participant_${currentRoom.id}`);
        if (storedParticipantId && !currentParticipantId) {
          debugSetCurrentParticipantId(storedParticipantId);
        }
      }
    };
    
    restoreParticipantId();
  }, [currentRoom, currentParticipantId, debugSetCurrentParticipantId]);

  // WebSocket state removed - using PollingRealtimeService instead

  const verifyToken = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCurrentUser(result.data);
          setIsAuthenticated(true);
          return true;
        } else {
          throw new Error(result.message || 'Invalid token');
        }
      } else {
        throw new Error('Invalid token');
      }
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      setCurrentUser(null);
      return false;
    }
  }, []);

  // Initialize authentication state - ONLY run once on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      verifyToken(token).then(() => {
        setIsAuthChecking(false); // Always set to false when done checking
      });
    } else {
      setIsAuthChecking(false); // No token, so we're done checking
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Error handler
  const handleError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(errorMessage);
    console.error('Client API Error:', err);
    
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
      // Retry the last operation - call getRooms directly without dependency
      if (currentRoom) {
        try {
          setIsLoading(true);
          clearError();
          
          const response = await fetch('/api/rooms', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get rooms');
          }

          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to get rooms');
          }
          
          // Parse settings for all rooms
          const roomsWithParsedSettings = (result.data || []).map((room: any) => ({
            ...room,
            settings: typeof room.settings === 'string' 
              ? JSON.parse(room.settings) 
              : room.settings
          }));
          
          setRooms(roomsWithParsedSettings);
        } catch (err) {
          handleError(err);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      setError('Maximum retry attempts reached. Please try again later.');
    }
  }, [retryCount, currentRoom, handleError, clearError]);

  // Get rooms
  const getRooms = useCallback(async () => {
    try {
      // Don't show loading spinner for polling updates (only for initial load)
      // setIsLoading(true);
      clearError();
      
      const response = await fetch('/api/rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get rooms');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get rooms');
      }
      
      // Parse settings for all rooms
      const roomsWithParsedSettings = (result.data || []).map((room: any) => ({
        ...room,
        settings: typeof room.settings === 'string' 
          ? JSON.parse(room.settings) 
          : room.settings
      }));
      
      // Only update if data has actually changed
      setRooms(prevRooms => {
        const hasChanged = JSON.stringify(prevRooms) !== JSON.stringify(roomsWithParsedSettings);
        return hasChanged ? roomsWithParsedSettings : prevRooms;
      });
    } catch (err) {
      handleError(err);
    }
    // finally {
    //   setIsLoading(false);
    // }
  }, [handleError, clearError]);

  // Authentication actions
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      // Clear any existing tokens before attempting login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setRooms([]);
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
      debugSetCurrentParticipantId('');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Login failed');
      }
      
      
      localStorage.setItem('accessToken', result.data.tokens.accessToken);
      localStorage.setItem('refreshToken', result.data.tokens.refreshToken);
      
      setCurrentUser(result.data.user);
      setIsAuthenticated(true);
      
      // Load user's rooms after login
      try {
        await getRooms();
      } catch (roomsError) {
        console.warn('Failed to load rooms after login:', roomsError);
        // Don't fail the entire login if rooms loading fails
      }
    } catch (err) {
      // Reset authentication state on login failure
      // Clear all authentication data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Reset all authentication state
      setIsAuthenticated(false);
      setCurrentUser(null);
      setRooms([]);
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
      debugSetCurrentParticipantId('');
      
      handleError(err);
      
      // Re-throw the error so AuthComponent knows login failed
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError, getRooms]);

  const register = useCallback(async (userData: { email: string; password: string; name: string }) => {
    try {
      setIsLoading(true);
      clearError();
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }
      
      // Auto-login after registration
      await login(userData.email, userData.password);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [login, handleError, clearError]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
      
      // WebSocket cleanup removed - using PollingRealtimeService instead
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

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
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          name: roomData.name,
          maxParticipants: roomData.maxParticipants,
          createdBy: currentUser.id,
          settings: roomData.settings,
          participantName: currentUser.name || 'Anonymous'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create room');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create room');
      }
      
      setRooms(prev => [{
        ...result.data.room,
        settings: typeof result.data.room.settings === 'string' 
          ? JSON.parse(result.data.room.settings) 
          : result.data.room.settings
      }, ...(prev || [])]);
      setCurrentRoom({
        ...result.data.room,
        settings: typeof result.data.room.settings === 'string' 
          ? JSON.parse(result.data.room.settings) 
          : result.data.room.settings
      });
      
      // Don't automatically join the room as creator
      // User should explicitly join the room if they want to participate
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, handleError, clearError]);

  // Join room
  const joinRoom = useCallback(async (roomId: string, participantName: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          participantName,
          userId: currentUser?.id || 'anonymous'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join room');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to join room');
      }
      
      setCurrentRoom({
        ...result.data.room,
        settings: typeof result.data.room.settings === 'string' 
          ? JSON.parse(result.data.room.settings) 
          : result.data.room.settings
      });
      setParticipants(result.data.participants || []);
      debugSetCurrentParticipantId(result.data.participant.id);
      
      // Store participant ID in localStorage for cleanup on page refresh
      localStorage.setItem(`participant_${roomId}`, result.data.participant.id);
      
      // Load messages for the room
      await getMessages(roomId);
      
      // WebSocket connection removed - using PollingRealtimeService in WebRTCIntegration instead
      
      // Return the participant data
      return {
        participantId: result.data.participant.id,
        participant: result.data.participant
      };
    } catch (err) {
      handleError(err);
      throw err; // Re-throw so caller knows it failed
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, handleError, clearError]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    try {
      if (!currentRoom || !currentParticipantId) {
        return;
      }

      await fetch(`/api/rooms/${currentRoom.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ participantId: currentParticipantId }),
      });
      
      // WebSocket cleanup removed - using PollingRealtimeService instead
      
      // Clean up localStorage
      if (currentRoom) {
        localStorage.removeItem(`participant_${currentRoom.id}`);
      }
      
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
      debugSetCurrentParticipantId('');
      
      // Refresh room list to update participant counts
      await getRooms();
    } catch (err) {
      handleError(err);
    }
  }, [currentRoom, currentParticipantId, handleError, getRooms]);

  // Update room
  const updateRoom = useCallback(async (roomId: string, updates: any) => {
    try {
      if (!isAuthenticated || !currentUser) {
        throw new Error('User must be authenticated to update rooms');
      }

      setIsLoading(true);
      clearError();
      
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update room');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update room');
      }
      
      setRooms(prev => prev.map(room => 
        room.id === roomId ? {
          ...result.data,
          settings: typeof result.data.settings === 'string' 
            ? JSON.parse(result.data.settings) 
            : result.data.settings
        } : room
      ));
      
      if (currentRoom?.id === roomId) {
        setCurrentRoom({
          ...result.data,
          settings: typeof result.data.settings === 'string' 
            ? JSON.parse(result.data.settings) 
            : result.data.settings
        });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, currentRoom, handleError, clearError]);

  // Delete room
  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      if (!isAuthenticated || !currentUser) {
        throw new Error('User must be authenticated to delete rooms');
      }

      setIsLoading(true);
      clearError();
      
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete room');
      }
      
      setRooms(prev => prev.filter(room => room.id !== roomId));
      
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
        setParticipants([]);
        setMessages([]);
        // WebSocket cleanup removed - using PollingRealtimeService instead
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, currentRoom, handleError, clearError]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    try {
      if (!currentRoom) {
        throw new Error('No room selected. Please wait for the room to load.');
      }

      // Get participant ID from state or localStorage as fallback
      let participantId = currentParticipantId;
      if (!participantId && currentRoom) {
        participantId = localStorage.getItem(`participant_${currentRoom.id}`) || '';
      }

      if (!participantId) {
        throw new Error('Participant not found. Please wait for the room to load or refresh the page.');
      }
      
      const response = await fetch(`/api/rooms/${currentRoom.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          content,
          participantId: participantId,
          participantName: currentUser?.name || 'Anonymous',
          messageType: 'text'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const result = await response.json();
      // Convert snake_case database fields to camelCase for consistency
      const formattedMessage = {
        id: result.data.id,
        content: result.data.message || result.data.content,
        participantId: result.data.participant_id || result.data.participantId,
        participantName: result.data.participant_name || result.data.participantName,
        roomId: result.data.room_id || result.data.roomId,
        messageType: result.data.message_type || result.data.messageType,
        createdAt: result.data.created_at || result.data.createdAt
      };
      setMessages(prev => [formattedMessage, ...(prev || [])]);
    } catch (err) {
      handleError(err);
    }
  }, [currentRoom, currentParticipantId, currentUser, handleError]);

  // Get messages
  const getMessages = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get messages');
      }

      const result = await response.json();
      // Convert snake_case database fields to camelCase for consistency
      const formattedMessages = (result.data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.message || msg.content,
        participantId: msg.participant_id || msg.participantId,
        participantName: msg.participant_name || msg.participantName,
        roomId: msg.room_id || msg.roomId,
        messageType: msg.message_type || msg.messageType,
        createdAt: msg.created_at || msg.createdAt
      }));
      
      // Only update if data has actually changed
      setMessages(prevMessages => {
        const hasChanged = JSON.stringify(prevMessages) !== JSON.stringify(formattedMessages);
        return hasChanged ? formattedMessages : prevMessages;
      });
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

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
      
      const response = await fetch(`/api/rooms/${currentRoom.id}/participants/${currentParticipantId}/media`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(permissions),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update media permissions');
      }
      
      // Update local participant state
      setParticipants(prev => prev.map(p => 
        p.id === currentParticipantId 
          ? { ...p, mediaPermissions: permissions }
          : p
      ));
    } catch (err) {
      handleError(err);
    }
  }, [currentRoom, currentParticipantId, handleError]);

  // Get room participants
  const getRoomParticipants = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/participants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get room participants');
      }

      const result = await response.json();
      
      if (result.success) {
        const newParticipants = result.data || [];
        
        // Only update if data has actually changed
        setParticipants(prevParticipants => {
          const hasChanged = JSON.stringify(prevParticipants) !== JSON.stringify(newParticipants);
          if (hasChanged) {
          }
          return hasChanged ? newParticipants : prevParticipants;
        });
      }
    } catch (err) {
      handleError(err);
    }
  }, [handleError, participants.length]);

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
    isAuthChecking,
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
  
  // Participant actions
  getRoomParticipants,
  
  // Utility actions
  retry,
  clearError
  };
};
