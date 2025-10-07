// User data model for Kanban application
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatar_url: z.string().url().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      task_assigned: z.boolean().default(true),
      task_due: z.boolean().default(true),
      task_completed: z.boolean().default(false),
    }),
  }).default({
    notifications: {
      email: true,
      push: true,
      task_assigned: true,
      task_due: true,
      task_completed: false,
    },
  }),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// User model class
export class UserModel {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to get user profile: ${error.message}`);
    }

    return UserProfileSchema.parse(data);
  }

  /**
   * Create user profile
   */
  async createProfile(profileData: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return UserProfileSchema.parse(data);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return UserProfileSchema.parse(data);
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to delete user profile: ${error.message}`);
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data.map((user: any) => UserProfileSchema.parse(user));
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get user activity: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserProfile['preferences']>): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ preferences })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }

    return UserProfileSchema.parse(data);
  }

  /**
   * Get user's workspace memberships
   */
  async getWorkspaceMemberships(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select(`
        *,
        workspace:workspaces(*)
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get workspace memberships: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if user has access to workspace
   */
  async hasWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select('id')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // No access
      }
      throw new Error(`Failed to check workspace access: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get user's role in workspace
   */
  async getWorkspaceRole(userId: string, workspaceId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No membership
      }
      throw new Error(`Failed to get workspace role: ${error.message}`);
    }

    return data.role;
  }
}
