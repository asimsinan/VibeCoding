import { WebSocketService } from '../../lib/video-conferencing/services/websocket.service';
import { RoomModel, ParticipantModel } from '../../lib/video-conferencing/models';

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('WebSocketService', () => {
  let websocketService: WebSocketService;
  let mockRoom: RoomModel;
  let mockParticipant: ParticipantModel;

  beforeEach(() => {
    websocketService = new WebSocketService();
    
    // Create mock room and participant
    mockRoom = RoomModel.create({
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

    mockParticipant = ParticipantModel.create({
      roomId: mockRoom.id,
      name: 'Test User',
      isHost: true,
      mediaPermissions: {
        camera: true,
        microphone: true,
        screenShare: true
      }
    });
  });

  afterEach(() => {
    websocketService.disconnect();
  });

  describe('connect', () => {
    it('should connect to WebSocket server', async () => {
      await expect(websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant))
        .resolves.toBeUndefined();
      
      expect(websocketService.isConnected()).toBe(true);
    });

    it('should throw error if room is invalid', async () => {
      const invalidRoom = {} as RoomModel;
      await expect(websocketService.connect('ws://localhost:3000', invalidRoom, mockParticipant))
        .rejects.toThrow('Invalid room provided');
    });

    it('should throw error if participant is invalid', async () => {
      const invalidParticipant = {} as ParticipantModel;
      await expect(websocketService.connect('ws://localhost:3000', mockRoom, invalidParticipant))
        .rejects.toThrow('Invalid participant provided');
    });

    it('should throw error for invalid URL', async () => {
      await expect(websocketService.connect('invalid-url', mockRoom, mockParticipant))
        .rejects.toThrow('Invalid WebSocket URL');
    });
  });

  describe('disconnect', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should disconnect from WebSocket server', () => {
      websocketService.disconnect();
      expect(websocketService.isConnected()).toBe(false);
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should send message to server', () => {
      const message = {
        type: 'join',
        data: { participantId: mockParticipant.id }
      };

      expect(() => websocketService.sendMessage(message)).not.toThrow();
    });

    it('should throw error if not connected', () => {
      websocketService.disconnect();
      
      const message = {
        type: 'join',
        data: { participantId: mockParticipant.id }
      };

      expect(() => websocketService.sendMessage(message))
        .toThrow('WebSocket not connected');
    });
  });

  describe('sendOffer', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should send offer to specific participant', () => {
      const offer = {
        type: 'offer',
        sdp: 'mock-sdp'
      };

      expect(() => websocketService.sendOffer('participant-123', offer))
        .not.toThrow();
    });
  });

  describe('sendAnswer', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should send answer to specific participant', () => {
      const answer = {
        type: 'answer',
        sdp: 'mock-sdp'
      };

      expect(() => websocketService.sendAnswer('participant-123', answer))
        .not.toThrow();
    });
  });

  describe('sendIceCandidate', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should send ICE candidate to specific participant', () => {
      const candidate = {
        candidate: 'candidate:1 1 UDP 2113667326 192.168.1.100 54400 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0'
      };

      expect(() => websocketService.sendIceCandidate('participant-123', candidate))
        .not.toThrow();
    });
  });

  describe('sendChatMessage', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should send chat message to room', () => {
      const chatMessage = {
        content: 'Hello, world!',
        timestamp: new Date().toISOString()
      };

      expect(() => websocketService.sendChatMessage(chatMessage))
        .not.toThrow();
    });
  });

  describe('sendMediaStateChange', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should send media state change', () => {
      const mediaState = {
        camera: true,
        microphone: false,
        screenShare: false
      };

      expect(() => websocketService.sendMediaStateChange(mediaState))
        .not.toThrow();
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should emit connection events', (done) => {
      websocketService.on('connected', () => {
        done();
      });

      // Simulate connection event
      websocketService.emit('connected');
    });

    it('should emit message events', (done) => {
      const testMessage = {
        type: 'test',
        data: { test: true }
      };

      websocketService.on('message', (message) => {
        expect(message).toEqual(testMessage);
        done();
      });

      // Simulate message event
      websocketService.emit('message', testMessage);
    });

    it('should emit error events', (done) => {
      const testError = new Error('Test error');

      websocketService.on('error', (error) => {
        expect(error).toBe(testError);
        done();
      });

      // Simulate error event
      websocketService.emit('error', testError);
    });
  });

  describe('reconnection', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should attempt reconnection on disconnect', (done) => {
      let reconnectAttempts = 0;
      
      websocketService.on('reconnecting', () => {
        reconnectAttempts++;
        if (reconnectAttempts === 1) {
          done();
        }
      });

      // Simulate disconnect
      websocketService.disconnect();
    });

    it('should have configurable reconnection settings', () => {
      const settings = websocketService.getReconnectionSettings();
      
      expect(settings).toHaveProperty('maxAttempts');
      expect(settings).toHaveProperty('delay');
      expect(settings).toHaveProperty('backoffMultiplier');
    });
  });

  describe('message validation', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
    });

    it('should validate message format', () => {
      const invalidMessage = {
        // Missing type
        data: { test: true }
      };

      expect(() => websocketService.sendMessage(invalidMessage as any))
        .toThrow('Invalid message format');
    });

    it('should validate offer format', () => {
      const invalidOffer = {
        type: 'offer'
        // Missing sdp
      };

      expect(() => websocketService.sendOffer('participant-123', invalidOffer as any))
        .toThrow('Invalid offer format');
    });

    it('should validate answer format', () => {
      const invalidAnswer = {
        type: 'answer'
        // Missing sdp
      };

      expect(() => websocketService.sendAnswer('participant-123', invalidAnswer as any))
        .toThrow('Invalid answer format');
    });

    it('should validate ICE candidate format', () => {
      const invalidCandidate = {
        candidate: 'candidate:1 1 UDP 2113667326 192.168.1.100 54400 typ host'
        // Missing sdpMLineIndex and sdpMid
      };

      expect(() => websocketService.sendIceCandidate('participant-123', invalidCandidate as any))
        .toThrow('Invalid ICE candidate format');
    });
  });

  describe('room management', () => {
    it('should get current room', async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
      
      const room = websocketService.getRoom();
      expect(room).toBe(mockRoom);
    });

    it('should get current participant', async () => {
      await websocketService.connect('ws://localhost:3000', mockRoom, mockParticipant);
      
      const participant = websocketService.getParticipant();
      expect(participant).toBe(mockParticipant);
    });

    it('should return null for room and participant when not connected', () => {
      expect(websocketService.getRoom()).toBeNull();
      expect(websocketService.getParticipant()).toBeNull();
    });
  });
});
