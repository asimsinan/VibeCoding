import { DatabaseService } from './database.service';
// WebRTCService and WebSocketService removed - they're client-side only
import { RoomService } from './room.service';
import { ChatService } from './chat.service';
import { VideoConferencingService, VideoConferencingConfig } from './video-conferencing.service';
import { RepositoryFactory } from '../repositories/repository.factory';

export class ServiceFactory {
  private static instance: ServiceFactory | null = null;
  private databaseService: DatabaseService;
  private repositoryFactory: RepositoryFactory;
  // WebRTC and WebSocket services removed - they're client-side only
  private roomService: RoomService | null = null;
  private chatService: ChatService | null = null;
  private videoConferencingService: VideoConferencingService | null = null;
  private isInitialized: boolean = false;

  private constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.repositoryFactory = new RepositoryFactory(databaseService);
  }

  public static getInstance(databaseService?: DatabaseService): ServiceFactory {
    if (!ServiceFactory.instance) {
      if (!databaseService) {
        throw new Error('DatabaseService is required for first initialization');
      }
      ServiceFactory.instance = new ServiceFactory(databaseService);
    }
    return ServiceFactory.instance;
  }

  /**
   * Get room service instance
   */
  getRoomService(): RoomService {
    if (!this.roomService) {
      this.roomService = new RoomService(this.databaseService);
    }
    return this.roomService;
  }

  /**
   * Get chat service instance
   */
  getChatService(): ChatService {
    if (!this.chatService) {
      this.chatService = new ChatService(this.databaseService);
    }
    return this.chatService;
  }

  /**
   * Get video conferencing service instance
   */
  getVideoConferencingService(config: VideoConferencingConfig): VideoConferencingService {
    if (!this.videoConferencingService) {
      this.videoConferencingService = new VideoConferencingService(
        // WebRTC and WebSocket services removed - they're client-side only
        this.getRoomService(),
        this.getChatService(),
        this.repositoryFactory,
        config
      );
    }
    return this.videoConferencingService;
  }

  /**
   * Get repository factory
   */
  getRepositoryFactory(): RepositoryFactory {
    return this.repositoryFactory;
  }

  /**
   * Get database service
   */
  getDatabaseService(): DatabaseService {
    return this.databaseService;
  }

  /**
   * Get all services
   */
  getAllServices(config?: VideoConferencingConfig) {
    return {
      // WebRTC and WebSocket services removed - they're client-side only
      room: this.getRoomService(),
      chat: this.getChatService(),
      videoConferencing: config ? this.getVideoConferencingService(config) : null,
      repositories: this.repositoryFactory
    };
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return; // Already initialized
    }

    try {
      // Initialize database service
      if (!this.databaseService.isConnected()) {
        await this.databaseService.initialize();
      }

      // Initialize repository factory
      await this.repositoryFactory.initialize();

      // Initialize individual services
      // WebRTC and WebSocket services removed - they're client-side only
      this.getRoomService();
      this.getChatService();

      this.isInitialized = true;
      // Services are ready to use
    } catch (error) {
      throw new Error(`Failed to initialize services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a complete video conferencing instance
   */
  async createVideoConferencingInstance(config: VideoConferencingConfig): Promise<VideoConferencingService> {
    // Ensure all services are initialized
    await this.initialize();

    // Get the video conferencing service
    const videoConferencingService = this.getVideoConferencingService(config);

    // Initialize the video conferencing service
    await videoConferencingService.initialize();

    return videoConferencingService;
  }

  /**
   * Check if all services are ready
   */
  async isReady(): Promise<boolean> {
    return this.databaseService.isConnected() && await this.repositoryFactory.isConnected();
  }

  /**
   * Clear all service instances (useful for testing)
   */
  clearServices(): void {
    // WebRTC and WebSocket services removed - they're client-side only
    this.roomService = null;
    this.chatService = null;
    this.videoConferencingService = null;
    this.repositoryFactory.clearRepositories();
  }

  /**
   * Close all services and connections
   */
  async close(): Promise<void> {
    try {
      // Cleanup video conferencing service
      if (this.videoConferencingService) {
        await this.videoConferencingService.cleanup();
      }

      // Cleanup individual services
      // WebRTC and WebSocket services removed - they're client-side only

      // Close repository factory
      await this.repositoryFactory.close();

      // Close database service
      await this.databaseService.disconnect();

      // Clear all instances
      this.clearServices();

    } catch (error) {
      throw new Error(`Failed to close services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    database: boolean;
    repositories: boolean;
    webrtc: boolean;
    websocket: boolean;
    overall: boolean;
  }> {
    const database = this.databaseService.isConnected();
    const repositories = await this.repositoryFactory.isConnected();
    
    // In production, WebRTC and WebSocket services are client-side only
    // They don't need to be initialized on the server
    const isProduction = process.env.NODE_ENV === 'production';
    const webrtc = isProduction ? true : true; // Always true since they're client-side
    const websocket = isProduction ? true : true; // Always true since they're client-side
    
    // Overall health is based on server-side services only
    const overall = database && repositories;

    return {
      database,
      repositories,
      webrtc,
      websocket,
      overall
    };
  }
}
