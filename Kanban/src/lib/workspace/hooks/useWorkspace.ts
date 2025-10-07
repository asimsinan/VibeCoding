/**
 * Workspace hook
 * Provides workspace state management and actions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkspaceService } from '../services/workspaceService';
import { 
  Workspace, 
  WorkspaceMember, 
  CreateWorkspaceData, 
  UpdateWorkspaceData, 
  WorkspaceResponse, 
  WorkspaceMemberResponse 
} from '../types';

export interface UseWorkspaceReturn {
  // State
  workspaces: Workspace[] | null;
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  createWorkspace: (data: CreateWorkspaceData) => Promise<WorkspaceResponse>;
  getWorkspace: (id: string) => Promise<WorkspaceResponse>;
  getUserWorkspaces: (userId: string, limit?: number) => Promise<WorkspaceResponse>;
  updateWorkspace: (id: string, data: UpdateWorkspaceData) => Promise<WorkspaceResponse>;
  deleteWorkspace: (id: string) => Promise<WorkspaceResponse>;
  addMember: (workspaceId: string, userId: string, role?: 'admin' | 'member') => Promise<WorkspaceMemberResponse>;
  removeMember: (workspaceId: string, userId: string) => Promise<WorkspaceMemberResponse>;
  updateMemberRole: (workspaceId: string, userId: string, role: 'admin' | 'member') => Promise<WorkspaceMemberResponse>;
  getWorkspaceMembers: (workspaceId: string) => Promise<WorkspaceMemberResponse>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  clearError: () => void;
}

export const useWorkspace = (): UseWorkspaceReturn => {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspaceService = new WorkspaceService();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createWorkspace = useCallback(async (data: CreateWorkspaceData): Promise<WorkspaceResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.createWorkspace(data);
      
      if (response.success && response.data) {
        setWorkspaces(prev => prev ? [...prev, response.data as any] : [response.data as any]);
        setCurrentWorkspace(response.data as any);
      } else {
        setError(response.error || 'Failed to create workspace');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  const getWorkspace = useCallback(async (id: string): Promise<WorkspaceResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.getWorkspace(id);
      
      if (response.success && response.data) {
        setCurrentWorkspace(response.data as any);
      } else {
        setError(response.error || 'Failed to get workspace');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  const getUserWorkspaces = useCallback(async (userId: string, limit: number = 50): Promise<WorkspaceResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.getUserWorkspaces(userId, limit);
      
      if (response.success && response.data) {
        setWorkspaces(response.data as any);
      } else {
        setError(response.error || 'Failed to get user workspaces');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  const updateWorkspace = useCallback(async (id: string, data: UpdateWorkspaceData): Promise<WorkspaceResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.updateWorkspace(id, data);
      
      if (response.success && response.data) {
        setWorkspaces(prev => 
          prev ? prev.map(w => w.id === id ? response.data as any : w) : null
        );
        setCurrentWorkspace(prev => prev?.id === id ? response.data as any : prev);
      } else {
        setError(response.error || 'Failed to update workspace');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  const deleteWorkspace = useCallback(async (id: string): Promise<WorkspaceResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.deleteWorkspace(id);
      
      if (response.success) {
        setWorkspaces(prev => prev ? prev.filter(w => w.id !== id) : null);
        setCurrentWorkspace(prev => prev?.id === id ? null : prev);
      } else {
        setError(response.error || 'Failed to delete workspace');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  const addMember = useCallback(async (workspaceId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<WorkspaceMemberResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.addMember(workspaceId, userId, role);
      
      if (response.success && response.data) {
        setMembers(prev => prev ? [...prev, response.data as any] : [response.data as any]);
      } else {
        setError(response.error || 'Failed to add member');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  const removeMember = useCallback(async (workspaceId: string, userId: string): Promise<WorkspaceMemberResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.removeMember(workspaceId, userId);
      
      if (response.success) {
        setMembers(prev => prev ? prev.filter(m => m.user_id !== userId) : null);
      } else {
        setError(response.error || 'Failed to remove member');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  const updateMemberRole = useCallback(async (workspaceId: string, userId: string, role: 'admin' | 'member'): Promise<WorkspaceMemberResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.updateMemberRole(workspaceId, userId, role);
      
      if (response.success && response.data) {
        setMembers(prev => 
          prev ? prev.map(m => m.user_id === userId ? response.data as any : m) : null
        );
      } else {
        setError(response.error || 'Failed to update member role');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  const getWorkspaceMembers = useCallback(async (workspaceId: string): Promise<WorkspaceMemberResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await workspaceService.getWorkspaceMembers(workspaceId);
      
      if (response.success && response.data) {
        setMembers(response.data as any);
      } else {
        setError(response.error || 'Failed to get workspace members');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [workspaceService]);

  return {
    // State
    workspaces,
    currentWorkspace,
    members,
    loading,
    error,

    // Actions
    createWorkspace,
    getWorkspace,
    getUserWorkspaces,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember,
    updateMemberRole,
    getWorkspaceMembers,
    setCurrentWorkspace,
    clearError,
  };
};
