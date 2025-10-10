/**
 * Socket.io Client Service for Video Conference Signaling
 * Handles real-time communication between participants
 */

import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface SocketMessage {
  type: string;
  data: any;
  from?: string;
  to?: string;
  roomId?: string;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  isConnected: boolean;
}

export class SocketIOService extends EventEmitter {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private participantId: string | null = null;
  private userId: string | null = null;
  private participantName: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor() {
    super();
  }

  /**
   * Connect to Socket.io server
   */
  async connect(roomId: string, participantId: string, participantName?: string, userId?: string): Promise<void> {
    this.roomId = roomId;
    this.participantId = participantId;
    this.userId = userId;
    this.participantName = participantName;

    return new Promise((resolve, reject) => {
      try {
        // Determine server URL based on environment
        const serverUrl = process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_SOCKETIO_URL || 'https://zuumcuk.vercel.app'
          : 'http://localhost:3001';


        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          
          // Send join message
          this.socket?.emit('join-room', {
            roomId,
            participantId,
            participantName: participantName || `Participant ${participantId}`,
            userId,
            timestamp: Date.now()
          });

          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected');

          // Attempt to reconnect if not a clean close
          if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.io connection error:', error);
          this.emit('error', error);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket.io error:', error);
          this.emit('error', error);
        });

        // Handle room events
        this.socket.on('room-info', (data) => {
          this.emit('room-info', data);
        });

        this.socket.on('participant-joined', (data) => {
          this.emit('participant-joined', data);
        });

        this.socket.on('participant-left', (data) => {
          this.emit('participant-left', data);
        });

        // Handle WebRTC signaling
        this.socket.on('webrtc-signal', (data) => {
          this.emit('webrtc-signal', data);
        });

        // Handle ping/pong
        this.socket.on('pong', (data) => {
        });

      } catch (error) {
        console.error('❌ Failed to create Socket.io connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      // Send leave message
      this.socket.emit('leave-room', {
        roomId: this.roomId,
        participantId: this.participantId,
        userId: this.userId,
        timestamp: Date.now()
      });

      // Disconnect
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.stopHeartbeat();
    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Send WebRTC signaling message
   */
  sendSignal(to: string, signal: any, type: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc-signal', {
        to,
        signal,
        type,
        from: this.userId,
        timestamp: Date.now()
      });
    } else {
      console.warn('Socket.io not connected, cannot send signal');
    }
  }

  /**
   * Send WebRTC offer
   */
  sendOffer(to: string, offer: RTCSessionDescriptionInit): void {
    this.sendSignal(to, offer, 'offer');
  }

  /**
   * Send WebRTC answer
   */
  sendAnswer(to: string, answer: RTCSessionDescriptionInit): void {
    this.sendSignal(to, answer, 'answer');
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(to: string, candidate: RTCIceCandidateInit): void {
    this.sendSignal(to, candidate, 'ice-candidate');
  }

  /**
   * Send media state change notification
   */
  sendMediaStateChange(type: 'camera' | 'microphone' | 'screen', enabled: boolean): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('media-state-change', {
        type,
        enabled,
        userId: this.userId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Send custom message
   */
  send(message: SocketMessage): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('message', message);
    } else {
      console.warn('Socket.io not connected, cannot send message:', message);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;

    setTimeout(() => {
      if (this.roomId && this.participantId) {
        this.connect(this.roomId, this.participantId, this.participantName, this.userId).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, this.reconnectInterval);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get current room ID
   */
  getCurrentRoomId(): string | null {
    return this.roomId;
  }

  /**
   * Get current participant ID
   */
  getCurrentParticipantId(): string | null {
    return this.participantId;
  }
}
