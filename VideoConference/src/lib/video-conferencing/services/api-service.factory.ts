/**
 * API Service Factory
 * Factory for creating API services (mock or real) based on environment
 */

import { MockApiService } from './mock-api.service';
import { RealApiService } from './real-api.service';

export type ApiServiceType = 'mock' | 'real';

export interface ApiService {
  // Room Management
  createRoom(roomData: any): Promise<any>;
  getRoom(roomId: string): Promise<any>;
  updateRoom(roomId: string, updateData: any): Promise<any>;
  deleteRoom(roomId: string): Promise<void>;
  
  // Participant Management
  joinRoom(roomId: string, options: any): Promise<any>;
  getRoomParticipants(roomId: string): Promise<any[]>;
  leaveRoom(participantId: string): Promise<void>;
  
  // Message Management
  sendMessage(roomId: string, messageData: any): Promise<any>;
  getRoomMessages(roomId: string, limit?: number, offset?: number): Promise<any[]>;
  
  // WebSocket Communication
  connectWebSocket(roomId: string, participantId: string): Promise<any>;
  sendWebSocketMessage(roomId: string, message: any): Promise<any>;
  onWebSocketEvent(event: string, callback: (data: any) => void): void;
  offWebSocketEvent(event: string, callback: (data: any) => void): void;
  
  // Real-time simulation
  startRealTimeSimulation(roomId: string): void;
  stopRealTimeSimulation(): void;
  
  // Cleanup
  cleanup?(): Promise<void>;
}

export class ApiServiceFactory {
  private static instance: ApiServiceFactory;
  private currentService: ApiService | null = null;
  private serviceType: ApiServiceType = 'mock';

  private constructor() {}

  static getInstance(): ApiServiceFactory {
    if (!ApiServiceFactory.instance) {
      ApiServiceFactory.instance = new ApiServiceFactory();
    }
    return ApiServiceFactory.instance;
  }

  /**
   * Create API service based on environment or explicit type
   */
  createService(type?: ApiServiceType): ApiService {
    // Determine service type based on environment or parameter
    const serviceType = type || this.getServiceTypeFromEnvironment();
    
    if (this.currentService && this.serviceType === serviceType) {
      return this.currentService;
    }

    // Clean up existing service
    if (this.currentService && 'cleanup' in this.currentService) {
      this.currentService.cleanup?.();
    }

    // Create new service
    switch (serviceType) {
      case 'real':
        this.currentService = new RealApiService();
        break;
      case 'mock':
      default:
        this.currentService = new MockApiService();
        break;
    }

    this.serviceType = serviceType;
    return this.currentService;
  }

  /**
   * Get current service type
   */
  getCurrentServiceType(): ApiServiceType {
    return this.serviceType;
  }

  /**
   * Switch to a different service type
   */
  switchServiceType(type: ApiServiceType): ApiService {
    return this.createService(type);
  }

  /**
   * Get service type from environment variables
   */
  private getServiceTypeFromEnvironment(): ApiServiceType {
    // Check environment variables to determine service type
    const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
    const nodeEnv = process.env.NODE_ENV;
    
    // Use real API in production, mock in development unless explicitly overridden
    if (useRealApi) {
      return 'real';
    }
    
    if (nodeEnv === 'production') {
      return 'real';
    }
    
    // Default to mock for development
    return 'mock';
  }

  /**
   * Get current service instance
   */
  getCurrentService(): ApiService | null {
    return this.currentService;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.currentService !== null;
  }

  /**
   * Reset factory (useful for testing)
   */
  reset(): void {
    if (this.currentService && 'cleanup' in this.currentService) {
      this.currentService.cleanup?.();
    }
    this.currentService = null;
    this.serviceType = 'mock';
  }
}

// Export singleton instance
export const apiServiceFactory = ApiServiceFactory.getInstance();
