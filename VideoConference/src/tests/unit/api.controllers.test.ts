import { NextRequest } from 'next/server';
import { GET as getRooms, POST as createRoom } from '../../app/api/rooms/route';
import { GET as getRoom, PUT as updateRoom, DELETE as deleteRoom } from '../../app/api/rooms/[id]/route';
import { POST as joinRoom } from '../../app/api/rooms/[id]/join/route';
import { POST as leaveRoom } from '../../app/api/rooms/[id]/leave/route';
import { GET as getMessages, POST as sendMessage } from '../../app/api/rooms/[id]/messages/route';
import { GET as getParticipants, PUT as updateParticipant } from '../../app/api/rooms/[id]/participants/route';
import { GET as healthCheck } from '../../app/api/health/route';

// Mock the service factory and database service
jest.mock('../../lib/video-conferencing/services/service.factory');
jest.mock('../../lib/video-conferencing/services/database.service');

describe('API Controllers', () => {
  let mockServiceFactory: any;
  let mockDatabaseService: any;
  let mockRoomService: any;
  let mockChatService: any;
  let mockVideoConferencingService: any;
  let mockRepositoryFactory: any;
  let mockParticipantRepo: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock repository
    mockParticipantRepo = {
      updateConnectionState: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue({ id: 'participant-id', name: 'Test User' })
    };

    // Mock repository factory
    mockRepositoryFactory = {
      getParticipantRepository: jest.fn().mockReturnValue(mockParticipantRepo)
    };

    // Mock room service
    mockRoomService = {
      searchRooms: jest.fn().mockResolvedValue([]),
      getRecentRooms: jest.fn().mockResolvedValue([]),
      getRoom: jest.fn().mockResolvedValue({ id: 'room-id', name: 'Test Room' }),
      updateRoom: jest.fn().mockResolvedValue({ id: 'room-id', name: 'Updated Room' }),
      deleteRoom: jest.fn().mockResolvedValue(true),
      getRoomParticipants: jest.fn().mockResolvedValue([]),
      getRoomStatistics: jest.fn().mockResolvedValue({ participantCount: 0 })
    };

    // Mock chat service
    mockChatService = {
      getMessages: jest.fn().mockResolvedValue([]),
      sendMessage: jest.fn().mockResolvedValue({ id: 'message-id', content: 'Hello' })
    };

    // Mock video conferencing service
    mockVideoConferencingService = {
      createRoom: jest.fn().mockResolvedValue({
        room: { id: 'room-id', name: 'Test Room' },
        participant: { id: 'participant-id', name: 'Host' }
      }),
      joinRoom: jest.fn().mockResolvedValue({
        room: { id: 'room-id', name: 'Test Room' },
        participant: { id: 'participant-id', name: 'Test User' }
      })
    };

    // Mock service factory
    mockServiceFactory = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getRoomService: jest.fn().mockReturnValue(mockRoomService),
      getChatService: jest.fn().mockReturnValue(mockChatService),
      getVideoConferencingService: jest.fn().mockReturnValue(mockVideoConferencingService),
      getRepositoryFactory: jest.fn().mockReturnValue(mockRepositoryFactory),
      getHealthStatus: jest.fn().mockResolvedValue({
        database: true,
        repositories: true,
        webrtc: true,
        websocket: true,
        overall: true
      })
    };

    // Mock database service
    mockDatabaseService = {
      isConnected: jest.fn().mockReturnValue(true)
    };

    // Set up module mocks
    jest.doMock('../../lib/video-conferencing/services/service.factory', () => ({
      ServiceFactory: jest.fn().mockImplementation(() => mockServiceFactory)
    }));

    jest.doMock('../../lib/video-conferencing/services/database.service', () => ({
      DatabaseService: jest.fn().mockImplementation(() => mockDatabaseService)
    }));
  });

  describe('GET /api/rooms', () => {
    it('should return rooms successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms');
      const response = await getRooms(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(mockServiceFactory.initialize).toHaveBeenCalled();
      expect(mockRoomService.getRecentRooms).toHaveBeenCalled();
    });

    it('should search rooms when query parameter is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms?q=test');
      const response = await getRooms(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRoomService.searchRooms).toHaveBeenCalledWith('test', 20);
    });

    it('should handle errors gracefully', async () => {
      mockServiceFactory.initialize.mockRejectedValueOnce(new Error('Database error'));
      
      const request = new NextRequest('http://localhost:3000/api/rooms');
      const response = await getRooms(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch rooms');
    });
  });

  describe('POST /api/rooms', () => {
    it('should create room successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Room',
          participantName: 'Host User'
        })
      });

      const response = await createRoom(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.room).toBeDefined();
      expect(data.data.participant).toBeDefined();
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Room'
          // Missing participantName
        })
      });

      const response = await createRoom(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('GET /api/rooms/[id]', () => {
    it('should return room by ID successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id');
      const response = await getRoom(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.room).toBeDefined();
      expect(data.data.participants).toBeDefined();
      expect(data.data.statistics).toBeDefined();
    });

    it('should return 404 when room not found', async () => {
      mockRoomService.getRoom.mockResolvedValueOnce(null);
      
      const request = new NextRequest('http://localhost:3000/api/rooms/non-existent');
      const response = await getRoom(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Room not found');
    });
  });

  describe('PUT /api/rooms/[id]', () => {
    it('should update room successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Room',
          maxParticipants: 20
        })
      });

      const response = await updateRoom(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id', {
        method: 'PUT',
        body: JSON.stringify({
          maxParticipants: 20
          // Missing name
        })
      });

      const response = await updateRoom(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('DELETE /api/rooms/[id]', () => {
    it('should delete room successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id', {
        method: 'DELETE'
      });

      const response = await deleteRoom(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Room deleted successfully');
    });

    it('should return 404 when room not found', async () => {
      mockRoomService.deleteRoom.mockResolvedValueOnce(false);
      
      const request = new NextRequest('http://localhost:3000/api/rooms/non-existent', {
        method: 'DELETE'
      });

      const response = await deleteRoom(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Room not found');
    });
  });

  describe('POST /api/rooms/[id]/join', () => {
    it('should join room successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/join', {
        method: 'POST',
        body: JSON.stringify({
          participantName: 'Test User'
        })
      });

      const response = await joinRoom(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.room).toBeDefined();
      expect(data.data.participant).toBeDefined();
    });

    it('should handle room not found error', async () => {
      mockVideoConferencingService.joinRoom.mockRejectedValueOnce(
        new Error('Room not found')
      );
      
      const request = new NextRequest('http://localhost:3000/api/rooms/non-existent/join', {
        method: 'POST',
        body: JSON.stringify({
          participantName: 'Test User'
        })
      });

      const response = await joinRoom(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Room not found');
    });

    it('should handle room full error', async () => {
      mockVideoConferencingService.joinRoom.mockRejectedValueOnce(
        new Error('Room is full')
      );
      
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/join', {
        method: 'POST',
        body: JSON.stringify({
          participantName: 'Test User'
        })
      });

      const response = await joinRoom(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Room full');
    });
  });

  describe('POST /api/rooms/[id]/leave', () => {
    it('should leave room successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/leave', {
        method: 'POST',
        body: JSON.stringify({
          participantId: 'participant-id'
        })
      });

      const response = await leaveRoom(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Successfully left the room');
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/leave', {
        method: 'POST',
        body: JSON.stringify({})
        // Missing participantId
      });

      const response = await leaveRoom(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('GET /api/rooms/[id]/messages', () => {
    it('should get messages successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/messages');
      const response = await getMessages(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(mockChatService.getMessages).toHaveBeenCalledWith('room-id', 50, 0);
    });
  });

  describe('POST /api/rooms/[id]/messages', () => {
    it('should send message successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/messages', {
        method: 'POST',
        body: JSON.stringify({
          participantId: 'participant-id',
          content: 'Hello, world!'
        })
      });

      const response = await sendMessage(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/messages', {
        method: 'POST',
        body: JSON.stringify({
          participantId: 'participant-id'
          // Missing content
        })
      });

      const response = await sendMessage(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('GET /api/rooms/[id]/participants', () => {
    it('should get participants successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/participants');
      const response = await getParticipants(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(mockRoomService.getRoomParticipants).toHaveBeenCalledWith('room-id');
    });
  });

  describe('PUT /api/rooms/[id]/participants', () => {
    it('should update participant successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/room-id/participants', {
        method: 'PUT',
        body: JSON.stringify({
          participantId: 'participant-id',
          mediaPermissions: { camera: false, microphone: true }
        })
      });

      const response = await updateParticipant(request, { params: { id: 'room-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthCheck(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('healthy');
      expect(data.services).toBeDefined();
    });

    it('should return unhealthy status when services are down', async () => {
      mockServiceFactory.getHealthStatus.mockResolvedValueOnce({
        database: false,
        repositories: true,
        webrtc: true,
        websocket: true,
        overall: false
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthCheck(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.status).toBe('unhealthy');
    });
  });
});
