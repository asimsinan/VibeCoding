/**
 * API Service - Service layer for all API operations
 * FR-001: API-First Design - Service layer implementation
 */

import { createClient } from '@supabase/supabase-js';
import {
  PaginationParams,
  BaseFilter,
  LoginRequest,
  SignupRequest,
  RefreshTokenRequest,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  CreateBoardRequest,
  UpdateBoardRequest,
  BoardDetailResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  AuthResponse,
  WorkspaceListResponse,
  WorkspaceResponse,
  BoardListResponse,
  BoardResponse,
  TaskListResponse,
  TaskResponse,
  UserSearchResponse,
} from '../../../contracts/types/api.types';

export class ApiService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Authentication endpoints
  auth = {
    login: async (data: LoginRequest) => {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: {
          user: {
            id: authData.user?.id || '',
            email: authData.user?.email || '',
            name: authData.user?.user_metadata?.name || '',
            created_at: authData.user?.created_at || '',
            avatar_url: authData.user?.user_metadata?.avatar_url,
          },
          session: {
            access_token: authData.session?.access_token || '',
            refresh_token: authData.session?.refresh_token || '',
            expires_at: authData.session?.expires_at || 0,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      };
    },

    register: async (data: SignupRequest) => {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: {
          user: {
            id: authData.user?.id || '',
            email: authData.user?.email || '',
            name: authData.user?.user_metadata?.name || '',
            created_at: authData.user?.created_at || '',
            avatar_url: authData.user?.user_metadata?.avatar_url,
          },
          session: {
            access_token: authData.session?.access_token || '',
            refresh_token: authData.session?.refresh_token || '',
            expires_at: authData.session?.expires_at || 0,
          },
        },
        status: 201,
        statusText: 'Created',
        headers: {},
      };
    },

    logout: async () => {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      return {
        data: undefined,
        status: 200,
        statusText: 'OK',
        headers: {},
      };
    },

    refresh: async (data: RefreshTokenRequest) => {
      const { data: authData, error } = await this.supabase.auth.refreshSession({
        refresh_token: data.refresh_token,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: {
          user: {
            id: authData.user?.id || '',
            email: authData.user?.email || '',
            name: authData.user?.user_metadata?.name || '',
            created_at: authData.user?.created_at || '',
            avatar_url: authData.user?.user_metadata?.avatar_url,
          },
          session: {
            access_token: authData.session?.access_token || '',
            refresh_token: authData.session?.refresh_token || '',
            expires_at: authData.session?.expires_at || 0,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      };
    },
  };

  // Workspace endpoints
  workspaces = {
    list: async (params?: PaginationParams) => {
      throw new Error('Workspace endpoints not implemented yet');
    },

    get: async (id: string) => {
      throw new Error('Workspace endpoints not implemented yet');
    },

    create: async (data: CreateWorkspaceRequest) => {
      throw new Error('Workspace endpoints not implemented yet');
    },

    update: async (id: string, data: UpdateWorkspaceRequest) => {
      throw new Error('Workspace endpoints not implemented yet');
    },

    delete: async (id: string) => {
      throw new Error('Workspace endpoints not implemented yet');
    },
  };

  // Board endpoints
  boards = {
    list: async (workspaceId: string, params?: PaginationParams) => {
      throw new Error('Board endpoints not implemented yet');
    },

    get: async (id: string) => {
      throw new Error('Board endpoints not implemented yet');
    },

    create: async (workspaceId: string, data: CreateBoardRequest) => {
      throw new Error('Board endpoints not implemented yet');
    },

    update: async (id: string, data: UpdateBoardRequest) => {
      throw new Error('Board endpoints not implemented yet');
    },

    delete: async (id: string, permanent = false) => {
      throw new Error('Board endpoints not implemented yet');
    },
  };

  // Task endpoints
  tasks = {
    list: async (boardId: string, params?: BaseFilter) => {
      throw new Error('Task endpoints not implemented yet');
    },

    get: async (id: string) => {
      throw new Error('Task endpoints not implemented yet');
    },

    create: async (boardId: string, data: CreateTaskRequest) => {
      throw new Error('Task endpoints not implemented yet');
    },

    update: async (id: string, data: UpdateTaskRequest) => {
      throw new Error('Task endpoints not implemented yet');
    },

    delete: async (id: string) => {
      throw new Error('Task endpoints not implemented yet');
    },

    move: async (id: string, data: MoveTaskRequest) => {
      throw new Error('Task endpoints not implemented yet');
    },
  };

  // User endpoints
  users = {
    search: async (params: BaseFilter) => {
      throw new Error('User endpoints not implemented yet');
    },
  };
}

// Singleton instance
let apiServiceInstance: ApiService | null = null;

export function getApiService(): ApiService {
  if (!apiServiceInstance) {
    apiServiceInstance = new ApiService();
  }
  return apiServiceInstance;
}

export function resetApiService(): void {
  apiServiceInstance = null;
}