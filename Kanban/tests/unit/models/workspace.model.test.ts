// Unit tests for Workspace model
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WorkspaceModel } from '@/lib/database/models/workspace.model';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

// Mock createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('WorkspaceModel', () => {
  let workspaceModel: WorkspaceModel;

  beforeEach(() => {
    workspaceModel = new WorkspaceModel('test-url', 'test-key');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getUserWorkspaces', () => {
    it('should return user workspaces with stats', async () => {
      const mockWorkspaces = [
        {
          id: 'workspace-1',
          name: 'Test Workspace 1',
          description: 'First test workspace',
          created_by: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          member_count: 3,
          recent_activity: '2024-01-02T00:00:00Z',
        },
        {
          id: 'workspace-2',
          name: 'Test Workspace 2',
          description: 'Second test workspace',
          created_by: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          member_count: 1,
          recent_activity: null,
        },
      ];

      mockSupabase.from().select().eq().order().mockResolvedValue({
        data: mockWorkspaces,
        error: null,
      });

      const result = await workspaceModel.getUserWorkspaces('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Workspace 1');
      expect(result[0].member_count).toBe(3);
      expect(mockSupabase.from).toHaveBeenCalledWith('workspaces');
    });

    it('should throw error when query fails', async () => {
      mockSupabase.from().select().eq().order().mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });

      await expect(workspaceModel.getUserWorkspaces('user-1')).rejects.toThrow(
        'Failed to get user workspaces: Query failed'
      );
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace when found', async () => {
      const mockWorkspace = {
        id: 'workspace-1',
        name: 'Test Workspace',
        description: 'A test workspace',
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      });

      const result = await workspaceModel.getWorkspace('workspace-1');

      expect(result).toEqual(mockWorkspace);
    });

    it('should return null when workspace not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await workspaceModel.getWorkspace('nonexistent-workspace');

      expect(result).toBeNull();
    });

    it('should throw error when query fails', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(workspaceModel.getWorkspace('workspace-1')).rejects.toThrow(
        'Failed to get workspace: Database error'
      );
    });
  });

  describe('createWorkspace', () => {
    it('should create workspace successfully', async () => {
      const workspaceData = {
        name: 'New Workspace',
        description: 'A new workspace',
        created_by: 'user-1',
      };

      const mockResponse = {
        id: 'workspace-1',
        ...workspaceData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await workspaceModel.createWorkspace(workspaceData);

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.from).toHaveBeenCalledWith('workspaces');
    });

    it('should throw error when creation fails', async () => {
      const workspaceData = {
        name: 'New Workspace',
        created_by: 'user-1',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Name already exists' },
      });

      await expect(workspaceModel.createWorkspace(workspaceData)).rejects.toThrow(
        'Failed to create workspace: Name already exists'
      );
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace successfully', async () => {
      const updates = {
        name: 'Updated Workspace',
        description: 'Updated description',
      };

      const mockResponse = {
        id: 'workspace-1',
        name: 'Updated Workspace',
        description: 'Updated description',
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await workspaceModel.updateWorkspace('workspace-1', updates);

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when update fails', async () => {
      const updates = { name: 'Updated Workspace' };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Workspace not found' },
      });

      await expect(workspaceModel.updateWorkspace('workspace-1', updates)).rejects.toThrow(
        'Failed to update workspace: Workspace not found'
      );
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace successfully', async () => {
      mockSupabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      await workspaceModel.deleteWorkspace('workspace-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('workspaces');
    });

    it('should throw error when deletion fails', async () => {
      mockSupabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: { message: 'Workspace not found' },
      });

      await expect(workspaceModel.deleteWorkspace('workspace-1')).rejects.toThrow(
        'Failed to delete workspace: Workspace not found'
      );
    });
  });

  describe('getWorkspaceMembers', () => {
    it('should return workspace members', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          workspace_id: 'workspace-1',
          user_id: 'user-1',
          role: 'admin',
          joined_at: '2024-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            email: 'admin@example.com',
            name: 'Admin User',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
        {
          id: 'member-2',
          workspace_id: 'workspace-1',
          user_id: 'user-2',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          user: {
            id: 'user-2',
            email: 'member@example.com',
            name: 'Member User',
            avatar_url: null,
          },
        },
      ];

      mockSupabase.from().select().eq().order().mockResolvedValue({
        data: mockMembers,
        error: null,
      });

      const result = await workspaceModel.getWorkspaceMembers('workspace-1');

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('admin');
      expect(result[1].role).toBe('member');
    });

    it('should throw error when query fails', async () => {
      mockSupabase.from().select().eq().order().mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });

      await expect(workspaceModel.getWorkspaceMembers('workspace-1')).rejects.toThrow(
        'Failed to get workspace members: Query failed'
      );
    });
  });

  describe('addMember', () => {
    it('should add member to workspace', async () => {
      const mockMember = {
        id: 'member-1',
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        role: 'member',
        joined_at: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
          avatar_url: null,
        },
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const result = await workspaceModel.addMember('workspace-1', 'user-1', 'member');

      expect(result).toEqual(mockMember);
    });

    it('should throw error when adding member fails', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'User already a member' },
      });

      await expect(workspaceModel.addMember('workspace-1', 'user-1')).rejects.toThrow(
        'Failed to add member to workspace: User already a member'
      );
    });
  });

  describe('removeMember', () => {
    it('should remove member from workspace', async () => {
      mockSupabase.from().delete().eq().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      await workspaceModel.removeMember('workspace-1', 'user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('workspace_members');
    });

    it('should throw error when removal fails', async () => {
      mockSupabase.from().delete().eq().eq().mockResolvedValue({
        data: null,
        error: { message: 'Member not found' },
      });

      await expect(workspaceModel.removeMember('workspace-1', 'user-1')).rejects.toThrow(
        'Failed to remove member from workspace: Member not found'
      );
    });
  });

  describe('hasAccess', () => {
    it('should return true when user has access', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { id: 'membership-1' },
        error: null,
      });

      const result = await workspaceModel.hasAccess('workspace-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false when user has no access', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await workspaceModel.hasAccess('workspace-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return user role when found', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      const result = await workspaceModel.getUserRole('workspace-1', 'user-1');

      expect(result).toBe('admin');
    });

    it('should return null when user has no membership', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await workspaceModel.getUserRole('workspace-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true when user is admin', async () => {
      jest.spyOn(workspaceModel, 'getUserRole').mockResolvedValue('admin');

      const result = await workspaceModel.isAdmin('workspace-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false when user is not admin', async () => {
      jest.spyOn(workspaceModel, 'getUserRole').mockResolvedValue('member');

      const result = await workspaceModel.isAdmin('workspace-1', 'user-1');

      expect(result).toBe(false);
    });
  });
});
