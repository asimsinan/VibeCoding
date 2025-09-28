/**
 * Mood Storage Library
 * 
 * Main entry point for the mood storage library.
 * Provides unified API for local and cloud storage with automatic sync.
 * 
 * @fileoverview Main library exports
 * @author Mental Health Journal App
 * @version 1.0.0
 */

// Main service exports
export { StorageService } from './services/StorageService';
export { DatabaseConnectionManager } from './services/DatabaseConnectionManager';
export { DatabaseConfigManager } from './config/DatabaseConfig';

// Adapter exports
export { IndexedDBAdapter } from './adapters/IndexedDBAdapter';
export { PostgresAdapter } from './adapters/PostgresAdapter';

// Type exports
export type { MoodEntry, User } from '../mood-core/models';
export type { PostgresConfig } from './adapters/PostgresAdapter';
export type { ConnectionConfig, ConnectionStatus } from './services/DatabaseConnectionManager';
export type { StorageOptions, StorageStats, SyncResult } from './services/StorageService';

// CLI export
export { StorageCLI } from './cli';

// Default export
export { StorageService as default } from './services/StorageService';
