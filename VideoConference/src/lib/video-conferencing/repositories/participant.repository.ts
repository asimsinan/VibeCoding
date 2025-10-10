import { BaseRepository } from './base.repository';
import { DatabaseService } from '../services/database.service';
import { CreateParticipant, UpdateParticipant } from '../models';
import { Participant } from '../models/participant.model';

export class ParticipantRepository extends BaseRepository<Participant, CreateParticipant, UpdateParticipant> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      tableName: 'participants',
      primaryKey: 'id'
    });
  }

  /**
   * Map database row to Participant entity
   */
  protected mapRowToEntity(row: any): Participant {
    // Convert snake_case mediaPermissions from database to camelCase for model
    const dbMediaPermissions = row.media_permissions || {
      camera: false,
      microphone: false,
      screen_share: false
    };
    
    const mediaPermissions = {
      camera: dbMediaPermissions.camera,
      microphone: dbMediaPermissions.microphone,
      screenShare: dbMediaPermissions.screen_share // Convert to camelCase
    };

    return {
      id: row.id,
      roomId: row.room_id,
      name: row.name,
      isConnected: row.is_connected,
      connectionState: row.connection_state,
      mediaPermissions,
      joinedAt: row.last_seen, // Use last_seen as joined_at since joined_at doesn't exist
      lastSeen: row.last_seen,
      clientInfo: row.client_info || {},
      ...(row.webrtc_peer_id && { webrtcPeerId: row.webrtc_peer_id })
    };
  }

  /**
   * Map create data to entity data
   */
  protected mapCreateDataToEntity(data: CreateParticipant): Record<string, any> {
    // Convert camelCase mediaPermissions to snake_case for database constraint
    const mediaPermissions = data.mediaPermissions || {
      camera: false,
      microphone: false,
      screenShare: false
    };
    
    const dbMediaPermissions = {
      camera: mediaPermissions.camera,
      microphone: mediaPermissions.microphone,
      screen_share: mediaPermissions.screenShare // Convert to snake_case
    };

    return {
      room_id: data.roomId,
      user_id: (data as any).userId, // Add user_id field
      name: data.name,
      is_connected: (data as any).isConnected !== undefined ? (data as any).isConnected : true,
      connection_state: 'connected',
      media_permissions: JSON.stringify(dbMediaPermissions),
      last_seen: new Date().toISOString() // Convert to ISO string
    };
  }

  /**
   * Map update data to entity data
   */
  protected mapUpdateDataToEntity(data: UpdateParticipant): Record<string, any> {
    const entityData: Record<string, any> = {};

    if (data.name !== undefined) {
      entityData.name = data.name;
    }

    if (data.isConnected !== undefined) {
      entityData.is_connected = data.isConnected;
    }

    if (data.connectionState !== undefined) {
      entityData.connection_state = data.connectionState;
    }

    if (data.mediaPermissions !== undefined) {
      // Convert camelCase to snake_case for database constraint
      const dbMediaPermissions = {
        camera: data.mediaPermissions.camera,
        microphone: data.mediaPermissions.microphone,
        screen_share: data.mediaPermissions.screenShare
      };
      entityData.media_permissions = JSON.stringify(dbMediaPermissions);
    }

    return entityData;
  }

  /**
   * Find participants by room ID
   */
  async findByRoomId(roomId: string): Promise<Participant[]> {
    return this.findAll({ room_id: roomId }, 'last_seen ASC');
  }

  /**
   * Find connected participants by room ID
   */
  async findConnectedByRoomId(roomId: string): Promise<Participant[]> {
    return this.findAll({ 
      room_id: roomId, 
      is_connected: true 
    }, 'last_seen ASC');
  }

  /**
   * Find host by room ID
   */
  async findHostByRoomId(roomId: string): Promise<Participant | null> {
    return this.findOne({ 
      room_id: roomId, 
      is_host: true 
    });
  }

  /**
   * Find participant by name in room
   */
  async findByNameInRoom(roomId: string, name: string): Promise<Participant | null> {
    return this.findOne({ 
      room_id: roomId, 
      name: name 
    });
  }

  /**
   * Update connection state
   */
  async updateConnectionState(id: string, isConnected: boolean, connectionState: string): Promise<Participant | null> {
    const { data, error } = await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .update({
        is_connected: isConnected,
        connection_state: connectionState,
        last_seen: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      return null;
    }

    return this.mapRowToEntity(data);
  }

  /**
   * Override update method to not use updated_at column
   */
  override async update(id: string, data: UpdateParticipant): Promise<Participant | null> {
    const updateData = this.mapUpdateDataToEntity(data);
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    const { data: result, error } = await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .update(updateData)
      .eq(this.primaryKey, id)
      .select()
      .single();
    
    if (error || !result) {
      return null;
    }

    return this.mapRowToEntity(result);
  }

  /**
   * Update media permissions
   */
  async updateMediaPermissions(id: string, mediaPermissions: any): Promise<Participant | null> {
    const { data, error } = await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .update({
        media_permissions: JSON.stringify(mediaPermissions)
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      return null;
    }

    return this.mapRowToEntity(data);
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(id: string): Promise<void> {
    await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .update({
        last_seen: new Date().toISOString()
      })
      .eq('id', id);
  }

  /**
   * Get participant count by room ID
   */
  async getCountByRoomId(roomId: string): Promise<number> {
    return this.count({ room_id: roomId });
  }

  /**
   * Get connected participant count by room ID
   */
  async getConnectedCountByRoomId(roomId: string): Promise<number> {
    return this.count({ 
      room_id: roomId, 
      is_connected: true 
    });
  }

  /**
   * Disconnect all participants in room
   */
  async disconnectAllInRoom(roomId: string): Promise<void> {
    await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .update({
        is_connected: false,
        connection_state: 'disconnected'
      })
      .eq('room_id', roomId);
  }

  /**
   * Remove all participants from room
   */
  async removeAllFromRoom(roomId: string): Promise<void> {
    await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .delete()
      .eq('room_id', roomId);
  }

  /**
   * Find participants by connection state
   */
  async findByConnectionState(connectionState: string, limit: number = 50): Promise<Participant[]> {
    return this.findAll({ 
      connection_state: connectionState 
    }, 'last_seen DESC', limit);
  }

  /**
   * Find inactive participants (not seen for specified minutes)
   */
  async findInactive(minutes: number = 30): Promise<Participant[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    const { data, error } = await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .select('*')
      .lt('last_seen', cutoffTime)
      .order('last_seen', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => this.mapRowToEntity(row));
  }

  /**
   * Clean up inactive participants
   */
  async cleanupInactive(minutes: number = 60): Promise<number> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    const { data, error } = await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .delete()
      .lt('last_seen', cutoffTime)
      .select();

    if (error) {
      throw error;
    }

    return data?.length || 0;
  }

  /**
   * Transfer host role to another participant
   */
  async transferHost(fromId: string, toId: string): Promise<boolean> {
    try {
      // Remove host role from current host
      await (this.databaseService.getSupabaseClient() as any)
        .from(this.tableName)
        .update({ is_host: false })
        .eq('id', fromId);
      
      // Assign host role to new participant
      await (this.databaseService.getSupabaseClient() as any)
        .from(this.tableName)
        .update({ is_host: true })
        .eq('id', toId);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get participant statistics by room
   */
  async getStatisticsByRoom(roomId: string): Promise<{
    totalParticipants: number;
    connectedParticipants: number;
    disconnectedParticipants: number;
    hostCount: number;
  }> {
    // Get total participants
    const { count: totalCount, error: totalError } = await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    if (totalError) {
      throw totalError;
    }

    // Get connected participants
    const { count: connectedCount, error: connectedError } = await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_connected', true);

    if (connectedError) {
      throw connectedError;
    }

    // Get host count
    const { count: hostCount, error: hostError } = await (this.databaseService.getSupabaseClient() as any)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_host', true);

    if (hostError) {
      throw hostError;
    }

    const total = totalCount || 0;
    const connected = connectedCount || 0;
    const hosts = hostCount || 0;
    
    return {
      totalParticipants: total,
      connectedParticipants: connected,
      disconnectedParticipants: total - connected,
      hostCount: hosts
    };
  }

  /**
   * Update last seen timestamp for all participants in a room
   */
  async updateLastSeenForRoom(roomId: string): Promise<void> {
    await (this.databaseService.getSupabaseClient() as any)
      .from('participants')
      .update({
        last_seen: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .eq('is_connected', true);
  }

  /**
   * Create a new participant using direct Supabase method
   */
  override async create(data: CreateParticipant): Promise<Participant> {
    const entityData = this.mapCreateDataToEntity(data);
    
    const result = await this.databaseService.createParticipantDirect({
      roomId: entityData.room_id,
      userId: entityData.user_id,
      name: entityData.name,
      mediaPermissions: entityData.media_permissions,
      isConnected: entityData.is_connected,
      connectionState: entityData.connection_state,
      joinedAt: entityData.last_seen, // Use last_seen as joined_at since joined_at doesn't exist
      lastSeen: entityData.last_seen
    });
    
    return this.mapRowToEntity(result.rows[0]);
  }
}
