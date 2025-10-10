/**
 * useMockApi Hook Tests
 * Tests for the useMockApi hook with mock API integration
 */

import { renderHook, act } from '@testing-library/react';
import { useMockApi } from '@/hooks/useMockApi';
import { MockApiService } from '@/lib/video-conferencing/services/mock-api.service';

// Mock the MockApiService
jest.mock('@/lib/video-conferencing/services/mock-api.service');
const MockMockApiService = MockApiService as jest.MockedClass<typeof MockApiService>;

describe('useMockApi Hook', () => {
  let mockApiService: jest.Mocked<MockApiService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockApiService = {
      createRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      connectWebSocket: jest.fn(),
      disconnectWebSocket: jest.fn(),
      updateMediaPermissions: jest.fn(),
      startRealTimeSimulation: jest.fn(),
      stopRealTimeSimulation: jest.fn(),
      onWebSocketEvent: jest.fn(),
      offWebSocketEvent: jest.fn(),
      getRoomParticipants: jest.fn(),
      getRoomMessages: jest.fn()
    } as any;

    MockMockApiService.mockImplementation(() => mockApiService);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useMockApi());

    expect(result.current.rooms).toEqual([]);
    expect(result.current.currentRoom).toBeNull();
    expect(result.current.participants).toEqual([]);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('creates room successfully', async () => {
    const mockRoom = {
      id: 'room-1',
      name: 'Test Room',
      maxParticipants: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      settings: {}
    };

    const mockParticipant = {
      id: 'participant-1',
      name: 'Host',
      roomId: 'room-1',
      mediaPermissions: { camera: true, microphone: true, screenShare: true },
      connectionState: 'connected' as const,
      joinedAt: new Date(),
      lastSeen: new Date(),
      clientInfo: {}
    };

    mockApiService.createRoom.mockResolvedValue({
      room: mockRoom,
      participant: mockParticipant
    });

    const { result } = renderHook(() => useMockApi());

    await act(async () => {
      await result.current.createRoom({
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      });
    });

    expect(mockApiService.createRoom).toHaveBeenCalledWith({
      name: 'Test Room',
      maxParticipants: 10,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        allowCamera: true,
        allowMicrophone: true,
        recordingEnabled: false
      }
    });

    expect(result.current.currentRoom).toEqual(mockRoom);
    expect(result.current.participants).toEqual([mockParticipant]);
    expect(result.current.rooms).toEqual([mockRoom]);
  });

  it('handles create room error', async () => {
    const error = new Error('Failed to create room');
    mockApiService.createRoom.mockRejectedValue(error);

    const { result } = renderHook(() => useMockApi());

    await act(async () => {
      await result.current.createRoom({
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      });
    });

    expect(result.current.error).toBe('Failed to create room');
  });

  it('joins room successfully', async () => {
    const mockRoom = {
      id: 'room-1',
      name: 'Test Room',
      maxParticipants: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      settings: {}
    };

    const mockParticipant = {
      id: 'participant-1',
      name: 'Test User',
      roomId: 'room-1',
      mediaPermissions: { camera: true, microphone: true, screenShare: false },
      connectionState: 'connected' as const,
      joinedAt: new Date(),
      lastSeen: new Date(),
      clientInfo: {}
    };

    const mockParticipants = [mockParticipant];
    const mockMessages = [];

    mockApiService.joinRoom.mockResolvedValue({
      room: mockRoom,
      participant: mockParticipant
    });
    mockApiService.getRoomParticipants.mockResolvedValue(mockParticipants);
    mockApiService.getRoomMessages.mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useMockApi());

    await act(async () => {
      await result.current.joinRoom('room-1', 'Test User');
    });

    expect(mockApiService.joinRoom).toHaveBeenCalledWith('room-1', {
      participantName: 'Test User',
      isHost: false,
      mediaPermissions: {
        camera: true,
        microphone: true,
        screenShare: false
      }
    });

    expect(result.current.currentRoom).toEqual(mockRoom);
    expect(result.current.participants).toEqual(mockParticipants);
    expect(result.current.messages).toEqual(mockMessages);
  });

  it('sends message successfully', async () => {
    const mockRoom = {
      id: 'room-1',
      name: 'Test Room',
      maxParticipants: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      settings: {}
    };

    const mockParticipant = {
      id: 'participant-1',
      name: 'Test User',
      roomId: 'room-1',
      mediaPermissions: { camera: true, microphone: true, screenShare: false },
      connectionState: 'connected' as const,
      joinedAt: new Date(),
      lastSeen: new Date(),
      clientInfo: {}
    };

    const mockMessage = {
      id: 'message-1',
      roomId: 'room-1',
      participantId: 'participant-1',
      participantName: 'Test User',
      message: 'Hello world',
      messageType: 'text' as const,
      createdAt: new Date(),
      isEdited: false
    };

    mockApiService.sendMessage.mockResolvedValue({
      message: mockMessage
    });

    const { result } = renderHook(() => useMockApi());

    // Set up current room and participants
    act(() => {
      result.current.currentRoom = mockRoom;
      result.current.participants = [mockParticipant];
    });

    await act(async () => {
      await result.current.sendMessage('Hello world');
    });

    expect(mockApiService.sendMessage).toHaveBeenCalledWith('room-1', {
      content: 'Hello world',
      participantId: 'participant-1',
      participantName: 'Test User',
      messageType: 'text'
    });

    expect(result.current.messages).toEqual([mockMessage]);
  });

  it('connects WebSocket successfully', async () => {
    mockApiService.connectWebSocket.mockResolvedValue({
      connected: true
    });

    const { result } = renderHook(() => useMockApi());

    await act(async () => {
      await result.current.connectWebSocket('room-1', 'participant-1');
    });

    expect(mockApiService.connectWebSocket).toHaveBeenCalledWith('room-1', 'participant-1');
  });

  it('handles WebSocket connection error', async () => {
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

  it('updates media permissions', async () => {
    const { result } = renderHook(() => useMockApi());

    await act(async () => {
      await result.current.updateMediaPermissions({
        camera: false,
        microphone: true,
        screenShare: true
      });
    });

    // In a real implementation, this would update the participant's media permissions
    expect(result.current.error).toBeNull();
  });

  it('clears error', () => {
    const { result } = renderHook(() => useMockApi());

    act(() => {
      result.current.error = 'Test error';
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('retries operation on error', async () => {
    const error = new Error('Network error');
    mockApiService.createRoom
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        room: { id: 'room-1', name: 'Test Room' } as any,
        participant: { id: 'participant-1', name: 'Host' } as any
      });

    const { result } = renderHook(() => useMockApi());

    await act(async () => {
      await result.current.retry(async () => {
        await result.current.createRoom({
          name: 'Test Room',
          maxParticipants: 10,
          settings: {
            allowScreenShare: true,
            allowChat: true,
            allowCamera: true,
            allowMicrophone: true,
            recordingEnabled: false
          }
        });
      });
    });

    expect(result.current.retryCount).toBe(1);
  });

  it('stops retrying after maximum attempts', async () => {
    const error = new Error('Network error');
    mockApiService.createRoom.mockRejectedValue(error);

    const { result } = renderHook(() => useMockApi());

    // Set retry count to maximum
    act(() => {
      result.current.retryCount = 3;
    });

    await act(async () => {
      await result.current.retry(async () => {
        await result.current.createRoom({
          name: 'Test Room',
          maxParticipants: 10,
          settings: {
            allowScreenShare: true,
            allowChat: true,
            allowCamera: true,
            allowMicrophone: true,
            recordingEnabled: false
          }
        });
      });
    });

    expect(result.current.error).toBe('Maximum retry attempts reached. Please try again later.');
  });

  it('auto-clears error after timeout', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useMockApi());

    act(() => {
      result.current.error = 'Test error';
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.error).toBeNull();

    jest.useRealTimers();
  });
});
