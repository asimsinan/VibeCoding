/**
 * API Query Hooks
 * React Query hooks for all API endpoints with proper caching and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiService } from '../services/apiService';
import { queryKeys, cacheUtils, errorUtils } from '../queryClient';
import { 
  transformWorkspaces, 
  transformBoards, 
  transformColumns, 
  transformTasks, 
  transformUsers 
} from '../transformers/dataTransformers';

// Auth Query Hooks
// Note: getCurrentUser method not implemented in API service yet

// Workspace Query Hooks
export const useWorkspaces = () => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: async () => {
      // Since API service methods throw errors, we'll use direct fetch
      const response = await fetch('/api/v1/workspaces');
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      return response.json();
    },
    select: (response) => response.data ? transformWorkspaces(response.data) : [],
  });
};

export const useWorkspace = (id: string, enabled: boolean = true) => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.workspaces.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/v1/workspaces/${id}`);
      if (!response.ok) throw new Error('Failed to fetch workspace');
      return response.json();
    },
    select: (response) => response.data,
    enabled: enabled && !!id,
  });
};

// Board Query Hooks
export const useBoards = (workspaceId: string, enabled: boolean = true) => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.boards.list(workspaceId),
    queryFn: async () => {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/boards`);
      if (!response.ok) throw new Error('Failed to fetch boards');
      return response.json();
    },
    select: (response) => response.data ? transformBoards(response.data) : [],
    enabled: enabled && !!workspaceId,
  });
};

export const useBoard = (id: string, enabled: boolean = true) => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.boards.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/v1/boards/${id}`);
      if (!response.ok) throw new Error('Failed to fetch board');
      return response.json();
    },
    select: (response) => response.data,
    enabled: enabled && !!id,
  });
};

export const useBoardColumns = (boardId: string, enabled: boolean = true) => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.boards.columns(boardId),
    queryFn: async () => {
      const response = await fetch(`/api/v1/boards/${boardId}`);
      if (!response.ok) throw new Error('Failed to fetch board columns');
      return response.json();
    },
    select: (response) => response.data ? transformColumns(response.data.columns || []) : [],
    enabled: enabled && !!boardId,
  });
};

// Task Query Hooks
export const useTasks = (boardId: string, filters?: any, enabled: boolean = true) => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.tasks.list(boardId, filters),
    queryFn: async () => {
      const response = await fetch(`/api/v1/boards/${boardId}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    select: (response) => response.data ? transformTasks(response.data) : [],
    enabled: enabled && !!boardId,
  });
};

export const useTask = (id: string, enabled: boolean = true) => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/v1/tasks/${id}`);
      if (!response.ok) throw new Error('Failed to fetch task');
      return response.json();
    },
    select: (response) => response.data,
    enabled: enabled && !!id,
  });
};

export const useTaskSearch = (query: string, boardId?: string, enabled: boolean = true) => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.tasks.search(query, boardId),
    queryFn: async () => {
      const response = await fetch(`/api/v1/boards/${boardId || ''}/tasks?search=${query}`);
      if (!response.ok) throw new Error('Failed to search tasks');
      return response.json();
    },
    select: (response) => response.data,
    enabled: enabled && !!query && query.length > 2,
  });
};

// User Query Hooks
export const useUserSearch = (query: string, enabled: boolean = true) => {
  const apiService = getApiService();
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: async () => {
      const response = await fetch(`/api/v1/users?search=${query}`);
      if (!response.ok) throw new Error('Failed to search users');
      return response.json();
    },
    select: (response) => response.data ? transformUsers(response.data) : [],
    enabled: enabled && !!query && query.length > 2,
  });
};

// Note: useUserProfile hook removed - getProfile method not implemented in API service

// Mutation Hooks
export const useAuthMutations = () => {
  const queryClient = useQueryClient();

  const apiService = getApiService();
  const signUpMutation = useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name: string }) =>
      apiService.auth.register({ email, password, name }),
    onSuccess: (response) => {
      if (response.data) {
        // Set auth token
        const token = response.data.session?.access_token;
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
      }
    },
  });

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiService.auth.login({ email, password }),
    onSuccess: (response) => {
      if (response.data) {
        // Set auth token
        const token = response.data.session?.access_token;
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: () => apiService.auth.logout(),
    onSuccess: () => {
      // Clear auth token
      localStorage.removeItem('auth_token');
      // Clear all cached data
      queryClient.clear();
    },
  });

  return {
    signUp: signUpMutation,
    signIn: signInMutation,
    signOut: signOutMutation,
  };
};

export const useWorkspaceMutations = () => {
  const queryClient = useQueryClient();
  const apiService = getApiService();

  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiService.workspaces.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      apiService.workspaces.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id: string) => apiService.workspaces.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });

  return {
    createWorkspace: createWorkspaceMutation,
    updateWorkspace: updateWorkspaceMutation,
    deleteWorkspace: deleteWorkspaceMutation,
  };
};

export const useBoardMutations = () => {
  const queryClient = useQueryClient();
  const apiService = getApiService();

  const createBoardMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; workspace_id: string }) =>
      apiService.boards.create(data.workspace_id, data),
    onSuccess: (_, { workspace_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.list(workspace_id) });
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string } }) =>
      apiService.boards.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(id) });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (id: string) => apiService.boards.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    },
  });

  return {
    createBoard: createBoardMutation,
    updateBoard: updateBoardMutation,
    deleteBoard: deleteBoardMutation,
  };
};

export const useTaskMutations = () => {
  const queryClient = useQueryClient();
  const apiService = getApiService();

  const createTaskMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      board_id: string;
      column_id: string;
      position: number;
      status: 'todo' | 'in_progress' | 'done' | 'archived';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      assignee_id?: string;
      due_date?: string;
    }) => apiService.tasks.create(data.board_id, data),
    onSuccess: (_, { board_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(board_id) });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiService.tasks.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      // Also invalidate task lists to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiService.tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, columnId, position }: { taskId: string; columnId: string; position: number }) =>
      apiService.tasks.move(taskId, { column_id: columnId, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });

  return {
    createTask: createTaskMutation,
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation,
    moveTask: moveTaskMutation,
  };
};
