import { MockApiService } from '../../lib/video-conferencing/services/mock-api.service';
import { RoomModel } from '../../lib/video-conferencing/models/room.model';
import { ParticipantModel } from '../../lib/video-conferencing/models/participant.model';
import { MessageModel } from '../../lib/video-conferencing/models/message.model';

describe('MockApiService', () => {
  let mockApiService: MockApiService;

  beforeEach(() => {
    mockApiService = new MockApiService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Management', () => {
    it('should create a room successfully', async () => {
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

      const result = await mockApiService.createRoom(roomData);

      expect(result).toBeDefined();
      expect(result.room).toBeDefined();
      expect(result.room.name).toBe(roomData.name);
      expect(result.room.maxParticipants).toBe(roomData.maxParticipants);
      expect(result.participant).toBeDefined();
      expect(result.participant.isHost).toBe(true);
    });

    it('should get room by id', async () => {
      // First create a room
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      };
      const createdRoom = await mockApiService.createRoom(roomData);

      const room = await mockApiService.getRoom(createdRoom.room.id);

      expect(room).toBeDefined();
      expect(room!.id).toBe(createdRoom.room.id);
      expect(room!.name).toBe(roomData.name);
    });

    it('should return null for non-existent room', async () => {
      const room = await mockApiService.getRoom('non-existent-id');
      expect(room).toBeNull();
    });

    it('should update room settings', async () => {
      // First create a room
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      };
      const createdRoom = await mockApiService.createRoom(roomData);

      const updateData = {
        name: 'Updated Room',
        maxParticipants: 15,
        settings: {
          allowScreenShare: false,
          allowChat: true
        }
      };

      const updatedRoom = await mockApiService.updateRoom(createdRoom.room.id, updateData);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom.name).toBe(updateData.name);
      expect(updatedRoom.maxParticipants).toBe(updateData.maxParticipants);
    });

    it('should delete a room', async () => {
      // First create a room
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      };
      const createdRoom = await mockApiService.createRoom(roomData);

      await mockApiService.deleteRoom(createdRoom.room.id);

      const room = await mockApiService.getRoom(createdRoom.room.id);
      expect(room).toBeNull();
    });
  });

  describe('Participant Management', () => {
    it('should join a room successfully', async () => {
      // First create a room
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      };
      const createdRoom = await mockApiService.createRoom(roomData);

      const joinOptions = {
        participantName: 'Test Participant',
        isHost: false,
        mediaPermissions: {
          camera: true,
          microphone: true,
          screenShare: false
        }
      };

      const result = await mockApiService.joinRoom(createdRoom.room.id, joinOptions);

      expect(result).toBeDefined();
      expect(result.room).toBeDefined();
      expect(result.participant).toBeDefined();
      expect(result.participant.name).toBe(joinOptions.participantName);
    });

    it('should get room participants', async () => {
      // First create a room and add participants
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      };
      const createdRoom = await mockApiService.createRoom(roomData);

      const joinOptions = {
        participantName: 'Test Participant',
        isHost: false,
        mediaPermissions: {
          camera: true,
          microphone: true,
          screenShare: false
        }
      };
      await mockApiService.joinRoom(createdRoom.room.id, joinOptions);

      const participants = await mockApiService.getRoomParticipants(createdRoom.room.id);

      expect(participants).toBeDefined();
      expect(Array.isArray(participants)).toBe(true);
      expect(participants.length).toBe(2); // Host + new participant
    });

    it('should leave a room', async () => {
      // First create a room and add participant
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      };
      const createdRoom = await mockApiService.createRoom(roomData);

      const joinOptions = {
        participantName: 'Test Participant',
        isHost: false,
        mediaPermissions: {
          camera: true,
          microphone: true,
          screenShare: false
        }
      };
      const joinedRoom = await mockApiService.joinRoom(createdRoom.room.id, joinOptions);

      await mockApiService.leaveRoom(joinedRoom.participant.id);

      const participants = await mockApiService.getRoomParticipants(createdRoom.room.id);
      expect(participants.length).toBe(1); // Only host remains
    });
  });

  describe('Message Management', () => {
    it('should send a message', async () => {
      // First create a room and add participant
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      };
      const createdRoom = await mockApiService.createRoom(roomData);

      const joinOptions = {
        participantName: 'Test Participant',
        isHost: false,
        mediaPermissions: {
          camera: true,
          microphone: true,
          screenShare: false
        }
      };
      const joinedRoom = await mockApiService.joinRoom(createdRoom.room.id, joinOptions);

      const messageData = {
        content: 'Hello, world!',
        participantId: joinedRoom.participant.id,
        participantName: joinedRoom.participant.name,
        messageType: 'text' as const
      };

      const result = await mockApiService.sendMessage(createdRoom.room.id, messageData);

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.message.message).toBe(messageData.content);
    });

    it('should get room messages', async () => {
      // First create a room and add participant
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      };
      const createdRoom = await mockApiService.createRoom(roomData);

      const joinOptions = {
        participantName: 'Test Participant',
        isHost: false,
        mediaPermissions: {
          camera: true,
          microphone: true,
          screenShare: false
        }
      };
      const joinedRoom = await mockApiService.joinRoom(createdRoom.room.id, joinOptions);

      // Send a message
      const messageData = {
        content: 'Hello, world!',
        participantId: joinedRoom.participant.id,
        participantName: joinedRoom.participant.name,
        messageType: 'text' as const
      };
      await mockApiService.sendMessage(createdRoom.room.id, messageData);

      const messages = await mockApiService.getRoomMessages(createdRoom.room.id);

      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(1);
      expect(messages[0].message).toBe(messageData.content);
    });
  });

  describe('Real-time Communication', () => {
    it('should connect to WebSocket', async () => {
      const roomId = 'test-room-id';
      const participantId = 'test-participant-id';

      const result = await mockApiService.connectWebSocket(roomId, participantId);

      expect(result).toBeDefined();
      expect(result.connected).toBe(true);
    });

    it('should send WebSocket message', async () => {
      const roomId = 'test-room-id';
      const participantId = 'test-participant-id';
      await mockApiService.connectWebSocket(roomId, participantId);

      const message = {
        type: 'offer',
        data: { sdp: 'test-sdp' }
      };

      const result = await mockApiService.sendWebSocketMessage(roomId, message);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle WebSocket events', (done) => {
      const roomId = 'test-room-id';
      const participantId = 'test-participant-id';

      mockApiService.onWebSocketEvent('websocketConnected', (data) => {
        expect(data).toBeDefined();
        expect(data.roomId).toBe(roomId);
        expect(data.participantId).toBe(participantId);
        done();
      });

      mockApiService.connectWebSocket(roomId, participantId);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle room not found errors', async () => {
      await expect(mockApiService.getRoom('non-existent-id')).resolves.toBeNull();
    });

    it('should handle invalid room data', async () => {
      const invalidRoomData = {
        name: '',
        maxParticipants: -1,
        settings: {}
      };

      await expect(mockApiService.createRoom(invalidRoomData)).rejects.toThrow();
    });

    it('should handle WebSocket connection errors', async () => {
      const result = await mockApiService.connectWebSocket('invalid-room', 'invalid-participant');
      expect(result.connected).toBe(false);
    });
  });
});
