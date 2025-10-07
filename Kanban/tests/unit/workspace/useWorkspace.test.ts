/**
 * Unit tests for useWorkspace hook
 * Tests workspace state management and Supabase integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import { useWorkspace } from '../../../src/lib/workspace/hooks/useWorkspace';

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

describe('useWorkspace Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useWorkspace('workspace-123'));
      
      expect(result.current.workspace).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Workspace Loading', () => {
    it('should load workspace successfully', async () => {
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.workspace).toEqual(mockWorkspace);
      expect(result.current.error).toBeNull();
    });

    it('should handle workspace loading error', async () => {
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.workspace).toBeNull();
      expect(result.current.error).toBe('Workspace not found');
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await act(async () => {
        await result.current.updateWorkspace({
          name: 'Updated Workspace',
          description: 'Updated description',
        });
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        name: 'Updated Workspace',
        description: 'Updated description',
        updated_at: expect.any(String),
      });

      expect(result.current.workspace).toEqual(mockWorkspace);
      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await act(async () => {
        await result.current.updateWorkspace({
          name: 'Updated Workspace',
        });
      });

      expect(result.current.error).toBe('Update failed');
    });

    it('should validate workspace name before update', async () => {
      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await act(async () => {
        await result.current.updateWorkspace({
          name: '',
        });
      });

      expect(result.current.error).toContain('Workspace name is required');
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await act(async () => {
        await result.current.deleteWorkspace();
      });

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(result.current.workspace).toBeNull();
      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await act(async () => {
        await result.current.deleteWorkspace();
      });

      expect(result.current.error).toBe('Delete failed');
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await act(async () => {
        await result.current.addMember('user-456', 'member');
      });

      expect(mockQuery.insert).toHaveBeenCalledWith({
        workspace_id: 'workspace-123',
        user_id: 'user-456',
        role: 'member',
      });

      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await act(async () => {
        await result.current.removeMember('user-456');
      });

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await act(async () => {
        await result.current.updateMemberRole('user-456', 'admin');
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        role: 'admin',
        updated_at: expect.any(String),
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear error when new operation starts', async () => {
      const { result } = renderHook(() => useWorkspace('workspace-123'));

      // Set an error first
      act(() => {
        result.current.setError('Previous error');
      });

      expect(result.current.error).toBe('Previous error');

      // Start new operation
      act(() => {
        result.current.updateWorkspace({ name: 'New Name' });
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useWorkspace('workspace-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Network error');
    });
  });
});
