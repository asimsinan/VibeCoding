/**
 * Database Configuration
 * 
 * Centralized configuration management for database connections.
 * Handles environment variables, validation, and default values.
 * 
 * @fileoverview Database configuration management
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { ConnectionConfig } from '../services/DatabaseConnectionManager';
import { PostgresConfig } from '../adapters/PostgresAdapter';

export interface EnvironmentConfig {
  // Database URLs
  DATABASE_URL?: string;
  POSTGRES_HOST?: string;
  POSTGRES_PORT?: string;
  POSTGRES_DB?: string;
  POSTGRES_USER?: string;
  POSTGRES_PASSWORD?: string;
  POSTGRES_SSL?: string;
  
  // Encryption
  ENCRYPTION_KEY?: string;
  
  // Next.js
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;
  
  // App
  NODE_ENV?: string;
  NEXT_PUBLIC_APP_URL?: string;
  
  // Cloud Sync
  CLOUD_SYNC_ENABLED?: string;
  CLOUD_SYNC_URL?: string;
  CLOUD_SYNC_API_KEY?: string;
  
  // Analytics
  ANALYTICS_ENABLED?: string;
  GOOGLE_ANALYTICS_ID?: string;
  
  // Performance
  MAX_CONNECTIONS?: string;
  CONNECTION_TIMEOUT?: string;
  IDLE_TIMEOUT?: string;
}

export class DatabaseConfigManager {
  private static instance: DatabaseConfigManager;
  private config: ConnectionConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseConfigManager {
    if (!DatabaseConfigManager.instance) {
      DatabaseConfigManager.instance = new DatabaseConfigManager();
    }
    return DatabaseConfigManager.instance;
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): ConnectionConfig {
    const env = process.env as EnvironmentConfig;
    
    // Generate encryption key if not provided
    const encryptionKey = env.ENCRYPTION_KEY || this.generateEncryptionKey();
    
    // Parse PostgreSQL configuration
    const postgresConfig = this.parsePostgresConfig(env);
    
    // Parse retry configuration
    const retryConfig = this.parseRetryConfig(env);
    
    return {
      indexedDB: {
        name: 'MoodTrackerDB',
        version: 1,
        encryptionKey,
      },
      postgres: postgresConfig,
      userId: this.getUserId(),
      retryConfig,
    };
  }

  /**
   * Parse PostgreSQL configuration from environment
   */
  private parsePostgresConfig(env: EnvironmentConfig): PostgresConfig | undefined {
    // Check if cloud sync is enabled
    const cloudSyncEnabled = env.CLOUD_SYNC_ENABLED === 'true';
    if (!cloudSyncEnabled) {
      return undefined;
    }

    // Parse DATABASE_URL if provided
    if (env.DATABASE_URL) {
      return this.parseDatabaseUrl(env.DATABASE_URL);
    }

    // Parse individual PostgreSQL environment variables
    const host = env.POSTGRES_HOST || 'localhost';
    const port = parseInt(env.POSTGRES_PORT || '5432', 10);
    const database = env.POSTGRES_DB || 'moodtracker';
    const username = env.POSTGRES_USER;
    const password = env.POSTGRES_PASSWORD;
    const ssl = env.POSTGRES_SSL === 'true';

    if (!username || !password) {
      console.warn('PostgreSQL credentials not provided, cloud sync disabled');
      return undefined;
    }

    return {
      host,
      port,
      database,
      username,
      password,
      ssl,
      maxConnections: parseInt(env.MAX_CONNECTIONS || '10', 10),
      connectionTimeout: parseInt(env.CONNECTION_TIMEOUT || '30000', 10),
      idleTimeout: parseInt(env.IDLE_TIMEOUT || '300000', 10),
      encryptionKey: env.ENCRYPTION_KEY || this.generateEncryptionKey(),
    };
  }

  /**
   * Parse DATABASE_URL format
   */
  private parseDatabaseUrl(databaseUrl: string): PostgresConfig {
    try {
      const url = new URL(databaseUrl);
      
      return {
        host: url.hostname,
        port: parseInt(url.port || '5432', 10),
        database: url.pathname.slice(1), // Remove leading slash
        username: url.username,
        password: url.password,
        ssl: url.protocol === 'postgresql+ssl:' || url.searchParams.get('sslmode') === 'require',
        maxConnections: 10,
        connectionTimeout: 30000,
        idleTimeout: 300000,
        encryptionKey: process.env.ENCRYPTION_KEY || this.generateEncryptionKey(),
      };
    } catch (error) {
      throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse retry configuration
   */
  private parseRetryConfig(env: EnvironmentConfig) {
    return {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    };
  }

  /**
   * Generate a random encryption key
   */
  private generateEncryptionKey(): string {
    // Generate a 32-character random string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get or generate user ID
   */
  private getUserId(): string {
    // In a real app, this would come from authentication
    // For now, generate a persistent user ID
    let userId = localStorage.getItem('moodtracker_user_id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('moodtracker_user_id', userId);
    }
    return userId;
  }

  /**
   * Get current configuration
   */
  public getConfig(): ConnectionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Validate configuration
   */
  public validateConfig(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate IndexedDB config
    if (!this.config.indexedDB.name) {
      errors.push('IndexedDB name is required');
    }

    if (!this.config.indexedDB.encryptionKey) {
      errors.push('Encryption key is required');
    } else if (this.config.indexedDB.encryptionKey.length < 16) {
      errors.push('Encryption key must be at least 16 characters long');
    }

    // Validate PostgreSQL config if present
    if (this.config.postgres) {
      if (!this.config.postgres.host) {
        errors.push('PostgreSQL host is required');
      }

      if (!this.config.postgres.username) {
        errors.push('PostgreSQL username is required');
      }

      if (!this.config.postgres.password) {
        errors.push('PostgreSQL password is required');
      }

      if (this.config.postgres.port < 1 || this.config.postgres.port > 65535) {
        errors.push('PostgreSQL port must be between 1 and 65535');
      }

      if (this.config.postgres.maxConnections < 1) {
        warnings.push('PostgreSQL max connections should be at least 1');
      }

      if (this.config.postgres.connectionTimeout < 1000) {
        warnings.push('PostgreSQL connection timeout should be at least 1000ms');
      }
    }

    // Validate retry config
    if (this.config.retryConfig.maxRetries < 0) {
      errors.push('Max retries must be non-negative');
    }

    if (this.config.retryConfig.baseDelay < 100) {
      warnings.push('Base delay should be at least 100ms');
    }

    if (this.config.retryConfig.maxDelay < this.config.retryConfig.baseDelay) {
      errors.push('Max delay must be greater than or equal to base delay');
    }

    if (this.config.retryConfig.backoffMultiplier < 1) {
      errors.push('Backoff multiplier must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get environment-specific configuration
   */
  public getEnvironmentConfig(): {
    environment: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  } {
    const environment = process.env.NODE_ENV || 'development';
    
    return {
      environment,
      isDevelopment: environment === 'development',
      isProduction: environment === 'production',
      isTest: environment === 'test',
    };
  }

  /**
   * Get feature flags
   */
  public getFeatureFlags(): {
    cloudSync: boolean;
    analytics: boolean;
    debugMode: boolean;
  } {
    const env = process.env as EnvironmentConfig;
    
    return {
      cloudSync: env.CLOUD_SYNC_ENABLED === 'true',
      analytics: env.ANALYTICS_ENABLED === 'true',
      debugMode: env.NODE_ENV === 'development',
    };
  }

  /**
   * Get performance configuration
   */
  public getPerformanceConfig(): {
    maxConnections: number;
    connectionTimeout: number;
    idleTimeout: number;
    retryConfig: {
      maxRetries: number;
      baseDelay: number;
      maxDelay: number;
      backoffMultiplier: number;
    };
  } {
    return {
      maxConnections: this.config.postgres?.maxConnections || 10,
      connectionTimeout: this.config.postgres?.connectionTimeout || 30000,
      idleTimeout: this.config.postgres?.idleTimeout || 300000,
      retryConfig: this.config.retryConfig,
    };
  }

  /**
   * Reset configuration to defaults
   */
  public resetToDefaults(): void {
    this.config = this.loadConfiguration();
  }

  /**
   * Export configuration (without sensitive data)
   */
  public exportConfig(): Omit<ConnectionConfig, 'indexedDB' | 'postgres'> & {
    indexedDB: Omit<ConnectionConfig['indexedDB'], 'encryptionKey'>;
    postgres?: Omit<PostgresConfig, 'password' | 'encryptionKey'>;
  } {
    return {
      indexedDB: {
        name: this.config.indexedDB.name,
        version: this.config.indexedDB.version,
      },
      postgres: this.config.postgres ? {
        host: this.config.postgres.host,
        port: this.config.postgres.port,
        database: this.config.postgres.database,
        username: this.config.postgres.username,
        ssl: this.config.postgres.ssl,
        maxConnections: this.config.postgres.maxConnections,
        connectionTimeout: this.config.postgres.connectionTimeout,
        idleTimeout: this.config.postgres.idleTimeout,
      } : undefined,
      userId: this.config.userId,
      retryConfig: this.config.retryConfig,
    };
  }
}
