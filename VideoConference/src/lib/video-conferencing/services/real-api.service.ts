/**
 * Real API Service
 * Implements actual backend API services to replace mock APIs
 */

import { EventEmitter } from 'events';
import axios from 'axios';
import { Room, Participant, Message } from '../models';

export interface CreateRoomData {
  name: string;
  maxParticipants: number;
  settings: {
    allowScreenShare?: boolean;
    allowChat?: boolean;
    allowCamera?: boolean;
    allowMicrophone?: boolean;
    recordingEnabled?: boolean;
  };
}

export interface JoinRoomOptions {
  participantName: string;
  isHost?: boolean;
  mediaPermissions: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
  };
}

export interface MessageData {
  content: string;
  participantId: string;
  participantName: string;
  messageType: 'text' | 'system' | 'notification';
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface WebSocketConnectionResult {
  connected: boolean;
  error?: string;
}

export interface WebSocketMessageResult {
  success: boolean;
  error?: string;
}

export interface CreateRoomResult {
  room: Room;
  participant: Participant;
}

export interface JoinRoomResult {
  room: Room;
  participant: Participant;
}

export interface SendMessageResult {
  message: Message;
}

export class RealApiService extends EventEmitter {
  constructor() {
    super();
  }

  // Room Management
  async createRoom(roomData: CreateRoomData): Promise<CreateRoomResult> {
    try {
      // Validate input
      this.validateRoomData(roomData);

      const response = await axios.post('/api/rooms', roomData);
      return {
        room: response.data.room,
        participant: response.data.participant,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create room: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const response = await axios.get(`/api/rooms/${roomId}`);
      return response.data.room;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return null;
        }
        throw new Error(`Failed to get room: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to get room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateRoom(roomId: string, updateData: Partial<CreateRoomData>): Promise<Room> {
    try {
      const response = await axios.put(`/api/rooms/${roomId}`, updateData);
      return response.data.room;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to update room: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to update room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    try {
      await axios.delete(`/api/rooms/${roomId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to delete room: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Participant Management
  async joinRoom(roomId: string, options: JoinRoomOptions): Promise<JoinRoomResult> {
    try {
      const response = await axios.post(`/api/rooms/${roomId}/join`, options);
      return {
        room: response.data.room,
        participant: response.data.participant,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to join room: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRoomParticipants(roomId: string): Promise<Participant[]> {
    try {
      const response = await axios.get(`/api/rooms/${roomId}/participants`);
      return response.data.participants;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get room participants: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to get room participants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async leaveRoom(participantId: string): Promise<void> {
    try {
      await axios.post(`/api/rooms/${participantId}/leave`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to leave room: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to leave room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Message Management
  async sendMessage(roomId: string, messageData: MessageData): Promise<SendMessageResult> {
    try {
      const response = await axios.post(`/api/rooms/${roomId}/messages`, messageData);
      return { message: response.data.message };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to send message: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRoomMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const response = await axios.get(`/api/rooms/${roomId}/messages`, {
        params: { limit, offset }
      });
      return response.data.messages;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get room messages: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to get room messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility Methods
  private validateRoomData(roomData: CreateRoomData): void {
    if (!roomData.name || roomData.name.trim().length === 0) {
      throw new Error('Room name is required');
    }
    if (roomData.name.length > 100) {
      throw new Error('Room name must be 100 characters or less');
    }
    if (roomData.maxParticipants < 2 || roomData.maxParticipants > 100) {
      throw new Error('Max participants must be between 2 and 100');
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    try {
      // In a real implementation, this would clean up WebSocket connections
      this.removeAllListeners();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
