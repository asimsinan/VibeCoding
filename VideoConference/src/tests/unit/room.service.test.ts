import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { RoomModel, ParticipantModel } from '../../lib/video-conferencing/models';
import { DatabaseService } from '../../lib/video-conferencing/services/database.service';

// Mock DatabaseService
jest.mock('../../lib/video-conferencing/services/database.service');

describe('RoomService', () => {
  let roomService: RoomService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    roomService = new RoomService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a new room successfully', async () => {
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

      const mockRoom = RoomModel.create(roomData);
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockRoom],
        rowCount: 1
      });

      const result = await roomService.createRoom(roomData);

      expect(result).toBeDefined();
      expect(result.name).toBe(roomData.name);
      expect(result.maxParticipants).toBe(roomData.maxParticipants);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rooms'),
        expect.arrayContaining([roomData.name, roomData.maxParticipants])
      );
    });

    it('should throw error if database query fails', async () => {
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

      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(roomService.createRoom(roomData))
        .rejects.toThrow('Failed to create room: Database error');
    });

    it('should validate room data before creating', async () => {
      const invalidRoomData = {
        name: '', // Invalid: empty name
        maxParticipants: -1, // Invalid: negative max participants
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      await expect(roomService.createRoom(invalidRoomData))
        .rejects.toThrow('Room name is required and must be a non-empty string');
    });
  });

  describe('getRoom', () => {
    it('should get room by ID successfully', async () => {
      const roomId = 'test-room-id';
      const mockRoom = RoomModel.create({
        id: roomId,
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

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockRoom],
        rowCount: 1
      });

      const result = await roomService.getRoom(roomId);

      expect(result).toBeDefined();
      expect(result.id).toBe(roomId);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM rooms WHERE id = $1'),
        [roomId]
      );
    });

    it('should return null if room not found', async () => {
      const roomId = 'non-existent-room';
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const result = await roomService.getRoom(roomId);

      expect(result).toBeNull();
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(roomService.getRoom(roomId))
        .rejects.toThrow('Failed to get room: Database error');
    });
  });

  describe('updateRoom', () => {
    it('should update room successfully', async () => {
      const roomId = 'test-room-id';
      const updateData = {
        name: 'Updated Room Name',
        maxParticipants: 20
      };

      const mockUpdatedRoom = RoomModel.create({
        id: roomId,
        ...updateData,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      });

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockUpdatedRoom],
        rowCount: 1
      });

      const result = await roomService.updateRoom(roomId, updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.maxParticipants).toBe(updateData.maxParticipants);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rooms SET'),
        expect.arrayContaining([updateData.name, updateData.maxParticipants, roomId])
      );
    });

    it('should throw error if room not found', async () => {
      const roomId = 'non-existent-room';
      const updateData = { name: 'Updated Name' };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      await expect(roomService.updateRoom(roomId, updateData))
        .rejects.toThrow('Room not found');
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      const updateData = { name: 'Updated Name' };

      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(roomService.updateRoom(roomId, updateData))
        .rejects.toThrow('Failed to update room: Database error');
    });
  });

  describe('deleteRoom', () => {
    it('should delete room successfully', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1
      });

      await expect(roomService.deleteRoom(roomId)).resolves.toBeUndefined();

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM rooms WHERE id = $1'),
        [roomId]
      );
    });

    it('should throw error if room not found', async () => {
      const roomId = 'non-existent-room';
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      await expect(roomService.deleteRoom(roomId))
        .rejects.toThrow('Room not found');
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(roomService.deleteRoom(roomId))
        .rejects.toThrow('Failed to delete room: Database error');
    });
  });

  describe('getRoomParticipants', () => {
    it('should get room participants successfully', async () => {
      const roomId = 'test-room-id';
      const mockParticipants = [
        ParticipantModel.create({
          roomId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'User 1',
          isHost: true,
          mediaPermissions: {
            camera: true,
            microphone: true,
            screenShare: true
          }
        }),
        ParticipantModel.create({
          roomId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'User 2',
          isHost: false,
          mediaPermissions: {
            camera: false,
            microphone: true,
            screenShare: false
          }
        })
      ];

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: mockParticipants,
        rowCount: 2
      });

      const result = await roomService.getRoomParticipants(roomId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('User 1');
      expect(result[1].name).toBe('User 2');
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM participants WHERE room_id = $1'),
        [roomId]
      );
    });

    it('should return empty array if no participants', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const result = await roomService.getRoomParticipants(roomId);

      expect(result).toHaveLength(0);
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(roomService.getRoomParticipants(roomId))
        .rejects.toThrow('Failed to get room participants: Database error');
    });
  });

  describe('getRoomMessages', () => {
    it('should get room messages successfully', async () => {
      const roomId = 'test-room-id';
      const limit = 50;
      const offset = 0;

      const mockMessages = [
        {
          id: 'message-1',
          roomId,
          participantId: 'participant-1',
          content: 'Hello world',
          timestamp: new Date().toISOString()
        },
        {
          id: 'message-2',
          roomId,
          participantId: 'participant-2',
          content: 'Hi there',
          timestamp: new Date().toISOString()
        }
      ];

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: mockMessages,
        rowCount: 2
      });

      const result = await roomService.getRoomMessages(roomId, limit, offset);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello world');
      expect(result[1].content).toBe('Hi there');
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM messages WHERE room_id = $1'),
        [roomId, limit, offset]
      );
    });

    it('should return empty array if no messages', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const result = await roomService.getRoomMessages(roomId);

      expect(result).toHaveLength(0);
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(roomService.getRoomMessages(roomId))
        .rejects.toThrow('Failed to get room messages: Database error');
    });
  });

  describe('isRoomFull', () => {
    it('should return true if room is at capacity', async () => {
      const roomId = 'test-room-id';
      const mockRoom = RoomModel.create({
        id: roomId,
        name: 'Test Room',
        maxParticipants: 2,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      });

      const mockParticipants = [
        ParticipantModel.create({
          roomId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'User 1',
          isHost: true,
          mediaPermissions: { camera: true, microphone: true, screenShare: true }
        }),
        ParticipantModel.create({
          roomId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'User 2',
          isHost: false,
          mediaPermissions: { camera: true, microphone: true, screenShare: true }
        })
      ];

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [mockRoom], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockParticipants, rowCount: 2 });

      const result = await roomService.isRoomFull(roomId);

      expect(result).toBe(true);
    });

    it('should return false if room has space', async () => {
      const roomId = 'test-room-id';
      const mockRoom = RoomModel.create({
        id: roomId,
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

      const mockParticipants = [
        ParticipantModel.create({
          roomId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'User 1',
          isHost: true,
          mediaPermissions: { camera: true, microphone: true, screenShare: true }
        })
      ];

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [mockRoom], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockParticipants, rowCount: 1 });

      const result = await roomService.isRoomFull(roomId);

      expect(result).toBe(false);
    });

    it('should throw error if room not found', async () => {
      const roomId = 'non-existent-room';
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      await expect(roomService.isRoomFull(roomId))
        .rejects.toThrow('Room not found');
    });
  });

  describe('validateRoomData', () => {
    it('should validate room data successfully', () => {
      const validRoomData = {
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

      expect(() => roomService.validateRoomData(validRoomData)).not.toThrow();
    });

    it('should throw error for invalid room data', () => {
      const invalidRoomData = {
        name: '', // Invalid: empty name
        maxParticipants: -1, // Invalid: negative max participants
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      expect(() => roomService.validateRoomData(invalidRoomData))
        .toThrow('Room name is required and must be a non-empty string');
    });
  });
});
