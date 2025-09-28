/**
 * Mood Tracker API Client Library
 * 
 * Exports all API client components for external use.
 * 
 * @fileoverview Main export file for API client library
 * @author Mental Health Journal App
 * @version 1.0.0
 */

export { HttpClient, ApiError } from './HttpClient';
export { MoodApiClient } from './MoodApiClient';
export { useMoodApi } from './useMoodApi';
export { DataTransformService } from './DataTransformService';
export { CacheService } from './CacheService';
export { RealtimeService } from './RealtimeService';
export { OfflineSyncService } from './OfflineSyncService';

// Re-export types
export type { 
  HttpClientConfig, 
  RequestConfig, 
  ApiResponse 
} from './HttpClient';
export type { 
  MoodApiClientConfig, 
  CreateMoodEntryRequest, 
  UpdateMoodEntryRequest,
  GetMoodEntriesParams,
  GetTrendsParams,
  SyncResult,
  ApiStats
} from './MoodApiClient';
export type { 
  UseMoodApiOptions, 
  UseMoodApiReturn 
} from './useMoodApi';
export type {
  ApiMoodEntry,
  ApiUser,
  ApiMoodTrend
} from './DataTransformService';
export type {
  CacheEntry,
  CacheConfig
} from './CacheService';
export type {
  RealtimeConfig,
  RealtimeEvent,
  RealtimeSubscription
} from './RealtimeService';
export type {
  SyncOperation,
  ConflictResolution,
  Conflict
} from './OfflineSyncService';
export type { MoodEntry, User, MoodTrend } from '../../mood-core/models';
