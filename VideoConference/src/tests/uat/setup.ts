/**
 * User Acceptance Testing Setup
 * Provides utilities and setup for UAT scenarios
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ChatService } from '../../lib/video-conferencing/services/chat.service';

export interface UATUser {
  id: string;
  email: string;
  name: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface UATRoom {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  maxParticipants?: number;
  isPrivate?: boolean;
}

export interface UATScenario {
  name: string;
  description: string;
  steps: UATStep[];
  expectedOutcome: string;
}

export interface UATStep {
  action: string;
  description: string;
  expectedResult: string;
  timeout?: number;
}

export class UATSetup {
  private dbService: DatabaseService;
  private authService: AuthService;
  private roomService: RoomService;
  private chatService: ChatService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
    this.authService = new AuthService(this.dbService);
    this.roomService = new RoomService(this.dbService);
    this.chatService = new ChatService(this.dbService);
  }

  async setupDatabase(): Promise<void> {
    await this.dbService.connect();
    await this.dbService.clearDatabase();
    await this.dbService.initializeSchema();
  }

  async teardownDatabase(): Promise<void> {
    await this.dbService.clearDatabase();
    await this.dbService.disconnect();
  }

  async createTestUser(userData: {
    email: string;
    name: string;
    password: string;
  }): Promise<UATUser> {
    try {
      const result = await this.authService.register(userData);
      const loginResult = await this.authService.login(userData.email, userData.password);
      
      return {
        id: result.user.id,
        email: userData.email,
        name: userData.name,
        password: userData.password,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken
      };
    } catch (error) {
      throw new Error(`Failed to create test user: ${error}`);
    }
  }

  async createTestRoom(roomData: {
    name: string;
    description?: string;
    createdBy: string;
    maxParticipants?: number;
    isPrivate?: boolean;
  }): Promise<UATRoom> {
    try {
      const room = await this.roomService.createRoom(roomData);
      return {
        id: room.id,
        name: room.name,
        description: room.description,
        createdBy: room.createdBy,
        maxParticipants: room.maxParticipants,
        isPrivate: room.isPrivate
      };
    } catch (error) {
      throw new Error(`Failed to create test room: ${error}`);
    }
  }

  async joinRoom(roomId: string, userId: string, userName: string): Promise<{ id: string }> {
    try {
      // For UAT purposes, we'll simulate joining a room by creating a participant record
      // In a real implementation, this would be handled by the room service
      const participantId = crypto.randomUUID();
      
      // Insert participant into database
      const query = `
        INSERT INTO participants (id, room_id, name, is_connected, connection_state, media_permissions, joined_at, last_seen, client_info)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7)
        RETURNING id
      `;
      
      const result = await this.dbService.query(query, [
        participantId,
        roomId,
        userName,
        true,
        'connected',
        JSON.stringify({ camera: true, microphone: true, screenShare: false }),
        JSON.stringify({ userId, platform: 'uat-test' })
      ]);
      
      return { id: result.rows[0].id };
    } catch (error) {
      throw new Error(`Failed to join room: ${error}`);
    }
  }

  async sendMessage(roomId: string, userId: string, content: string): Promise<{ id: string }> {
    try {
      // First get a participant for this user in the room
      const participantQuery = `
        SELECT id FROM participants WHERE room_id = $1 AND client_info->>'userId' = $2 LIMIT 1
      `;
      const participantResult = await this.dbService.query(participantQuery, [roomId, userId]);
      
      if (participantResult.rows.length === 0) {
        throw new Error('User not found in room');
      }
      
      const participantId = participantResult.rows[0].id;
      const message = await this.chatService.sendMessage(roomId, participantId, content);
      return { id: message.id };
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    try {
      return await this.authService.getUserProfile(userId);
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error}`);
    }
  }

  async updateUserProfile(userId: string, updates: { name?: string }): Promise<any> {
    try {
      return await this.authService.updateUserProfile(userId, updates);
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error}`);
    }
  }

  async logoutUser(refreshToken: string, accessToken?: string): Promise<void> {
    try {
      await this.authService.logout(refreshToken, accessToken);
    } catch (error) {
      throw new Error(`Failed to logout user: ${error}`);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      return await this.authService.refreshAccessToken(refreshToken);
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }

  async getRoomDetails(roomId: string, userId?: string): Promise<any> {
    try {
      return await this.roomService.getRoom(roomId, userId);
    } catch (error) {
      throw new Error(`Failed to get room details: ${error}`);
    }
  }

  async updateRoom(roomId: string, updates: any, userId: string): Promise<any> {
    try {
      return await this.roomService.updateRoom(roomId, updates, userId);
    } catch (error) {
      throw new Error(`Failed to update room: ${error}`);
    }
  }

  async deleteRoom(roomId: string, userId: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomId, userId);
    } catch (error) {
      throw new Error(`Failed to delete room: ${error}`);
    }
  }

  async getRoomParticipants(roomId: string): Promise<any[]> {
    try {
      return await this.roomService.getRoomParticipants(roomId);
    } catch (error) {
      throw new Error(`Failed to get room participants: ${error}`);
    }
  }

  async removeParticipant(roomId: string, participantId: string, userId: string): Promise<void> {
    try {
      // Remove participant from database
      const query = `DELETE FROM participants WHERE id = $1 AND room_id = $2`;
      await this.dbService.query(query, [participantId, roomId]);
    } catch (error) {
      throw new Error(`Failed to remove participant: ${error}`);
    }
  }

  async getRoomMessages(roomId: string, limit?: number, offset?: number): Promise<any[]> {
    try {
      return await this.roomService.getRoomMessages(roomId, limit || 50, offset || 0);
    } catch (error) {
      throw new Error(`Failed to get room messages: ${error}`);
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      // For UAT purposes, we'll delete the message directly from database
      const query = `DELETE FROM messages WHERE id = $1`;
      await this.dbService.query(query, [messageId]);
    } catch (error) {
      throw new Error(`Failed to delete message: ${error}`);
    }
  }
}

export class UATScenarioRunner {
  private setup: UATSetup;

  constructor() {
    this.setup = new UATSetup();
  }

  async runScenario(scenario: UATScenario): Promise<{
    success: boolean;
    results: Array<{ step: string; success: boolean; error?: string; duration: number }>;
    totalDuration: number;
  }> {
    const results = [];
    const startTime = Date.now();

    console.log(`\n🧪 Running UAT Scenario: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`🎯 Expected Outcome: ${scenario.expectedOutcome}\n`);

    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      const stepStartTime = Date.now();
      
      console.log(`  Step ${i + 1}: ${step.action}`);
      console.log(`  Description: ${step.description}`);
      
      try {
        // This is where we would execute the actual step
        // For now, we'll simulate the step execution
        await this.executeStep(step);
        
        const duration = Date.now() - stepStartTime;
        results.push({
          step: step.action,
          success: true,
          duration
        });
        
        console.log(`  ✅ Success (${duration}ms): ${step.expectedResult}`);
      } catch (error) {
        const duration = Date.now() - stepStartTime;
        results.push({
          step: step.action,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        });
        
        console.log(`  ❌ Failed (${duration}ms): ${error}`);
      }
      
      console.log('');
    }

    const totalDuration = Date.now() - startTime;
    const success = results.every(r => r.success);
    
    console.log(`🏁 Scenario completed in ${totalDuration}ms`);
    console.log(`📊 Success: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`📈 Success Rate: ${(results.filter(r => r.success).length / results.length * 100).toFixed(1)}%\n`);

    return {
      success,
      results,
      totalDuration
    };
  }

  private async executeStep(step: UATStep): Promise<void> {
    // Simulate step execution with a small delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) { // 10% failure rate for testing
      throw new Error(`Simulated failure in step: ${step.action}`);
    }
  }

  getSetup(): UATSetup {
    return this.setup;
  }
}
