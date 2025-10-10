import { DatabaseService } from './database.service';
import { Room, Participant, RoomModel, ParticipantModel } from '../models';

export interface CreateRoomData {
  name: string;
  maxParticipants: number;
  createdBy: string; // User ID of the room creator
  settings: {
    allowScreenShare: boolean;
    allowChat: boolean;
    allowCamera: boolean;
    allowMicrophone: boolean;
    recordingEnabled: boolean;
  };
}

export interface UpdateRoomData {
  name?: string;
  maxParticipants?: number;
  settings?: {
    allowScreenShare?: boolean;
    allowChat?: boolean;
    allowCamera?: boolean;
    allowMicrophone?: boolean;
    recordingEnabled?: boolean;
  };
}

export class RoomService {
  constructor(private databaseService: DatabaseService) {}

  private sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Check for malicious patterns first - if found, reject entirely
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /alert\s*\(/i,
      /document\./i,
      /window\./i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<link/i,
      /<meta/i,
      /<style/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(input)) {
        throw new Error('Potentially malicious room name detected');
      }
    }

    // If no malicious patterns, return sanitized version
    return input
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .trim();
  }

  private validateRoomName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Room name is required');
    }
    
    if (name.length < 2 || name.length > 100) {
      errors.push('Room name must be between 2 and 100 characters');
    }
    
    // Check for XSS patterns
    if (/<script|javascript:|on\w+\s*=/i.test(name)) {
      errors.push('Room name contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateRoomData(roomData: CreateRoomData): void {
    const nameValidation = this.validateRoomName(roomData.name);
    if (!nameValidation.isValid) {
      throw new Error(`Room validation failed: ${nameValidation.errors.join(', ')}`);
    }
    
    if (roomData.maxParticipants < 2 || roomData.maxParticipants > 100) {
      throw new Error('Max participants must be between 2 and 100');
    }
    
    if (!roomData.createdBy) {
      throw new Error('Room creator ID is required');
    }
  }

  /**
   * Check if user is authorized to access/modify room
   */
  private async checkRoomAuthorization(roomId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('rooms')
        .select('created_by')
        .eq('id', roomId)
        .single();
      
      if (error || !data) {
        return false; // Room doesn't exist
      }
      
      return data.created_by === userId;
    } catch (error) {
      console.error('Authorization check failed:', error);
      return false;
    }
  }

  /**
   * Create a new room
   */
  async createRoom(roomData: CreateRoomData): Promise<Room> {
    this.validateRoomData(roomData);

    try {
      // Sanitize room name
      const sanitizedName = this.sanitizeInput(roomData.name);

      // Use direct Supabase method for room creation
      const result = await this.databaseService.createRoomDirect({
        name: sanitizedName,
        maxParticipants: roomData.maxParticipants,
        settings: JSON.stringify(roomData.settings),
        createdBy: roomData.createdBy
      });

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to create room');
      }

      return RoomModel.fromEntity(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get room by ID (with optional authorization check)
   */
  async getRoom(roomId: string, requestingUserId?: string): Promise<Room | null> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !data) {
        return null;
      }

      const room = RoomModel.fromEntity(data);

      // If requestingUserId is provided, check authorization
      if (requestingUserId) {
        const isAuthorized = await this.checkRoomAuthorization(roomId, requestingUserId);
        if (!isAuthorized) {
          throw new Error('You can only modify rooms that you created');
        }
      }
      // Allow basic room access without authentication for public rooms
      // Authorization checks are enforced in update/delete operations

      return room;
    } catch (error) {
      throw new Error(`Failed to get room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update room (with authorization check)
   */
  async updateRoom(roomId: string, updateData: UpdateRoomData, requestingUserId?: string): Promise<Room> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    // Authorization check - only room creator can update
    if (requestingUserId) {
      const isAuthorized = await this.checkRoomAuthorization(roomId, requestingUserId);
      if (!isAuthorized) {
        throw new Error('You can only update rooms that you created');
      }
    } else {
      // For security tests, require requestingUserId for room updates
      throw new Error('Please log in to update rooms');
    }

    if (updateData.settings) {
      this.validateRoomSettings(updateData.settings);
    }

    try {
      const updateFields: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.name !== undefined) {
        updateFields.name = updateData.name;
      }

      if (updateData.maxParticipants !== undefined) {
        updateFields.max_participants = updateData.maxParticipants;
      }

      if (updateData.settings !== undefined) {
        updateFields.settings = JSON.stringify(updateData.settings);
      }

      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('rooms')
        .update(updateFields)
        .eq('id', roomId)
        .select()
        .single();

      if (error || !data) {
        throw new Error('Room not found');
      }

      return RoomModel.fromEntity(data);
    } catch (error) {
      throw new Error(`Failed to update room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete room (with authorization check)
   */
  async deleteRoom(roomId: string, requestingUserId?: string): Promise<void> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    // Authorization check - only room creator can delete
    if (requestingUserId) {
      const isAuthorized = await this.checkRoomAuthorization(roomId, requestingUserId);
      if (!isAuthorized) {
        throw new Error('You can only delete rooms that you created');
      }
    } else {
      // For security tests, require requestingUserId for room deletion
      throw new Error('Please log in to delete rooms');
    }

    try {
      const { error } = await (this.databaseService.getSupabaseClient() as any)
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) {
        throw new Error('Room not found');
      }
    } catch (error) {
      throw new Error(`Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get room participants
   */
  async getRoomParticipants(roomId: string): Promise<Participant[]> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_connected', true);

      if (error) {
        console.error('Supabase error in getRoomParticipants:', error);
        throw error;
      }

      return (data || []).map((row: any) => ParticipantModel.fromEntity(row));
    } catch (error) {
      throw new Error(`Failed to get room participants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get room messages
   */
  async getRoomMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select(`
          *,
          participants!inner(name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get room messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if room is full
   */
  async isRoomFull(roomId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Only count connected participants
    const participants = await this.getRoomParticipants(roomId);
    const connectedParticipants = participants.filter(p => p.isConnected);
    return connectedParticipants.length >= (room as any).maxParticipants;
  }

  /**
   * Get room statistics
   */
  async getRoomStatistics(roomId: string): Promise<{
    participantCount: number;
    messageCount: number;
    createdAt: Date;
    lastActivity: Date | null;
  }> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    try {
      // Get room creation date
      const { data: roomData, error: roomError } = await (this.databaseService.getSupabaseClient() as any)
        .from('rooms')
        .select('created_at')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        throw new Error('Room not found');
      }

      // Get participant count
      const { count: participantCount, error: participantError } = await (this.databaseService.getSupabaseClient() as any)
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('is_connected', true);

      if (participantError) {
        throw participantError;
      }

      // Get message count
      const { count: messageCount, error: messageError } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (messageError) {
        throw messageError;
      }

      // Get last activity (most recent message or room creation)
      const { data: lastMessage, error: lastMessageError } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select('created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastActivity = lastMessageError ? null : lastMessage?.created_at;

      return {
        participantCount: participantCount || 0,
        messageCount: messageCount || 0,
        createdAt: new Date(roomData.created_at),
        lastActivity: lastActivity ? new Date(lastActivity) : null
      };
    } catch (error) {
      throw new Error(`Failed to get room statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search rooms
   */
  async searchRooms(query: string, limit: number = 20, offset: number = 0): Promise<(Room & { participantCount: number })[]> {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid search query');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('rooms')
        .select(`
          *,
          participants!left(count)
        `)
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Get participant counts for each room
      const roomsWithCounts = await Promise.all(
        (data || []).map(async (room: any) => {
          const { count } = await (this.databaseService.getSupabaseClient() as any)
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_connected', true);

          return {
            ...RoomModel.fromEntity(room),
            participantCount: count || 0
          };
        })
      );

      return roomsWithCounts;
    } catch (error) {
      throw new Error(`Failed to search rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recent rooms with participant counts
   */
  async getRecentRooms(limit: number = 10): Promise<(Room & { participantCount: number })[]> {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    try {
      // Use direct Supabase client calls instead of complex SQL
      const supabase = this.databaseService.getSupabaseClient();
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (roomsError) {
        throw new Error(`Failed to get rooms: ${roomsError.message}`);
      }

      // Get participant counts for each room
      const roomsWithCounts = await Promise.all(
        (rooms || []).map(async (room: any) => {
          const { count, error: countError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_connected', true);

          if (countError) {
            console.error(`Failed to count participants for room ${room.id}:`, countError.message);
            return {
              ...RoomModel.fromEntity(room),
              participantCount: 0
            };
          }

          return {
            ...RoomModel.fromEntity(room),
            participantCount: count || 0
          };
        })
      );

      return roomsWithCounts;
    } catch (error) {
      throw new Error(`Failed to get recent rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate room settings
   */
  private validateRoomSettings(settings: any): void {
    const requiredSettings = ['allowScreenShare', 'allowChat', 'allowCamera', 'allowMicrophone', 'recordingEnabled'];
    
    for (const setting of requiredSettings) {
      if (settings[setting] !== undefined && typeof settings[setting] !== 'boolean') {
        throw new Error(`Setting ${setting} must be a boolean`);
      }
    }
  }
}
