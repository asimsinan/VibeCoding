/**
 * Unit tests for workspace service
 * Tests workspace business logic and Supabase integration
 */

import { WorkspaceService } from '../../../src/lib/workspace/services/workspaceService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      order: jest.fn(() => ({
        limit: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('WorkspaceService', () => {
  let workspaceService: WorkspaceService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    workspaceService = new WorkspaceService();
  });

  describe('Workspace Creation', () => {
    it('should create workspace with valid data', async () => {
      const mockWorkspace = {
        id: 'workspace-123',
        name: 'Test Workspace',
        description: 'A test workspace',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockWorkspace,
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.createWorkspace({
        name: 'Test Workspace',
        description: 'A test workspace',
        created_by: 'user-123',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith({
        name: 'Test Workspace',
        description: 'A test workspace',
        created_by: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorkspace);
      expect(result.error).toBeNull();
    });

    it('should handle workspace creation error', async () => {
      const mockError = { message: 'Creation failed' };

      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.createWorkspace({
        name: 'Test Workspace',
        description: 'A test workspace',
        created_by: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Creation failed');
    });

    it('should validate workspace name before creation', async () => {
      const result = await workspaceService.createWorkspace({
        name: '',
        description: 'A test workspace',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Workspace name is required');
    });

    it('should validate workspace name length', async () => {
      const longName = 'a'.repeat(101);

      const result = await workspaceService.createWorkspace({
        name: longName,
        description: 'A test workspace',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Workspace name must be less than 100 characters');
    });

    it('should validate description length', async () => {
      const longDescription = 'a'.repeat(501);

      const result = await workspaceService.createWorkspace({
        name: 'Test Workspace',
        description: longDescription,
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Description must be less than 500 characters');
    });
  });

  describe('Workspace Retrieval', () => {
    it('should get workspace by ID', async () => {
      const mockWorkspace = {
        id: 'workspace-123',
        name: 'Test Workspace',
        description: 'A test workspace',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockWorkspace,
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.getWorkspace('workspace-123');

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'workspace-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorkspace);
      expect(result.error).toBeNull();
    });

    it('should handle workspace not found error', async () => {
      const mockError = { message: 'Workspace not found' };

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.getWorkspace('workspace-123');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Workspace not found');
    });

    it('should get user workspaces', async () => {
      const mockWorkspaces = [
        {
          id: 'workspace-123',
          name: 'Test Workspace 1',
          description: 'A test workspace',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          created_by: 'user-123',
        },
        {
          id: 'workspace-456',
          name: 'Test Workspace 2',
          description: 'Another test workspace',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          created_by: 'user-123',
        },
      ];

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: mockWorkspaces,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.getUserWorkspaces('user-123', 10);

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('created_by', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorkspaces);
      expect(result.error).toBeNull();
    });
  });

  describe('Workspace Updates', () => {
    it('should update workspace successfully', async () => {
      const mockWorkspace = {
        id: 'workspace-123',
        name: 'Updated Workspace',
        description: 'Updated description',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockWorkspace,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.updateWorkspace('workspace-123', {
        name: 'Updated Workspace',
        description: 'Updated description',
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        name: 'Updated Workspace',
        description: 'Updated description',
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorkspace);
      expect(result.error).toBeNull();
    });

    it('should handle workspace update error', async () => {
      const mockError = { message: 'Update failed' };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.updateWorkspace('workspace-123', {
        name: 'Updated Workspace',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('Workspace Deletion', () => {
    it('should delete workspace successfully', async () => {
      const mockQuery = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.deleteWorkspace('workspace-123');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'workspace-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle workspace deletion error', async () => {
      const mockError = { message: 'Delete failed' };

      const mockQuery = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.deleteWorkspace('workspace-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('Member Management', () => {
    it('should add member to workspace', async () => {
      const mockMember = {
        id: 'member-123',
        workspace_id: 'workspace-123',
        user_id: 'user-456',
        role: 'member',
        created_at: '2023-01-01T00:00:00Z',
      };

      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockMember,
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.addMember('workspace-123', 'user-456', 'member');

      expect(mockQuery.insert).toHaveBeenCalledWith({
        workspace_id: 'workspace-123',
        user_id: 'user-456',
        role: 'member',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMember);
      expect(result.error).toBeNull();
    });

    it('should remove member from workspace', async () => {
      const mockQuery = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.removeMember('workspace-123', 'user-456');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-456');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should update member role', async () => {
      const mockMember = {
        id: 'member-123',
        workspace_id: 'workspace-123',
        user_id: 'user-456',
        role: 'admin',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockMember,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.updateMemberRole('workspace-123', 'user-456', 'admin');

      expect(mockQuery.update).toHaveBeenCalledWith({
        role: 'admin',
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMember);
      expect(result.error).toBeNull();
    });

    it('should validate member role', async () => {
      const result = await workspaceService.addMember('workspace-123', 'user-456', 'invalid-role');

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid member role');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.getWorkspace('workspace-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle unexpected errors', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue('Unexpected error'),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await workspaceService.getWorkspace('workspace-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('An unexpected error occurred');
    });
  });
});
