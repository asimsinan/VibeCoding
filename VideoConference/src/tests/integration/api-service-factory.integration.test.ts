/**
 * API Service Factory Integration Tests
 * Tests the factory pattern for switching between mock and real API services
 */

import { ApiServiceFactory } from '../../lib/video-conferencing/services/api-service.factory';
import { MockApiService } from '../../lib/video-conferencing/services/mock-api.service';
import { RealApiService } from '../../lib/video-conferencing/services/real-api.service';

describe('API Service Factory Integration Tests', () => {
  let factory: ApiServiceFactory;

  beforeEach(() => {
    factory = ApiServiceFactory.getInstance();
    factory.reset(); // Reset factory state
  });

  afterEach(() => {
    factory.reset(); // Clean up after each test
  });

  describe('Service Creation', () => {
    it('should create mock service by default', () => {
      const service = factory.createService();
      
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(MockApiService);
      expect(factory.getCurrentServiceType()).toBe('mock');
    });

    it('should create real service when explicitly requested', () => {
      const service = factory.createService('real');
      
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(RealApiService);
      expect(factory.getCurrentServiceType()).toBe('real');
    });

    it('should create mock service when explicitly requested', () => {
      const service = factory.createService('mock');
      
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(MockApiService);
      expect(factory.getCurrentServiceType()).toBe('mock');
    });
  });

  describe('Service Switching', () => {
    it('should switch from mock to real service', () => {
      // Start with mock service
      const mockService = factory.createService('mock');
      expect(factory.getCurrentServiceType()).toBe('mock');

      // Switch to real service
      const realService = factory.switchServiceType('real');
      
      expect(realService).toBeDefined();
      expect(realService).toBeInstanceOf(RealApiService);
      expect(factory.getCurrentServiceType()).toBe('real');
      expect(factory.getCurrentService()).toBe(realService);
    });

    it('should switch from real to mock service', () => {
      // Start with real service
      const realService = factory.createService('real');
      expect(factory.getCurrentServiceType()).toBe('real');

      // Switch to mock service
      const mockService = factory.switchServiceType('mock');
      
      expect(mockService).toBeDefined();
      expect(mockService).toBeInstanceOf(MockApiService);
      expect(factory.getCurrentServiceType()).toBe('mock');
      expect(factory.getCurrentService()).toBe(mockService);
    });

    it('should reuse existing service when switching to same type', () => {
      // Create mock service
      const mockService1 = factory.createService('mock');
      
      // Switch to same type should return same instance
      const mockService2 = factory.createService('mock');
      
      expect(mockService1).toBe(mockService2);
      expect(factory.getCurrentService()).toBe(mockService1);
    });
  });

  describe('Service State Management', () => {
    it('should track current service type correctly', () => {
      expect(factory.getCurrentServiceType()).toBe('mock');
      
      factory.createService('real');
      expect(factory.getCurrentServiceType()).toBe('real');
      
      factory.createService('mock');
      expect(factory.getCurrentServiceType()).toBe('mock');
    });

    it('should track current service instance correctly', () => {
      expect(factory.getCurrentService()).toBeNull();
      
      const mockService = factory.createService('mock');
      expect(factory.getCurrentService()).toBe(mockService);
      
      const realService = factory.createService('real');
      expect(factory.getCurrentService()).toBe(realService);
    });

    it('should check if service is initialized correctly', () => {
      expect(factory.isInitialized()).toBe(false);
      
      factory.createService('mock');
      expect(factory.isInitialized()).toBe(true);
    });
  });

  describe('Factory Reset', () => {
    it('should reset factory state correctly', () => {
      // Create a service
      const service = factory.createService('real');
      expect(factory.isInitialized()).toBe(true);
      expect(factory.getCurrentServiceType()).toBe('real');

      // Reset factory
      factory.reset();
      
      expect(factory.isInitialized()).toBe(false);
      expect(factory.getCurrentServiceType()).toBe('mock');
      expect(factory.getCurrentService()).toBeNull();
    });

    it('should clean up service on reset', async () => {
      // Create a real service (which has cleanup method)
      const service = factory.createService('real');
      
      // Mock the cleanup method
      const cleanupSpy = jest.spyOn(service, 'cleanup');
      
      // Reset factory
      factory.reset();
      
      // Verify cleanup was called
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same factory instance', () => {
      const factory1 = ApiServiceFactory.getInstance();
      const factory2 = ApiServiceFactory.getInstance();
      
      expect(factory1).toBe(factory2);
    });

    it('should maintain state across multiple getInstance calls', () => {
      const factory1 = ApiServiceFactory.getInstance();
      factory1.createService('real');
      
      const factory2 = ApiServiceFactory.getInstance();
      expect(factory2.getCurrentServiceType()).toBe('real');
      expect(factory2.isInitialized()).toBe(true);
    });
  });

  describe('Service Interface Compliance', () => {
    it('should return service with correct interface for mock', () => {
      const service = factory.createService('mock');
      
      // Check that service has all required methods
      expect(typeof service.createRoom).toBe('function');
      expect(typeof service.getRoom).toBe('function');
      expect(typeof service.updateRoom).toBe('function');
      expect(typeof service.deleteRoom).toBe('function');
      expect(typeof service.joinRoom).toBe('function');
      expect(typeof service.getRoomParticipants).toBe('function');
      expect(typeof service.leaveRoom).toBe('function');
      expect(typeof service.sendMessage).toBe('function');
      expect(typeof service.getRoomMessages).toBe('function');
      expect(typeof service.connectWebSocket).toBe('function');
      expect(typeof service.sendWebSocketMessage).toBe('function');
      expect(typeof service.onWebSocketEvent).toBe('function');
      expect(typeof service.offWebSocketEvent).toBe('function');
      expect(typeof service.startRealTimeSimulation).toBe('function');
      expect(typeof service.stopRealTimeSimulation).toBe('function');
    });

    it('should return service with correct interface for real', () => {
      const service = factory.createService('real');
      
      // Check that service has all required methods
      expect(typeof service.createRoom).toBe('function');
      expect(typeof service.getRoom).toBe('function');
      expect(typeof service.updateRoom).toBe('function');
      expect(typeof service.deleteRoom).toBe('function');
      expect(typeof service.joinRoom).toBe('function');
      expect(typeof service.getRoomParticipants).toBe('function');
      expect(typeof service.leaveRoom).toBe('function');
      expect(typeof service.sendMessage).toBe('function');
      expect(typeof service.getRoomMessages).toBe('function');
      expect(typeof service.connectWebSocket).toBe('function');
      expect(typeof service.sendWebSocketMessage).toBe('function');
      expect(typeof service.onWebSocketEvent).toBe('function');
      expect(typeof service.offWebSocketEvent).toBe('function');
      expect(typeof service.startRealTimeSimulation).toBe('function');
      expect(typeof service.stopRealTimeSimulation).toBe('function');
    });
  });
});
