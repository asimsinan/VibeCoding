import { VideoConferencingService } from '../../lib/video-conferencing/services/video-conferencing.service';
import { WebRTCService } from '../../lib/video-conferencing/services/webrtc.service';
import { WebSocketService } from '../../lib/video-conferencing/services/websocket.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ChatService } from '../../lib/video-conferencing/services/chat.service';
import { RepositoryFactory } from '../../lib/video-conferencing/repositories/repository.factory';
import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { RoomModel, ParticipantModel } from '../../lib/video-conferencing/models';

// Mock all dependencies
jest.mock('../../lib/video-conferencing/services/webrtc.service');
jest.mock('../../lib/video-conferencing/services/websocket.service');
jest.mock('../../lib/video-conferencing/services/room.service');
jest.mock('../../lib/video-conferencing/services/chat.service');
jest.mock('../../lib/video-conferencing/repositories/repository.factory');
jest.mock('../../lib/video-conferencing/services/database.service');

describe('VideoConferencingService', () => {
  let videoConferencingService: VideoConferencingService;
  let mockWebRTCService: jest.Mocked<WebRTCService>;
  let mockWebSocketService: jest.Mocked<WebSocketService>;
  let mockRoomService: jest.Mocked<RoomService>;
  let mockChatService: jest.Mocked<ChatService>;
  let mockRepositoryFactory: jest.Mocked<RepositoryFactory>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  const mockConfig = {
    websocketUrl: 'ws://localhost:3000',
    maxParticipants: 10,
    enableScreenShare: true,
    enableChat: true,
    enableRecording: false
  };

  beforeEach(() => {
    // Create mock instances
    mockWebRTCService = new WebRTCService() as jest.Mocked<WebRTCService>;
    mockWebSocketService = new WebSocketService() as jest.Mocked<WebSocketService>;
    mockRoomService = new RoomService(mockDatabaseService) as jest.Mocked<RoomService>;
    mockChatService = new ChatService(mockDatabaseService) as jest.Mocked<ChatService>;
    mockRepositoryFactory = new RepositoryFactory(mockDatabaseService) as jest.Mocked<RepositoryFactory>;
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;

    // Mock repository factory methods
    mockRepositoryFactory.initialize = jest.fn().mockResolvedValue(undefined);
    mockRepositoryFactory.isConnected = jest.fn().mockResolvedValue(true);

    // Create service instance
    videoConferencingService = new VideoConferencingService(
      mockWebRTCService,
      mockWebSocketService,
      mockRoomService,
      mockChatService,
      mockRepositoryFactory,
      mockConfig
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the service successfully', async () => {
      await expect(videoConferencingService.initialize()).resolves.toBeUndefined();
      expect(mockRepositoryFactory.initialize).toHaveBeenCalled();
      expect(videoConferencingService.isServiceInitialized()).toBe(true);
    });

    it('should emit initialized event', (done) => {
      videoConferencingService.on('initialized', () => {
        done();
      });

      videoConferencingService.initialize();
    });

    it('should not initialize twice', async () => {
      await videoConferencingService.initialize();
      await videoConferencingService.initialize();
      
      expect(mockRepositoryFactory.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('createRoom', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
    });

    it('should create a room successfully', async () => {
      const roomData = {
        name: 'Test Room',
        maxParticipants: 5,
        settings: { allowScreenShare: true }
      };

      const mockRoom = RoomModel.create(roomData);
      const mockParticipant = ParticipantModel.create({
        roomId: mockRoom.id,
        name: 'Host',
        isHost: true,
        mediaPermissions: {
          camera: true,
          microphone: true,
          screenShare: true
        }
      });

      mockRoomService.createRoom.mockResolvedValueOnce(mockRoom);
      
      const mockParticipantRepo = {
        create: jest.fn().mockResolvedValue(mockParticipant)
      };
      mockRepositoryFactory.getParticipantRepository.mockReturnValue(mockParticipantRepo as any);

      const result = await videoConferencingService.createRoom(roomData);

      expect(result.room).toBeDefined();
      expect(result.participant).toBeDefined();
      expect(mockRoomService.createRoom).toHaveBeenCalledWith({
        ...roomData,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false,
          ...roomData.settings
        }
      });
      expect(mockParticipantRepo.create).toHaveBeenCalled();
    });

    it('should throw error if not initialized', async () => {
      const newService = new VideoConferencingService(
        mockWebRTCService,
        mockWebSocketService,
        mockRoomService,
        mockChatService,
        mockRepositoryFactory,
        mockConfig
      );

      await expect(newService.createRoom({ name: 'Test Room' }))
        .rejects.toThrow('Video conferencing service not initialized');
    });

    it('should emit roomCreated event', async () => {
      const roomData = { name: 'Test Room' };
      const mockRoom = RoomModel.create(roomData);
      const mockParticipant = ParticipantModel.create({
        roomId: mockRoom.id,
        name: 'Host',
        isHost: true,
        mediaPermissions: { camera: true, microphone: true, screenShare: true }
      });

      mockRoomService.createRoom.mockResolvedValueOnce(mockRoom);
      
      const mockParticipantRepo = {
        create: jest.fn().mockResolvedValue(mockParticipant)
      };
      mockRepositoryFactory.getParticipantRepository.mockReturnValue(mockParticipantRepo as any);

      videoConferencingService.on('roomCreated', (data) => {
        expect(data.room).toBeDefined();
        expect(data.participant).toBeDefined();
      });

      await videoConferencingService.createRoom(roomData);
    });
  });

  describe('joinRoom', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
    });

    it('should join a room successfully', async () => {
      const roomId = 'test-room-id';
      const options = {
        participantName: 'Test User',
        isHost: false,
        mediaPermissions: {
          camera: true,
          microphone: true,
          screenShare: false
        }
      };

      const mockRoom = RoomModel.create({
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      });

      const mockParticipant = ParticipantModel.create({
        roomId: mockRoom.id,
        name: options.participantName,
        isHost: options.isHost,
        mediaPermissions: options.mediaPermissions
      });

      mockRoomService.getRoom.mockResolvedValueOnce(mockRoom);
      mockRoomService.isRoomFull.mockResolvedValueOnce(false);
      mockWebSocketService.connect.mockResolvedValueOnce(undefined);
      mockWebRTCService.initialize.mockResolvedValueOnce(undefined);

      const mockParticipantRepo = {
        create: jest.fn().mockResolvedValue(mockParticipant)
      };
      mockRepositoryFactory.getParticipantRepository.mockReturnValue(mockParticipantRepo as any);

      const result = await videoConferencingService.joinRoom(roomId, options);

      expect(result.room).toBeDefined();
      expect(result.participant).toBeDefined();
      expect(mockRoomService.getRoom).toHaveBeenCalledWith(roomId);
      expect(mockRoomService.isRoomFull).toHaveBeenCalledWith(roomId);
      expect(mockWebSocketService.connect).toHaveBeenCalledWith(mockConfig.websocketUrl, mockRoom, mockParticipant);
      expect(mockWebRTCService.initialize).toHaveBeenCalledWith(mockRoom, mockParticipant);
    });

    it('should throw error if room not found', async () => {
      const roomId = 'non-existent-room';
      const options = { participantName: 'Test User' };

      mockRoomService.getRoom.mockResolvedValueOnce(null);

      await expect(videoConferencingService.joinRoom(roomId, options))
        .rejects.toThrow('Room not found');
    });

    it('should throw error if room is full', async () => {
      const roomId = 'test-room-id';
      const options = { participantName: 'Test User' };
      const mockRoom = RoomModel.create({
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      });

      mockRoomService.getRoom.mockResolvedValueOnce(mockRoom);
      mockRoomService.isRoomFull.mockResolvedValueOnce(true);

      await expect(videoConferencingService.joinRoom(roomId, options))
        .rejects.toThrow('Room is full');
    });
  });

  describe('leaveRoom', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
      
      // Mock the private properties by creating a room first
      await videoConferencingService.createRoom({ name: 'Test Room' });
    });

    it('should leave room successfully', async () => {
      const mockParticipantRepo = {
        updateConnectionState: jest.fn().mockResolvedValue(undefined)
      };
      mockRepositoryFactory.getParticipantRepository.mockReturnValue(mockParticipantRepo as any);

      await videoConferencingService.leaveRoom();

      expect(mockWebRTCService.cleanup).toHaveBeenCalled();
      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
      expect(videoConferencingService.isInRoom()).toBe(false);
    });

    it('should do nothing if not in a room', async () => {
      // Create a new service instance without setting up room
      const newService = new VideoConferencingService(
        mockWebRTCService,
        mockWebSocketService,
        mockRoomService,
        mockChatService,
        mockRepositoryFactory,
        mockConfig
      );

      await expect(newService.leaveRoom()).resolves.toBeUndefined();
    });
  });

  describe('startLocalMedia', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
      await videoConferencingService.createRoom({ name: 'Test Room' });
    });

    it('should start local media successfully', async () => {
      const constraints = { video: true, audio: true };
      const mockStream = new MediaStream();

      mockWebRTCService.getLocalStream.mockResolvedValueOnce(mockStream);

      const result = await videoConferencingService.startLocalMedia(constraints);

      expect(result).toBe(mockStream);
      expect(mockWebRTCService.getLocalStream).toHaveBeenCalledWith(constraints);
    });

    it('should throw error if not in a room', async () => {
      const newService = new VideoConferencingService(
        mockWebRTCService,
        mockWebSocketService,
        mockRoomService,
        mockChatService,
        mockRepositoryFactory,
        mockConfig
      );

      await expect(newService.startLocalMedia({ video: true, audio: true }))
        .rejects.toThrow('Not in a room');
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
      await videoConferencingService.createRoom({ name: 'Test Room' });
    });

    it('should send message successfully', async () => {
      const content = 'Hello, world!';
      const mockMessage = {
        id: 'message-id',
        content,
        timestamp: new Date().toISOString()
      };

      mockChatService.sendMessage.mockResolvedValueOnce(mockMessage);

      await videoConferencingService.sendMessage(content);

      expect(mockChatService.sendMessage).toHaveBeenCalled();
      expect(mockWebSocketService.sendChatMessage).toHaveBeenCalledWith({
        content: mockMessage.content,
        timestamp: mockMessage.timestamp
      });
    });

    it('should throw error if not in a room', async () => {
      const newService = new VideoConferencingService(
        mockWebRTCService,
        mockWebSocketService,
        mockRoomService,
        mockChatService,
        mockRepositoryFactory,
        mockConfig
      );

      await expect(newService.sendMessage('Hello'))
        .rejects.toThrow('Not in a room');
    });
  });

  describe('updateMediaState', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
      await videoConferencingService.createRoom({ name: 'Test Room' });
    });

    it('should update media state successfully', async () => {
      const mediaState = {
        camera: false,
        microphone: true,
        screenShare: false
      };

      const mockParticipantRepo = {
        updateMediaPermissions: jest.fn().mockResolvedValue(undefined)
      };
      mockRepositoryFactory.getParticipantRepository.mockReturnValue(mockParticipantRepo as any);

      await videoConferencingService.updateMediaState(mediaState);

      expect(mockParticipantRepo.updateMediaPermissions).toHaveBeenCalled();
      expect(mockWebSocketService.sendMediaStateChange).toHaveBeenCalledWith(mediaState);
    });

    it('should throw error if not in a room', async () => {
      const newService = new VideoConferencingService(
        mockWebRTCService,
        mockWebSocketService,
        mockRoomService,
        mockChatService,
        mockRepositoryFactory,
        mockConfig
      );

      await expect(newService.updateMediaState({ camera: true, microphone: true, screenShare: false }))
        .rejects.toThrow('Not in a room');
    });
  });

  describe('getParticipants', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
      await videoConferencingService.createRoom({ name: 'Test Room' });
    });

    it('should get participants successfully', async () => {
      const mockParticipants = [
        ParticipantModel.create({
          roomId: 'test-room-id',
          name: 'User 1',
          isHost: true,
          mediaPermissions: { camera: true, microphone: true, screenShare: true }
        })
      ];

      mockRoomService.getRoomParticipants.mockResolvedValueOnce(mockParticipants);

      const result = await videoConferencingService.getParticipants();

      expect(result).toBe(mockParticipants);
      expect(mockRoomService.getRoomParticipants).toHaveBeenCalled();
    });

    it('should throw error if not in a room', async () => {
      const newService = new VideoConferencingService(
        mockWebRTCService,
        mockWebSocketService,
        mockRoomService,
        mockChatService,
        mockRepositoryFactory,
        mockConfig
      );

      await expect(newService.getParticipants())
        .rejects.toThrow('Not in a room');
    });
  });

  describe('searchRooms', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
    });

    it('should search rooms successfully', async () => {
      const query = 'test';
      const mockRooms = [
        RoomModel.create({
          name: 'Test Room 1',
          maxParticipants: 10,
          settings: {}
        })
      ];

      mockRoomService.searchRooms.mockResolvedValueOnce(mockRooms);

      const result = await videoConferencingService.searchRooms(query);

      expect(result).toBe(mockRooms);
      expect(mockRoomService.searchRooms).toHaveBeenCalledWith(query, 20);
    });

    it('should throw error if not initialized', async () => {
      const newService = new VideoConferencingService(
        mockWebRTCService,
        mockWebSocketService,
        mockRoomService,
        mockChatService,
        mockRepositoryFactory,
        mockConfig
      );

      await expect(newService.searchRooms('test'))
        .rejects.toThrow('Video conferencing service not initialized');
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
      await videoConferencingService.createRoom({ name: 'Test Room' });
    });

    it('should cleanup all resources', async () => {
      mockRepositoryFactory.close.mockResolvedValueOnce(undefined);

      await videoConferencingService.cleanup();

      expect(mockWebRTCService.cleanup).toHaveBeenCalled();
      expect(mockWebSocketService.cleanup).toHaveBeenCalled();
      expect(mockRepositoryFactory.close).toHaveBeenCalled();
      expect(videoConferencingService.isServiceInitialized()).toBe(false);
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await videoConferencingService.initialize();
    });

    it('should forward WebRTC events', () => {
      const mockCallback = jest.fn();
      videoConferencingService.on('connectionStateChange', mockCallback);

      // Simulate WebRTC event
      mockWebRTCService.emit('connectionStateChange', 'test-participant', 'connected');

      expect(mockCallback).toHaveBeenCalledWith('test-participant', 'connected');
    });

    it('should forward WebSocket events', () => {
      const mockCallback = jest.fn();
      videoConferencingService.on('websocketConnected', mockCallback);

      // Simulate WebSocket event
      mockWebSocketService.emit('connected');

      expect(mockCallback).toHaveBeenCalled();
    });
  });
});
