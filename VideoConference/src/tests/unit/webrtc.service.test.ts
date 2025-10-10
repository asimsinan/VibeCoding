import { WebRTCService } from '../../lib/video-conferencing/services/webrtc.service';
import { RoomModel, ParticipantModel } from '../../lib/video-conferencing/models';

describe('WebRTCService', () => {
  let webrtcService: WebRTCService;
  let mockRoom: RoomModel;
  let mockParticipant: ParticipantModel;

  beforeEach(() => {
    webrtcService = new WebRTCService();
    
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
    webrtcService.cleanup();
  });

  describe('initialize', () => {
    it('should initialize WebRTC service with room and participant', async () => {
      await expect(webrtcService.initialize(mockRoom, mockParticipant)).resolves.toBeUndefined();
      expect(webrtcService.isInitialized()).toBe(true);
    });

    it('should throw error if room is invalid', async () => {
      const invalidRoom = {} as RoomModel;
      await expect(webrtcService.initialize(invalidRoom, mockParticipant))
        .rejects.toThrow('Invalid room provided');
    });

    it('should throw error if participant is invalid', async () => {
      const invalidParticipant = {} as ParticipantModel;
      await expect(webrtcService.initialize(mockRoom, invalidParticipant))
        .rejects.toThrow('Invalid participant provided');
    });
  });

  describe('getLocalStream', () => {
    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
    });

    it('should get local media stream with camera and microphone', async () => {
      // Mock MediaStream with tracks
      const mockStream = new MediaStream();
      const videoTrack = new MediaStreamTrack();
      videoTrack.kind = 'video';
      const audioTrack = new MediaStreamTrack();
      audioTrack.kind = 'audio';
      mockStream.addTrack(videoTrack);
      mockStream.addTrack(audioTrack);
      
      navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue(mockStream);
      
      const stream = await webrtcService.getLocalStream({
        video: true,
        audio: true
      });
      
      expect(stream).toBeDefined();
      expect(stream.getVideoTracks().length).toBeGreaterThan(0);
      expect(stream.getAudioTracks().length).toBeGreaterThan(0);
    });

    it('should get local media stream with only video', async () => {
      // Mock MediaStream with only video track
      const mockStream = new MediaStream();
      const videoTrack = new MediaStreamTrack();
      videoTrack.kind = 'video';
      mockStream.addTrack(videoTrack);
      
      navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue(mockStream);
      
      const stream = await webrtcService.getLocalStream({
        video: true,
        audio: false
      });
      
      expect(stream).toBeDefined();
      expect(stream.getVideoTracks().length).toBeGreaterThan(0);
      expect(stream.getAudioTracks().length).toBe(0);
    });

    it('should get local media stream with only audio', async () => {
      // Mock MediaStream with only audio track
      const mockStream = new MediaStream();
      const audioTrack = new MediaStreamTrack();
      audioTrack.kind = 'audio';
      mockStream.addTrack(audioTrack);
      
      navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue(mockStream);
      
      const stream = await webrtcService.getLocalStream({
        video: false,
        audio: true
      });
      
      expect(stream).toBeDefined();
      expect(stream.getVideoTracks().length).toBe(0);
      expect(stream.getAudioTracks().length).toBeGreaterThan(0);
    });

    it('should throw error if media access is denied', async () => {
      // Mock getUserMedia to reject
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(webrtcService.getLocalStream({ video: true, audio: true }))
        .rejects.toThrow('Failed to access media devices: Permission denied');

      // Restore original function
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    });
  });

  describe('createPeerConnection', () => {
    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
    });

    it('should create peer connection with proper configuration', () => {
      const peerConnection = webrtcService.createPeerConnection('participant-123');
      
      expect(peerConnection).toBeDefined();
      expect(peerConnection.connectionState).toBe('new');
    });

    it('should create multiple peer connections for different participants', () => {
      const pc1 = webrtcService.createPeerConnection('participant-1');
      const pc2 = webrtcService.createPeerConnection('participant-2');
      
      expect(pc1).not.toBe(pc2);
      expect(webrtcService.getPeerConnections()).toHaveLength(2);
    });
  });

  describe('addIceCandidate', () => {
    let peerConnection: RTCPeerConnection;

    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
      peerConnection = webrtcService.createPeerConnection('participant-123');
    });

    it('should add ICE candidate to peer connection', async () => {
      const mockCandidate = {
        candidate: 'candidate:1 1 UDP 2113667326 192.168.1.100 54400 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0'
      };

      await expect(webrtcService.addIceCandidate('participant-123', mockCandidate))
        .resolves.toBeUndefined();
    });

    it('should throw error if peer connection not found', async () => {
      const mockCandidate = {
        candidate: 'candidate:1 1 UDP 2113667326 192.168.1.100 54400 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0'
      };

      await expect(webrtcService.addIceCandidate('non-existent', mockCandidate))
        .rejects.toThrow('Peer connection not found for participant: non-existent');
    });
  });

  describe('createOffer', () => {
    let peerConnection: RTCPeerConnection;

    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
      peerConnection = webrtcService.createPeerConnection('participant-123');
    });

    it('should create offer for peer connection', async () => {
      const offer = await webrtcService.createOffer('participant-123');
      
      expect(offer).toBeDefined();
      expect(offer.type).toBe('offer');
      expect(offer.sdp).toBeDefined();
    });

    it('should throw error if peer connection not found', async () => {
      await expect(webrtcService.createOffer('non-existent'))
        .rejects.toThrow('Peer connection not found for participant: non-existent');
    });
  });

  describe('createAnswer', () => {
    let peerConnection: RTCPeerConnection;

    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
      peerConnection = webrtcService.createPeerConnection('participant-123');
    });

    it('should create answer for peer connection', async () => {
      // First set remote description
      const offer = await webrtcService.createOffer('participant-123');
      await webrtcService.setRemoteDescription('participant-123', offer);

      const answer = await webrtcService.createAnswer('participant-123');
      
      expect(answer).toBeDefined();
      expect(answer.type).toBe('answer');
      expect(answer.sdp).toBeDefined();
    });

    it('should throw error if peer connection not found', async () => {
      await expect(webrtcService.createAnswer('non-existent'))
        .rejects.toThrow('Peer connection not found for participant: non-existent');
    });
  });

  describe('setRemoteDescription', () => {
    let peerConnection: RTCPeerConnection;

    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
      peerConnection = webrtcService.createPeerConnection('participant-123');
    });

    it('should set remote description on peer connection', async () => {
      const offer = await webrtcService.createOffer('participant-123');
      
      await expect(webrtcService.setRemoteDescription('participant-123', offer))
        .resolves.toBeUndefined();
    });

    it('should throw error if peer connection not found', async () => {
      const offer = await webrtcService.createOffer('participant-123');
      
      await expect(webrtcService.setRemoteDescription('non-existent', offer))
        .rejects.toThrow('Peer connection not found for participant: non-existent');
    });
  });

  describe('addTrack', () => {
    let peerConnection: RTCPeerConnection;
    let mockStream: MediaStream;

    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
      peerConnection = webrtcService.createPeerConnection('participant-123');
      
      // Create mock stream
      mockStream = new MediaStream();
      const mockVideoTrack = new MediaStreamTrack();
      const mockAudioTrack = new MediaStreamTrack();
      mockStream.addTrack(mockVideoTrack);
      mockStream.addTrack(mockAudioTrack);
    });

    it('should add tracks to peer connection', () => {
      webrtcService.addTrack('participant-123', mockStream);
      
      const senders = peerConnection.getSenders();
      expect(senders.length).toBeGreaterThan(0);
    });

    it('should throw error if peer connection not found', () => {
      expect(() => webrtcService.addTrack('non-existent', mockStream))
        .toThrow('Peer connection not found for participant: non-existent');
    });
  });

  describe('removeTrack', () => {
    let peerConnection: RTCPeerConnection;
    let mockStream: MediaStream;

    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
      peerConnection = webrtcService.createPeerConnection('participant-123');
      
      // Create mock stream and add tracks
      mockStream = new MediaStream();
      const mockVideoTrack = new MediaStreamTrack();
      const mockAudioTrack = new MediaStreamTrack();
      mockStream.addTrack(mockVideoTrack);
      mockStream.addTrack(mockAudioTrack);
      
      webrtcService.addTrack('participant-123', mockStream);
    });

    it('should remove tracks from peer connection', () => {
      webrtcService.removeTrack('participant-123', mockStream);
      
      const senders = peerConnection.getSenders();
      expect(senders.every(sender => sender.track === null)).toBe(true);
    });

    it('should throw error if peer connection not found', () => {
      expect(() => webrtcService.removeTrack('non-existent', mockStream))
        .toThrow('Peer connection not found for participant: non-existent');
    });
  });

  describe('getPeerConnections', () => {
    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
    });

    it('should return empty array when no peer connections exist', () => {
      expect(webrtcService.getPeerConnections()).toHaveLength(0);
    });

    it('should return all peer connections', () => {
      webrtcService.createPeerConnection('participant-1');
      webrtcService.createPeerConnection('participant-2');
      
      const connections = webrtcService.getPeerConnections();
      expect(connections).toHaveLength(2);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
      webrtcService.createPeerConnection('participant-1');
      webrtcService.createPeerConnection('participant-2');
    });

    it('should close all peer connections and reset state', () => {
      const connections = webrtcService.getPeerConnections();
      const closeSpy = jest.spyOn(connections[0], 'close');
      
      webrtcService.cleanup();
      
      expect(closeSpy).toHaveBeenCalled();
      expect(webrtcService.isInitialized()).toBe(false);
      expect(webrtcService.getPeerConnections()).toHaveLength(0);
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await webrtcService.initialize(mockRoom, mockParticipant);
    });

    it('should emit connection state change events', (done) => {
      const peerConnection = webrtcService.createPeerConnection('participant-123');
      
      webrtcService.on('connectionStateChange', (participantId, state) => {
        expect(participantId).toBe('participant-123');
        expect(state).toBe('connected');
        done();
      });

      // Simulate connection state change
      Object.defineProperty(peerConnection, 'connectionState', {
        value: 'connected',
        writable: true
      });
      
      peerConnection.dispatchEvent(new Event('connectionstatechange'));
    });

    it('should emit ice candidate events', (done) => {
      const peerConnection = webrtcService.createPeerConnection('participant-123');
      
      webrtcService.on('iceCandidate', (participantId, candidate) => {
        expect(participantId).toBe('participant-123');
        expect(candidate).toBeDefined();
        done();
      });

      // Simulate ICE candidate event
      const mockCandidate = {
        candidate: 'candidate:1 1 UDP 2113667326 192.168.1.100 54400 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0'
      };
      
      peerConnection.dispatchEvent(new RTCIceCandidateEvent('icecandidate', { candidate: mockCandidate }));
    });
  });
});
