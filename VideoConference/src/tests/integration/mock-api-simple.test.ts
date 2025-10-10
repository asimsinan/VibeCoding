/**
 * Simple Mock API Integration Test
 * Basic test to verify the mock API service works
 */

import { MockApiService } from '../../lib/video-conferencing/services/mock-api.service';

describe('Simple Mock API Integration Tests', () => {
  let mockApiService: MockApiService;

  beforeAll(() => {
    mockApiService = new MockApiService();
  });

  afterAll(async () => {
    // MockApiService doesn't have a cleanup method
    // Just stop any real-time simulation if running
    mockApiService.stopRealTimeSimulation();
  });

  it('should create a mock API service instance', () => {
    expect(mockApiService).toBeDefined();
    expect(mockApiService).toBeInstanceOf(MockApiService);
  });

  it('should create a room successfully', async () => {
    const roomData = {
      name: 'Test Room',
      maxParticipants: 5,
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
    expect(result.room.name).toBe('Test Room');
    expect(result.participant).toBeDefined();
    expect(result.participant.name).toBe('Host');
  });

  it('should get a room by ID', async () => {
    const roomData = {
      name: 'Get Test Room',
      maxParticipants: 3,
      settings: {}
    };

    const createResult = await mockApiService.createRoom(roomData);
    const room = await mockApiService.getRoom(createResult.room.id);
    
    expect(room).toBeDefined();
    expect(room?.name).toBe('Get Test Room');
  });

  it('should join a room successfully', async () => {
    const roomData = {
      name: 'Join Test Room',
      maxParticipants: 4,
      settings: {}
    };

    const createResult = await mockApiService.createRoom(roomData);
    const joinResult = await mockApiService.joinRoom(createResult.room.id, {
      participantName: 'Test Participant',
      mediaPermissions: {
        camera: true,
        microphone: true,
        screenShare: false
      }
    });

    expect(joinResult).toBeDefined();
    expect(joinResult.room).toBeDefined();
    expect(joinResult.participant).toBeDefined();
    expect(joinResult.participant.name).toBe('Test Participant');
  });

  it('should send a message successfully', async () => {
    const roomData = {
      name: 'Message Test Room',
      maxParticipants: 2,
      settings: {}
    };

    const createResult = await mockApiService.createRoom(roomData);
    const messageResult = await mockApiService.sendMessage(createResult.room.id, {
      content: 'Hello, world!',
      participantId: createResult.participant.id,
      participantName: 'Host',
      messageType: 'text'
    });

    expect(messageResult).toBeDefined();
    expect(messageResult.message).toBeDefined();
    expect(messageResult.message.message).toBe('Hello, world!');
  });

  it('should handle WebSocket connection simulation', async () => {
    const result = await mockApiService.connectWebSocket('test-room', 'test-participant');
    expect(result).toBeDefined();
    expect(result.connected).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should handle real-time simulation', () => {
    expect(() => mockApiService.startRealTimeSimulation()).not.toThrow();
    expect(() => mockApiService.stopRealTimeSimulation()).not.toThrow();
  });
});
