/**
 * Workspace types and interfaces
 * Defines all workspace-related data structures and types
 */

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
  created_by: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
}

export interface WorkspaceResponse {
  success: boolean;
  data?: Workspace | Workspace[] | null;
  error?: string | null;
}

export interface WorkspaceMemberResponse {
  success: boolean;
  data?: WorkspaceMember | WorkspaceMember[] | null;
  error?: string | null;
}

export interface WorkspaceState {
  workspace: Workspace | null;
  members: WorkspaceMember[];
  loading: boolean;
  error: string | null;
}

export interface WorkspaceError {
  message: string;
  code?: string;
  status?: number;
}
