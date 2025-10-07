/**
 * API Initialization
 * Centralized API client initialization to avoid circular dependencies
 */

import { createApiClient } from './client/apiClient';

// Initialize API client with default configuration
let apiClient: ReturnType<typeof createApiClient> | null = null;

export function initializeApiClient() {
  if (!apiClient) {
    apiClient = createApiClient({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
    });
  }
  return apiClient;
}

export function getInitializedApiClient() {
  if (!apiClient) {
    throw new Error('API client not initialized. Call initializeApiClient() first.');
  }
  return apiClient;
}
