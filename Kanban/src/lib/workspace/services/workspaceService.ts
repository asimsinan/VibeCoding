/**
 * Workspace service
 * Handles all workspace business logic and Supabase integration
 */

import { createClient } from '@supabase/supabase-js';
import { 
  Workspace, 
  WorkspaceMember, 
  CreateWorkspaceData, 
  UpdateWorkspaceData, 
  WorkspaceResponse, 
  WorkspaceMemberResponse 
} from '../types';

export class WorkspaceService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Anon Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(data: CreateWorkspaceData): Promise<WorkspaceResponse> {
    try {
      // Validate input data
      if (!data.name || data.name.trim().length === 0) {
        return {
          success: false,
          data: null,
          error: 'Workspace name is required',
        };
      }

      if (data.name.length > 100) {
        return {
          success: false,
          data: null,
          error: 'Workspace name must be less than 100 characters',
        };
      }

      if (data.description && data.description.length > 500) {
        return {
          success: false,
          data: null,
          error: 'Description must be less than 500 characters',
        };
      }

      const { data: workspace, error } = await this.supabase
        .from('workspaces')
        .insert({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          created_by: data.created_by,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: workspace,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(id: string): Promise<WorkspaceResponse> {
    try {
      const { data: workspace, error } = await this.supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: workspace,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get user workspaces
   */
  async getUserWorkspaces(userId: string, limit: number = 50): Promise<WorkspaceResponse> {
    try {
      const { data: workspaces, error } = await this.supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: workspaces,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update workspace
   */
  async updateWorkspace(id: string, data: UpdateWorkspaceData): Promise<WorkspaceResponse> {
    try {
      // Validate input data
      if (data.name !== undefined) {
        if (!data.name || data.name.trim().length === 0) {
          return {
            success: false,
            data: null,
            error: 'Workspace name is required',
          };
        }

        if (data.name.length > 100) {
          return {
            success: false,
            data: null,
            error: 'Workspace name must be less than 100 characters',
          };
        }
      }

      if (data.description !== undefined && data.description && data.description.length > 500) {
        return {
          success: false,
          data: null,
          error: 'Description must be less than 500 characters',
        };
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }

      if (data.description !== undefined) {
        updateData.description = data.description?.trim() || null;
      }

      const { data: workspace, error } = await this.supabase
        .from('workspaces')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: workspace,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<WorkspaceResponse> {
    try {
      const { error } = await this.supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Add member to workspace
   */
  async addMember(workspaceId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<WorkspaceMemberResponse> {
    try {
      if (!['admin', 'member'].includes(role)) {
        return {
          success: false,
          data: null,
          error: 'Invalid member role',
        };
      }

      const { data: member, error } = await this.supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role: role,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: member,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<WorkspaceMemberResponse> {
    try {
      const { error } = await this.supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(workspaceId: string, userId: string, role: 'admin' | 'member'): Promise<WorkspaceMemberResponse> {
    try {
      if (!['admin', 'member'].includes(role)) {
        return {
          success: false,
          data: null,
          error: 'Invalid member role',
        };
      }

      const { data: member, error } = await this.supabase
        .from('workspace_members')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: member,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberResponse> {
    try {
      const { data: members, error } = await this.supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: members,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}
