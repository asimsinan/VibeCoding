// Workspace data model for Kanban application
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Workspace schema
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Workspace with member count and recent activity
export const WorkspaceWithStatsSchema = WorkspaceSchema.extend({
  member_count: z.number().int().min(1),
  recent_activity: z.string().datetime().optional(),
});

// Workspace member schema
export const WorkspaceMemberSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'member', 'viewer']),
  joined_at: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    avatar_url: z.string().url().optional(),
  }),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceWithStats = z.infer<typeof WorkspaceWithStatsSchema>;
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

// Workspace model class
export class WorkspaceModel {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get all workspaces for a user
   */
  async getUserWorkspaces(userId: string): Promise<WorkspaceWithStats[]> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members!inner(user_id),
        member_count:workspace_members(count),
        recent_activity:user_activities(created_at)
      `)
      .eq('workspace_members.user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user workspaces: ${error.message}`);
    }

    return data.map((workspace: any) => WorkspaceWithStatsSchema.parse({
      ...workspace,
      member_count: workspace.member_count || 1,
      recent_activity: workspace.recent_activity?.[0]?.created_at,
    }));
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Workspace not found
      }
      throw new Error(`Failed to get workspace: ${error.message}`);
    }

    return WorkspaceSchema.parse(data);
  }

  /**
   * Create new workspace
   */
  async createWorkspace(workspaceData: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>): Promise<Workspace> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .insert(workspaceData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    return WorkspaceSchema.parse(data);
  }

  /**
   * Update workspace
   */
  async updateWorkspace(workspaceId: string, updates: Partial<Omit<Workspace, 'id' | 'created_at' | 'updated_at'>>): Promise<Workspace> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workspace: ${error.message}`);
    }

    return WorkspaceSchema.parse(data);
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    const { error } = await this.supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) {
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }
  }

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select(`
        *,
        user:profiles(id, email, name, avatar_url)
      `)
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get workspace members: ${error.message}`);
    }

    return data.map((member: any) => WorkspaceMemberSchema.parse(member));
  }

  /**
   * Add member to workspace
   */
  async addMember(workspaceId: string, userId: string, role: 'admin' | 'member' | 'viewer' = 'member'): Promise<WorkspaceMember> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role,
      })
      .select(`
        *,
        user:profiles(id, email, name, avatar_url)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to add member to workspace: ${error.message}`);
    }

    return WorkspaceMemberSchema.parse(data);
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove member from workspace: ${error.message}`);
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(workspaceId: string, userId: string, role: 'admin' | 'member' | 'viewer'): Promise<WorkspaceMember> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select(`
        *,
        user:profiles(id, email, name, avatar_url)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return WorkspaceMemberSchema.parse(data);
  }

  /**
   * Check if user has access to workspace
   */
  async hasAccess(workspaceId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
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
  async getUserRole(workspaceId: string, userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No membership
      }
      throw new Error(`Failed to get user role: ${error.message}`);
    }

    return data.role;
  }

  /**
   * Check if user is admin of workspace
   */
  async isAdmin(workspaceId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRole(workspaceId, userId);
    return role === 'admin';
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    member_count: number;
    board_count: number;
    task_count: number;
    recent_activity: string | null;
  }> {
    const [membersResult, boardsResult, tasksResult, activityResult] = await Promise.all([
      this.supabase
        .from('workspace_members')
        .select('id', { count: 'exact' })
        .eq('workspace_id', workspaceId),
      this.supabase
        .from('boards')
        .select('id', { count: 'exact' })
        .eq('workspace_id', workspaceId),
      this.supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('board_id', workspaceId),
      this.supabase
        .from('user_activities')
        .select('created_at')
        .eq('entity_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ]);

    if (membersResult.error) {
      throw new Error(`Failed to get member count: ${membersResult.error.message}`);
    }
    if (boardsResult.error) {
      throw new Error(`Failed to get board count: ${boardsResult.error.message}`);
    }
    if (tasksResult.error) {
      throw new Error(`Failed to get task count: ${tasksResult.error.message}`);
    }

    return {
      member_count: membersResult.count || 0,
      board_count: boardsResult.count || 0,
      task_count: tasksResult.count || 0,
      recent_activity: activityResult.data?.created_at || null,
    };
  }
}
