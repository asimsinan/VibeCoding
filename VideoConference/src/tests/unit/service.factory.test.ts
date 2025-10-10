import { ServiceFactory } from '../../lib/video-conferencing/services/service.factory';
import { DatabaseService } from '../../lib/video-conferencing/services/database.service';

// Mock DatabaseService
jest.mock('../../lib/video-conferencing/services/database.service');

describe('ServiceFactory', () => {
  let serviceFactory: ServiceFactory;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = {
      isConnected: jest.fn().mockReturnValue(true),
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    } as jest.Mocked<DatabaseService>;
    
    serviceFactory = new ServiceFactory(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service factory', () => {
      expect(serviceFactory).toBeDefined();
    });
  });

  describe('getWebRTCService', () => {
    it('should get WebRTC service instance', () => {
      const webrtcService = serviceFactory.getWebRTCService();
      expect(webrtcService).toBeDefined();
    });

    it('should return same instance on multiple calls', () => {
      const service1 = serviceFactory.getWebRTCService();
      const service2 = serviceFactory.getWebRTCService();
      expect(service1).toBe(service2);
    });
  });

  describe('getWebSocketService', () => {
    it('should get WebSocket service instance', () => {
      const websocketService = serviceFactory.getWebSocketService();
      expect(websocketService).toBeDefined();
    });

    it('should return same instance on multiple calls', () => {
      const service1 = serviceFactory.getWebSocketService();
      const service2 = serviceFactory.getWebSocketService();
      expect(service1).toBe(service2);
    });
  });

  describe('getRoomService', () => {
    it('should get room service instance', () => {
      const roomService = serviceFactory.getRoomService();
      expect(roomService).toBeDefined();
    });

    it('should return same instance on multiple calls', () => {
      const service1 = serviceFactory.getRoomService();
      const service2 = serviceFactory.getRoomService();
      expect(service1).toBe(service2);
    });
  });

  describe('getChatService', () => {
    it('should get chat service instance', () => {
      const chatService = serviceFactory.getChatService();
      expect(chatService).toBeDefined();
    });

    it('should return same instance on multiple calls', () => {
      const service1 = serviceFactory.getChatService();
      const service2 = serviceFactory.getChatService();
      expect(service1).toBe(service2);
    });
  });

  describe('getVideoConferencingService', () => {
    const mockConfig = {
      websocketUrl: 'ws://localhost:3000',
      maxParticipants: 10,
      enableScreenShare: true,
      enableChat: true,
      enableRecording: false
    };

    it('should get video conferencing service instance', () => {
      const videoConferencingService = serviceFactory.getVideoConferencingService(mockConfig);
      expect(videoConferencingService).toBeDefined();
    });

    it('should return same instance on multiple calls with same config', () => {
      const service1 = serviceFactory.getVideoConferencingService(mockConfig);
      const service2 = serviceFactory.getVideoConferencingService(mockConfig);
      expect(service1).toBe(service2);
    });
  });

  describe('getRepositoryFactory', () => {
    it('should get repository factory instance', () => {
      const repositoryFactory = serviceFactory.getRepositoryFactory();
      expect(repositoryFactory).toBeDefined();
    });
  });

  describe('getDatabaseService', () => {
    it('should get database service instance', () => {
      const databaseService = serviceFactory.getDatabaseService();
      expect(databaseService).toBe(mockDatabaseService);
    });
  });

  describe('getAllServices', () => {
    it('should get all services without config', () => {
      const services = serviceFactory.getAllServices();
      
      expect(services.webrtc).toBeDefined();
      expect(services.websocket).toBeDefined();
      expect(services.room).toBeDefined();
      expect(services.chat).toBeDefined();
      expect(services.videoConferencing).toBeNull();
      expect(services.repositories).toBeDefined();
    });

    it('should get all services with config', () => {
      const mockConfig = {
        websocketUrl: 'ws://localhost:3000',
        maxParticipants: 10,
        enableScreenShare: true,
        enableChat: true,
        enableRecording: false
      };

      const services = serviceFactory.getAllServices(mockConfig);
      
      expect(services.webrtc).toBeDefined();
      expect(services.websocket).toBeDefined();
      expect(services.room).toBeDefined();
      expect(services.chat).toBeDefined();
      expect(services.videoConferencing).toBeDefined();
      expect(services.repositories).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize all services successfully', async () => {
      await expect(serviceFactory.initialize()).resolves.toBeUndefined();
      
      expect(mockDatabaseService.initialize).toHaveBeenCalled();
    });

    it('should not initialize database if already connected', async () => {
      mockDatabaseService.isConnected.mockReturnValue(true);
      
      await serviceFactory.initialize();
      
      expect(mockDatabaseService.initialize).not.toHaveBeenCalled();
    });
  });

  describe('createVideoConferencingInstance', () => {
    const mockConfig = {
      websocketUrl: 'ws://localhost:3000',
      maxParticipants: 10,
      enableScreenShare: true,
      enableChat: true,
      enableRecording: false
    };

    it('should create video conferencing instance successfully', async () => {
      const instance = await serviceFactory.createVideoConferencingInstance(mockConfig);
      
      expect(instance).toBeDefined();
      expect(mockDatabaseService.initialize).toHaveBeenCalled();
    });
  });

  describe('isReady', () => {
    it('should return true when all services are ready', () => {
      mockDatabaseService.isConnected.mockReturnValue(true);
      
      // Mock repository factory isConnected method
      const mockRepositoryFactory = {
        isConnected: jest.fn().mockResolvedValue(true)
      };
      (serviceFactory as any).repositoryFactory = mockRepositoryFactory;
      
      expect(serviceFactory.isReady()).toBe(true);
    });

    it('should return false when database is not connected', () => {
      mockDatabaseService.isConnected.mockReturnValue(false);
      
      expect(serviceFactory.isReady()).toBe(false);
    });
  });

  describe('clearServices', () => {
    it('should clear all service instances', () => {
      // Get services to create instances
      serviceFactory.getWebRTCService();
      serviceFactory.getWebSocketService();
      serviceFactory.getRoomService();
      serviceFactory.getChatService();
      
      // Clear services
      serviceFactory.clearServices();
      
      // Get new instances
      const webrtc1 = serviceFactory.getWebRTCService();
      const webrtc2 = serviceFactory.getWebRTCService();
      
      // Should be the same instance (singleton)
      expect(webrtc1).toBe(webrtc2);
    });
  });

  describe('close', () => {
    it('should close all services successfully', async () => {
      // Mock video conferencing service
      const mockVideoConferencingService = {
        cleanup: jest.fn().mockResolvedValue(undefined)
      };
      (serviceFactory as any).videoConferencingService = mockVideoConferencingService;

      // Mock repository factory
      const mockRepositoryFactory = {
        close: jest.fn().mockResolvedValue(undefined),
        clearRepositories: jest.fn()
      };
      (serviceFactory as any).repositoryFactory = mockRepositoryFactory;

      await expect(serviceFactory.close()).resolves.toBeUndefined();
      
      expect(mockVideoConferencingService.cleanup).toHaveBeenCalled();
      expect(mockRepositoryFactory.close).toHaveBeenCalled();
      expect(mockDatabaseService.close).toHaveBeenCalled();
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status for all services', async () => {
      const mockRepositoryFactory = {
        isConnected: jest.fn().mockResolvedValue(true)
      };
      (serviceFactory as any).repositoryFactory = mockRepositoryFactory;

      // Create some services
      serviceFactory.getWebRTCService();
      serviceFactory.getWebSocketService();

      const healthStatus = await serviceFactory.getHealthStatus();

      expect(healthStatus).toHaveProperty('database');
      expect(healthStatus).toHaveProperty('repositories');
      expect(healthStatus).toHaveProperty('webrtc');
      expect(healthStatus).toHaveProperty('websocket');
      expect(healthStatus).toHaveProperty('overall');
    });

    it('should return false overall when some services are not ready', async () => {
      mockDatabaseService.isConnected.mockReturnValue(false);
      
      const mockRepositoryFactory = {
        isConnected: jest.fn().mockResolvedValue(true)
      };
      (serviceFactory as any).repositoryFactory = mockRepositoryFactory;

      const healthStatus = await serviceFactory.getHealthStatus();

      expect(healthStatus.database).toBe(false);
      expect(healthStatus.overall).toBe(false);
    });
  });
});
