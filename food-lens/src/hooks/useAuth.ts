/**
 * useAuth Hook
 * React hook for authentication operations
 * Uses AuthContext for global state management
 */

import { useAuthContext } from '@/contexts/AuthContext';

export interface UseAuthReturn {
  user: any;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  return useAuthContext();
};

