/**
 * Simple Real API Integration Test
 * Basic test to verify the real API service works
 */

import { RealApiService } from '../../lib/video-conferencing/services/real-api.service';

describe('Simple Real API Integration Tests', () => {
  let realApiService: RealApiService;

  beforeAll(() => {
    realApiService = new RealApiService();
  });

  afterAll(async () => {
    await realApiService.cleanup();
  });

  it('should create a real API service instance', () => {
    expect(realApiService).toBeDefined();
    expect(realApiService).toBeInstanceOf(RealApiService);
  });

  it('should handle WebSocket connection simulation', async () => {
    const result = await realApiService.connectWebSocket('test-room', 'test-participant');
    expect(result).toBeDefined();
    expect(result.connected).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should handle WebSocket message sending simulation', async () => {
    const message = { type: 'test', data: { content: 'test message' } };
    const result = await realApiService.sendWebSocketMessage('test-room', message);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should handle real-time simulation methods', () => {
    expect(() => realApiService.startRealTimeSimulation('test-room')).not.toThrow();
    expect(() => realApiService.stopRealTimeSimulation()).not.toThrow();
  });

  it('should handle cleanup', async () => {
    await expect(realApiService.cleanup()).resolves.not.toThrow();
  });
});
