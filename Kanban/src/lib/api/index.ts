/**
 * API Library Index
 * Centralized exports for all API functionality
 */

// Client and configuration
export { apiClient } from './client';
export { queryClient, queryKeys, cacheUtils, errorUtils } from './queryClient';

// Services
export { ApiService, getApiService, resetApiService } from './services/apiService';

// Hooks
export {
  useWorkspaces,
  useWorkspace,
  useBoards,
  useBoard,
  useBoardColumns,
  useTasks,
  useTask,
  useTaskSearch,
  useUserSearch,
  useAuthMutations,
  useWorkspaceMutations,
  useBoardMutations,
  useTaskMutations,
} from './hooks/useApiQueries';

// Providers
export { ApiProvider } from './providers/ApiProvider';

// Types
export type { ApiResponseData, ApiError } from '../../contracts/types/api.types';
