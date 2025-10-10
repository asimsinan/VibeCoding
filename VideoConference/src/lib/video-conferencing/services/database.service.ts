/**
 * Database Service
 * Handles database connections using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
// Redis import removed - Redis is disabled

// Database configuration interface (simplified for Supabase)
export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

// Default database configuration
const DEFAULT_DB_CONFIG: DatabaseConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

/**
 * Database Service Class
 * Manages Supabase connections (Redis disabled for simplicity)
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private supabase: ReturnType<typeof createClient>;
  private connected: boolean = false;

  private constructor(config: DatabaseConfig = DEFAULT_DB_CONFIG) {
    // Initialize Supabase client
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase environment variables are not set');
    }

    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: DatabaseConfig): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(config);
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database connections
   */
  public async initialize(): Promise<void> {
    // Skip initialization if already connected
    if (this.connected) {
      return;
    }

    try {
      // Test Supabase connection
      const { error } = await this.supabase.from('user').select('count').limit(1);
      if (error && error.code !== 'PGRST116') { // Table doesn't exist yet
        throw error;
      }

      this.connected = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Direct room creation using Supabase client
   */
  async createRoomDirect(roomData: {
    name: string;
    maxParticipants: number;
    settings: string;
    createdBy: string;
  }): Promise<any> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('rooms')
        .insert({
          name: roomData.name,
          max_participants: roomData.maxParticipants,
          settings: roomData.settings,
          created_by: roomData.createdBy
        })
        .select();
      
      if (error) {
        console.error('Direct room creation error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from room creation');
      }
      
      return { rows: data };
    } catch (error) {
      console.error('Room creation failed:', error);
      throw error;
    }
  }

  /**
   * Direct participant creation using Supabase client
   */
  async createParticipantDirect(participantData: {
    roomId: string;
    userId?: string;
    name: string;
    mediaPermissions?: string;
    isConnected?: boolean;
    connectionState?: string;
    joinedAt?: string;
    lastSeen?: string;
  }): Promise<any> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('participants')
        .insert({
          room_id: participantData.roomId,
          user_id: participantData.userId || null,
          name: participantData.name,
          media_permissions: participantData.mediaPermissions || '{}',
          is_connected: participantData.isConnected !== undefined ? participantData.isConnected : true,
          connection_state: participantData.connectionState || 'connected',
          last_seen: participantData.lastSeen || new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Direct participant creation error:', error);
        throw error;
      }
      
      return { rows: data || [] };
    } catch (error) {
      console.error('Participant creation failed:', error);
      throw error;
    }
  }

  /**
   * Direct cleanup of stale participants using Supabase client
   */
  async cleanupStaleParticipantsDirect(): Promise<{staleMarked: number, staleDeleted: number}> {
    try {
      // Mark participants as disconnected if they haven't been seen for 30 seconds
      const staleQuery = (this.supabase as any)
        .from('participants')
        .update({ 
          is_connected: false, 
          connection_state: 'disconnected' 
        })
        .eq('is_connected', true)
        .lt('last_seen', new Date(Date.now() - 30 * 1000).toISOString())
        .select();

      const { data: staleData, error: staleError } = await staleQuery;
      if (staleError) {
        console.error('Stale participants update error:', staleError);
        throw staleError;
      }

      // Delete participants that have been disconnected for more than 5 minutes
      const deleteQuery = (this.supabase as any)
        .from('participants')
        .delete()
        .eq('is_connected', false)
        .lt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .select();

      const { data: deleteData, error: deleteError } = await deleteQuery;
      if (deleteError) {
        console.error('Stale participants delete error:', deleteError);
        throw deleteError;
      }

      return {
        staleMarked: staleData?.length || 0,
        staleDeleted: deleteData?.length || 0
      };
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get Supabase client
   */
  public getSupabaseClient() {
    return this.supabase;
  }

  /**
   * Check if service is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    this.connected = false;
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();