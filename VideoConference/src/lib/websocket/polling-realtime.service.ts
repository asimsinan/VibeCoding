import EventEmitter from 'events';

export interface PollingMessage {
  type: string;
  data: any;
}

export class PollingRealtimeService extends EventEmitter {
  private sessionId: string | null = null;
  private roomId: string | null = null;
  private participantId: string | null = null;
  private userId: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private baseUrl: string;
  private previousParticipants: Set<string> = new Set(); // Track previous participants for leave detection
  private previousRoomInfo: string | null = null; // Track previous room info to detect changes
  private previousMessagesHash: string | null = null; // Track previous messages to detect changes

  constructor() {
    super();
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SOCKETIO_URL || 'https://zuumcuk.vercel.app'
      : 'http://localhost:3000';
  }

  async connect(roomId: string, participantId: string, _participantName?: string, userId?: string): Promise<void> {
    this.roomId = roomId;
    this.participantId = participantId;
    this.userId = userId || null;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Send initial heartbeat
      await this.sendPollingRequest('heartbeat');
      
      this.isConnected = true;
      this.emit('connected');
      
      // Start polling for updates
      this.startPolling();
      
    } catch (error) {
      console.error('Failed to connect to polling service:', error);
      throw error;
    }
  }

  disconnect(): void {
    this.isConnected = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Clear all cached data to prevent stale state
    this.previousParticipants.clear();
    this.previousRoomInfo = null;
    this.previousMessagesHash = null;
    
    this.emit('disconnected');
  }

  private async sendPollingRequest(action: string, data: any = {}): Promise<any> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/realtime/poll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            roomId: this.roomId,
            participantId: this.participantId,
            userId: this.userId,
            action,
            ...data
          }),
        });

        if (!response.ok) {
          throw new Error(`Polling request failed: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.error(`Polling request error (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError;
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        // Poll for updates (signals, participants, messages, media state changes)
        const updatesResponse = await this.sendPollingRequest('poll-updates');
        if (updatesResponse.success) {
          const { signals, participants, mediaStateChanges } = updatesResponse.data;
          
          // Handle WebRTC signals
          if (signals && signals.length > 0) {
            signals.forEach((signal: any) => {
              this.emit('webrtc-signal', signal);
            });
          }
          
          // Handle participant updates with join/leave detection
          const currentParticipants = new Set<string>();
          
          if (participants && participants.length > 0) {
            participants.forEach((participant: any) => {
              currentParticipants.add(participant.id);
              
              // Emit participant-joined if this is a new participant
              if (!this.previousParticipants.has(participant.id)) {
                this.emit('participant-joined', {
                  participantId: participant.id,
                  participantName: participant.name,
                  userId: participant.userId
                });
              }
            });
          }
          
          // Detect participants who left
          this.previousParticipants.forEach(participantId => {
            if (!currentParticipants.has(participantId)) {
              this.emit('participant-left', {
                participantId: participantId
              });
            }
          });
          
          // Update previous participants for next comparison
          this.previousParticipants = currentParticipants;
          
          // Handle media state changes from other participants
          if (mediaStateChanges && mediaStateChanges.length > 0) {
            mediaStateChanges.forEach((change: any) => {
              this.emit('media-state-change', change);
            });
          }
        }

        // Poll for room info updates - only emit if changed
        const roomInfoResponse = await this.sendPollingRequest('get-room-info');
        if (roomInfoResponse.success) {
          const roomInfoHash = JSON.stringify(roomInfoResponse.data);
          if (roomInfoHash !== this.previousRoomInfo) {
            this.previousRoomInfo = roomInfoHash;
            this.emit('room-info', roomInfoResponse.data);
          }
        }

        // Poll for new messages - only emit if changed
        const messagesResponse = await this.sendPollingRequest('get-messages');
        if (messagesResponse.success) {
          const messagesHash = JSON.stringify(messagesResponse.data.messages);
          if (messagesHash !== this.previousMessagesHash) {
            this.previousMessagesHash = messagesHash;
            this.emit('messages', messagesResponse.data.messages);
          }
        }

        // Send heartbeat
        await this.sendPollingRequest('heartbeat');
        
      } catch (error) {
        console.error('Polling error:', error);
        this.emit('error', error);
      }
    }, 3000); // Poll every 3 seconds to reduce UI flickering
  }

  /**
   * Send WebRTC signal
   */
  sendSignal(to: string, signal: any, type: 'offer' | 'answer' | 'ice-candidate'): void {
    if (!this.isConnected) {
      console.warn('Polling service not connected, cannot send signal');
      return;
    }

    this.sendPollingRequest('send-signal', {
      targetParticipantId: to, // Changed from targetUserId to targetParticipantId
      signalType: type,
      signalData: signal
    }).catch(error => {
      console.error('Failed to send signal:', error);
    });
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
    if (!this.isConnected) {
      console.warn('Polling service not connected, cannot send media state change');
      return;
    }

    // Send media state change to other participants via polling API
    this.sendPollingRequest('media-state-change', {
      type,
      enabled,
      userId: this.userId,
      participantId: this.participantId, // Add participantId for proper matching
      timestamp: Date.now()
    }).catch(error => {
      console.error('Failed to send media state change:', error);
    });

    // Also emit locally for immediate UI update
    this.emit('media-state-change', {
      type,
      enabled,
      userId: this.userId,
      participantId: this.participantId, // Add participantId for consistency
      timestamp: Date.now()
    });
  }

  /**
   * Send custom message
   */
  send(message: PollingMessage): void {
    if (!this.isConnected) {
      console.warn('Polling service not connected, cannot send message');
      return;
    }

    // For polling-based system, we'll emit locally
    this.emit('message', message);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
