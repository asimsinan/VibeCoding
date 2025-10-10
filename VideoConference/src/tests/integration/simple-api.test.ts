/**
 * Simple API Integration Test
 * Basic test to verify the API service factory works
 */

import { ApiServiceFactory } from '../../lib/video-conferencing/services/api-service.factory';
import { MockApiService } from '../../lib/video-conferencing/services/mock-api.service';
import { RealApiService } from '../../lib/video-conferencing/services/real-api.service';

describe('Simple API Integration Tests', () => {
  let factory: ApiServiceFactory;

  beforeEach(() => {
    factory = ApiServiceFactory.getInstance();
  });

  afterEach(() => {
    factory.reset();
  });

  it('should create a factory instance', () => {
    expect(factory).toBeDefined();
    expect(factory).toBeInstanceOf(ApiServiceFactory);
  });

  it('should create mock service by default', () => {
    const service = factory.createService();
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(MockApiService);
  });

  it('should create real service when requested', () => {
    const service = factory.switchServiceType('real');
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(RealApiService);
  });

  it('should switch between service types', () => {
    const mockService = factory.switchServiceType('mock');
    expect(mockService).toBeInstanceOf(MockApiService);

    const realService = factory.switchServiceType('real');
    expect(realService).toBeInstanceOf(RealApiService);

    const backToMock = factory.switchServiceType('mock');
    expect(backToMock).toBeInstanceOf(MockApiService);
  });

  it('should track current service type', () => {
    factory.switchServiceType('mock');
    expect(factory.getCurrentServiceType()).toBe('mock');

    factory.switchServiceType('real');
    expect(factory.getCurrentServiceType()).toBe('real');
  });

  it('should check if service is initialized', () => {
    expect(factory.isInitialized()).toBe(false);
    
    factory.createService();
    expect(factory.isInitialized()).toBe(true);
  });
});
