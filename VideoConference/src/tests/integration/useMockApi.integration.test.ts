/**
 * useMockApi Hook Integration Tests
 * Tests the hook integration with both mock and real API services
 */

import { renderHook, act } from '@testing-library/react';
import { useMockApi } from '../../hooks/useMockApi';

// Mock the API service factory
jest.mock('../../lib/video-conferencing/services/api-service.factory', () => ({
  apiServiceFactory: {
    createService: jest.fn()
  }
}));

import { apiServiceFactory } from '../../lib/video-conferencing/services/api-service.factory';

describe('useMockApi Hook Integration Tests', () => {
  let mockApiService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock API service
    mockApiService = {
      createRoom: jest.fn(),
      getRoom: jest.fn(),
      updateRoom: jest.fn(),
      deleteRoom: jest.fn(),
      joinRoom: jest.fn(),
      getRoomParticipants: jest.fn(),
      leaveRoom: jest.fn(),
      sendMessage: jest.fn(),
      getRoomMessages: jest.fn(),
      connectWebSocket: jest.fn(),
      sendWebSocketMessage: jest.fn(),
      onWebSocketEvent: jest.fn(),
      offWebSocketEvent: jest.fn(),
      startRealTimeSimulation: jest.fn(),
      stopRealTimeSimulation: jest.fn(),
      cleanup: jest.fn()
    };

    (apiServiceFactory.createService as jest.Mock).mockReturnValue(mockApiService);
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useMockApi());

      expect(result.current.rooms).toEqual([]);
      expect(result.current.currentRoom).toBeNull();
      expect(result.current.participants).toEqual([]);
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
    });

    it('should create API service on initialization', () => {
      renderHook(() => useMockApi());

      expect(apiServiceFactory.createService).toHaveBeenCalledTimes(1);
    });
  });

  describe('Room Management', () => {
    it('should create room successfully', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        maxParticipants: 10,
        settings: { allowScreenShare: true, allowChat: true, allowCamera: true, allowMicrophone: true, recordingEnabled: false },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockParticipant = {
        id: 'participant-1',
        roomId: 'room-1',
        name: 'Host',
        isHost: true,
        mediaPermissions: { camera: true, microphone: true, screenShare: true },
        joinedAt: new Date(),
        lastSeen: new Date(),
        clientInfo: {}
      };

      mockApiService.createRoom.mockResolvedValue({
        room: mockRoom,
        participant: mockParticipant
      });

      const { result } = renderHook(() => useMockApi());

      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      await act(async () => {
        await result.current.createRoom(roomData);
      });

      expect(mockApiService.createRoom).toHaveBeenCalledWith(roomData);
      expect(result.current.currentRoom).toEqual(mockRoom);
      expect(result.current.participants).toEqual([mockParticipant]);
      expect(result.current.rooms).toContain(mockRoom);
    });

    it('should handle room creation error', async () => {
      const errorMessage = 'Failed to create room';
      mockApiService.createRoom.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useMockApi());

      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      await act(async () => {
        await result.current.createRoom(roomData);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it('should join room successfully', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        maxParticipants: 10,
        settings: { allowScreenShare: true, allowChat: true, allowCamera: true, allowMicrophone: true, recordingEnabled: false },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockParticipant = {
        id: 'participant-1',
        roomId: 'room-1',
        name: 'Test Participant',
        isHost: false,
        mediaPermissions: { camera: true, microphone: true, screenShare: false },
        joinedAt: new Date(),
        lastSeen: new Date(),
        clientInfo: {}
      };

      mockApiService.joinRoom.mockResolvedValue({
        room: mockRoom,
        participant: mockParticipant
      });

      mockApiService.getRoomParticipants.mockResolvedValue([mockParticipant]);
      mockApiService.getRoomMessages.mockResolvedValue([]);

      const { result } = renderHook(() => useMockApi());

      await act(async () => {
        await result.current.joinRoom('room-1', 'Test Participant');
      });

      expect(mockApiService.joinRoom).toHaveBeenCalledWith('room-1', {
        participantName: 'Test Participant',
        isHost: false,
        mediaPermissions: {
          camera: true,
          microphone: true,
          screenShare: false
        }
      });
      expect(result.current.currentRoom).toEqual(mockRoom);
      expect(result.current.participants).toEqual([mockParticipant]);
    });

    it('should leave room successfully', async () => {
      const { result } = renderHook(() => useMockApi());

      // Set up initial state
      act(() => {
        result.current.currentRoom = {
          id: 'room-1',
          name: 'Test Room',
          maxParticipants: 10,
          settings: { allowScreenShare: true, allowChat: true, allowCamera: true, allowMicrophone: true, recordingEnabled: false },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      await act(async () => {
        await result.current.leaveRoom();
      });

      expect(result.current.currentRoom).toBeNull();
      expect(result.current.participants).toEqual([]);
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('Message Management', () => {
    it('should send message successfully', async () => {
      const mockMessage = {
        id: 'message-1',
        roomId: 'room-1',
        participantId: 'participant-1',
        participantName: 'Test Participant',
        message: 'Hello, world!',
        messageType: 'text' as const,
        createdAt: new Date(),
        isEdited: false
      };

      mockApiService.sendMessage.mockResolvedValue({
        message: mockMessage
      });

      const { result } = renderHook(() => useMockApi());

      // Set up initial state
      act(() => {
        result.current.currentRoom = {
          id: 'room-1',
          name: 'Test Room',
          maxParticipants: 10,
          settings: { allowScreenShare: true, allowChat: true, allowCamera: true, allowMicrophone: true, recordingEnabled: false },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        result.current.participants = [{
          id: 'participant-1',
          roomId: 'room-1',
          name: 'Test Participant',
          isHost: false,
          mediaPermissions: { camera: true, microphone: true, screenShare: false },
          joinedAt: new Date(),
          lastSeen: new Date(),
          clientInfo: {}
        }];
      });

      await act(async () => {
        await result.current.sendMessage('Hello, world!');
      });

      expect(mockApiService.sendMessage).toHaveBeenCalledWith('room-1', {
        content: 'Hello, world!',
        participantId: 'participant-1',
        participantName: 'Test Participant',
        messageType: 'text'
      });
      expect(result.current.messages).toContain(mockMessage);
    });

    it('should handle send message error when no room selected', async () => {
      const { result } = renderHook(() => useMockApi());

      await act(async () => {
        await result.current.sendMessage('Hello, world!');
      });

      expect(result.current.error).toBe('No room selected');
    });

    it('should handle send message error when no participant found', async () => {
      const { result } = renderHook(() => useMockApi());

      // Set up room but no participants
      act(() => {
        result.current.currentRoom = {
          id: 'room-1',
          name: 'Test Room',
          maxParticipants: 10,
          settings: { allowScreenShare: true, allowChat: true, allowCamera: true, allowMicrophone: true, recordingEnabled: false },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      await act(async () => {
        await result.current.sendMessage('Hello, world!');
      });

      expect(result.current.error).toBe('No participant found');
    });
  });

  describe('WebSocket Management', () => {
    it('should connect WebSocket successfully', async () => {
      mockApiService.connectWebSocket.mockResolvedValue({
        connected: true
      });

      const { result } = renderHook(() => useMockApi());

      await act(async () => {
        await result.current.connectWebSocket('room-1', 'participant-1');
      });

      expect(mockApiService.connectWebSocket).toHaveBeenCalledWith('room-1', 'participant-1');
    });

    it('should handle WebSocket connection error', async () => {
      mockApiService.connectWebSocket.mockResolvedValue({
        connected: false,
        error: 'Connection failed'
      });

      const { result } = renderHook(() => useMockApi());

      await act(async () => {
        await result.current.connectWebSocket('room-1', 'participant-1');
      });

      expect(result.current.error).toBe('Connection failed');
    });

    it('should disconnect WebSocket', () => {
      const { result } = renderHook(() => useMockApi());

      act(() => {
        result.current.disconnectWebSocket();
      });

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Error Handling and Retry', () => {
    it('should handle errors and provide retry functionality', async () => {
      const errorMessage = 'Network error';
      mockApiService.createRoom.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useMockApi());

      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      // First attempt fails
      await act(async () => {
        await result.current.createRoom(roomData);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.retryCount).toBe(0);

      // Retry
      await act(async () => {
        await result.current.retry(() => result.current.createRoom(roomData));
      });

      expect(result.current.retryCount).toBe(1);
    });

    it('should clear error after timeout', async () => {
      jest.useFakeTimers();

      const errorMessage = 'Network error';
      mockApiService.createRoom.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useMockApi());

      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      await act(async () => {
        await result.current.createRoom(roomData);
      });

      expect(result.current.error).toBe(errorMessage);

      // Fast-forward time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.error).toBeNull();

      jest.useRealTimers();
    });

    it('should clear error manually', async () => {
      const errorMessage = 'Network error';
      mockApiService.createRoom.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useMockApi());

      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      await act(async () => {
        await result.current.createRoom(roomData);
      });

      expect(result.current.error).toBe(errorMessage);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
    });
  });

  describe('Real-time Simulation', () => {
    it('should start real-time simulation when joining room', () => {
      const { result } = renderHook(() => useMockApi());

      act(() => {
        result.current.currentRoom = {
          id: 'room-1',
          name: 'Test Room',
          maxParticipants: 10,
          settings: { allowScreenShare: true, allowChat: true, allowCamera: true, allowMicrophone: true, recordingEnabled: false },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      // The useEffect should trigger startRealTimeSimulation
      expect(mockApiService.startRealTimeSimulation).toHaveBeenCalledWith('room-1');
    });

    it('should stop real-time simulation when leaving room', () => {
      const { result } = renderHook(() => useMockApi());

      // First set a room
      act(() => {
        result.current.currentRoom = {
          id: 'room-1',
          name: 'Test Room',
          maxParticipants: 10,
          settings: { allowScreenShare: true, allowChat: true, allowCamera: true, allowMicrophone: true, recordingEnabled: false },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      // Then clear the room
      act(() => {
        result.current.currentRoom = null;
      });

      expect(mockApiService.stopRealTimeSimulation).toHaveBeenCalled();
    });
  });
});
