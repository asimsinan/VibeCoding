// Authentication Hook
// React hook for authentication state and operations

import { useAuth as useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
}
