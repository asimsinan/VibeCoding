import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
// WebRTCService and WebSocketService removed - they're client-side only
import { RoomService } from './room.service';
import { ChatService } from './chat.service';
import { RepositoryFactory } from '../repositories/repository.factory';
import { Room, Participant } from '../models';

export interface VideoConferencingConfig {
  websocketUrl: string;
  iceServers?: RTCIceServer[];
  maxParticipants?: number;
  enableScreenShare?: boolean;
  enableChat?: boolean;
  enableRecording?: boolean;
}

export interface MediaPermissions {
  camera: boolean;
  microphone: boolean;
  screenShare: boolean;
}

export interface MediaState {
  camera: boolean;
  microphone: boolean;
  screenShare: boolean;
}

/**
 * Simplified VideoConferencingService - WebRTC and WebSocket functionality moved to client-side
 * This service now only handles room and participant management
 */
export class VideoConferencingService extends EventEmitter {
  // WebRTC and WebSocket services removed - they're client-side only
  private roomService: RoomService;
  private chatService: ChatService;
  private repositoryFactory: RepositoryFactory;
  private config: VideoConferencingConfig;
  private currentRoom: Room | null = null;
  private currentParticipant: Participant | null = null;
  private isInitialized: boolean = false;

  constructor(
    // WebRTC and WebSocket services removed - they're client-side only
    roomService: RoomService,
    chatService: ChatService,
    repositoryFactory: RepositoryFactory,
    config: VideoConferencingConfig
  ) {
    super();
    // WebRTC and WebSocket services removed
    this.roomService = roomService;
    this.chatService = chatService;
    this.repositoryFactory = repositoryFactory;
    this.config = config;
  }

  /**
   * Initialize the video conferencing service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Services don't need explicit initialization - they're ready to use
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      throw new Error(`Failed to initialize video conferencing service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new room
   */
  async createRoom(options: {
    name: string;
    maxParticipants?: number;
    settings?: any;
    participantName?: string;
    createdBy?: string;
  }): Promise<{ room: Room; participant?: Participant }> {
    if (!this.isInitialized) {
      throw new Error('Video conferencing service not initialized');
    }

    try {
      const roomData = {
        name: options.name,
        maxParticipants: options.maxParticipants || this.config.maxParticipants || 2,
        createdBy: options.createdBy || randomUUID(),
        settings: options.settings || {
          allowScreenShare: this.config.enableScreenShare || true,
          allowChat: this.config.enableChat || true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: this.config.enableRecording || false
        }
      };
      
      const room = await this.roomService.createRoom(roomData);
      this.currentRoom = room;
      
      // Don't create participant during room creation - wait until user actually joins
      // This prevents showing participant count of 1 when no one has joined yet
      
      this.emit('room-created', room);
      
      // Return just the room without participant
      return { room };
    } catch (error) {
      throw new Error(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Join a room
   */
  async joinRoom(roomId: string, participantName: string, userId?: string, mediaPermissions?: MediaPermissions): Promise<Participant> {
    if (!this.isInitialized) {
      throw new Error('Video conferencing service not initialized');
    }

    try {
      // Get the room
      const room = await this.roomService.getRoom(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Check room capacity
      const participants = await this.repositoryFactory.getParticipantRepository().findByRoomId(roomId);
      const connectedParticipants = participants.filter((p: any) => p.isConnected);
      
      if (connectedParticipants.length >= (this.config.maxParticipants || 2)) {
        throw new Error('Room is at maximum capacity');
      }

      // Create participant
      const participantData = {
        name: participantName,
        roomId: roomId,
        userId: userId || 'anonymous',
        isConnected: true,
        mediaPermissions: mediaPermissions || {
          camera: true,
          microphone: true,
          screenShare: false
        },
        clientInfo: {}
      };

      const participant = await this.repositoryFactory.getParticipantRepository().create(participantData);

      this.currentRoom = room;
      this.currentParticipant = participant;
      
      this.emit('participant-joined', participant);
      return participant;
    } catch (error) {
      throw new Error(`Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentParticipant) {
      return;
    }

    try {
      // Mark participant as disconnected
      await this.repositoryFactory.getParticipantRepository().update(this.currentParticipant.id, {
        isConnected: false
      });

      this.emit('participant-left', this.currentParticipant);
      
      this.currentParticipant = null;
      this.currentRoom = null;
    } catch (error) {
      throw new Error(`Failed to leave room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a chat message
   */
  async sendMessage(content: string): Promise<void> {
    if (!this.currentRoom || !this.currentParticipant) {
      throw new Error('Not in a room');
    }

    try {
      await this.chatService.sendMessage(this.currentRoom.id, this.currentParticipant.id, content);
      this.emit('message-sent', { content, participant: this.currentParticipant });
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current room
   */
  getCurrentRoom(): Room | null {
    return this.currentRoom;
  }

  /**
   * Get current participant
   */
  getCurrentParticipant(): Participant | null {
    return this.currentParticipant;
  }

  /**
   * Get configuration
   */
  getConfig(): VideoConferencingConfig {
    return this.config;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup and disconnect
   */
  async cleanup(): Promise<void> {
    try {
      if (this.currentParticipant) {
        await this.leaveRoom();
      }
      
      this.removeAllListeners();
      this.isInitialized = false;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}





