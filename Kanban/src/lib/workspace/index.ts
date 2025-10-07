/**
 * Workspace module exports
 * Centralized exports for workspace functionality
 */

// Types
export type {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceData,
  UpdateWorkspaceData,
  WorkspaceResponse,
  WorkspaceMemberResponse,
} from './types';

// Services
export { WorkspaceService } from './services/workspaceService';

// Hooks
export { useWorkspace } from './hooks/useWorkspace';
export type { UseWorkspaceReturn } from './hooks/useWorkspace';

// Components
export { WorkspaceList } from './components/WorkspaceList';
export { CreateWorkspaceForm } from './components/CreateWorkspaceForm';
export { WorkspaceCard } from './components/WorkspaceCard';
