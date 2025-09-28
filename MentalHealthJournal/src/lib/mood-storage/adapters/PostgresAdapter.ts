/**
 * PostgreSQL Adapter for Cloud Sync
 * 
 * Provides cloud synchronization using PostgreSQL for mood entries.
 * Implements connection pooling, retry logic, and data encryption.
 * 
 * @fileoverview PostgreSQL adapter with cloud sync support
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import CryptoJS from 'crypto-js';

// Database configuration interface
export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  encryptionKey: string;
}

// Database schema interfaces
export interface MoodEntryRow {
  id: string;
  user_id: string;
  rating: number;
  notes: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  encrypted_data: string;
  version: number;
}

export interface UserSettingsRow {
  id: string;
  user_id: string;
  encrypted_data: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface SyncQueueRow {
  id: string;
  user_id: string;
  operation: 'create' | 'update' | 'delete';
  table_name: string;
  record_id: string;
  data: any;
  created_at: string;
  retry_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Public interfaces (matching IndexedDB)
export interface MoodEntry {
  id: string;
  rating: number; // 1-10
  notes?: string;
  date: string; // ISO date
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  synced: boolean;
}

export interface UserSettings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  chartPreferences: {
    defaultPeriod: '7d' | '30d' | '90d' | '1y';
    showNotes: boolean;
    showTrends: boolean;
  };
  privacy: {
    dataRetention: number; // days
    cloudSync: boolean;
    analytics: boolean;
  };
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
    moodInsights: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export class PostgresAdapter {
  private pool: Pool | null = null;
  private config: PostgresConfig;
  private encryptionKey: string;
  private userId: string;

  constructor(config: PostgresConfig, userId: string) {
    this.config = config;
    this.encryptionKey = config.encryptionKey;
    this.userId = userId;
  }

  /**
   * Initialize the PostgreSQL connection pool
   */
  async initialize(): Promise<void> {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        max: this.config.maxConnections,
        connectionTimeoutMillis: this.config.connectionTimeout,
        idleTimeoutMillis: this.config.idleTimeout,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Ensure tables exist
      await this.createTables();

      console.log('PostgreSQL connection pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL:', error);
      throw new Error(`PostgreSQL initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * Create database tables if they don't exist
   */
  private async createTables(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const client = await this.pool.connect();
    
    try {
      // Create mood_entries table
      await client.query(`
        CREATE TABLE IF NOT EXISTS mood_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
          notes TEXT,
          date DATE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          encrypted_data TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          UNIQUE(user_id, date)
        );
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date 
        ON mood_entries(user_id, date);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at 
        ON mood_entries(created_at);
      `);

      // Create user_settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE,
          encrypted_data TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          version INTEGER DEFAULT 1
        );
      `);

      // Create sync_queue table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          operation VARCHAR(10) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
          table_name VARCHAR(50) NOT NULL,
          record_id UUID NOT NULL,
          data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          retry_count INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
        );
      `);

      // Create sync queue indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_sync_queue_user_status 
        ON sync_queue(user_id, status);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at 
        ON sync_queue(created_at);
      `);

    } finally {
      client.release();
    }
  }

  /**
   * Encrypt data using AES encryption
   */
  private encrypt(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
  }

  /**
   * Decrypt data using AES decryption
   */
  private decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Execute query with retry logic
   */
  private async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Query attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      }
    }
    
    throw lastError || new Error('Query failed after all retries');
  }

  /**
   * Create a new mood entry
   */
  async createMoodEntry(entry: Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<MoodEntry> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const moodEntry: MoodEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
      synced: true, // Cloud entries are considered synced
    };

    return await this.executeWithRetry(async () => {
      const client = await this.pool!.connect();
      
      try {
        const encryptedData = this.encrypt(moodEntry);
        
        const result = await client.query(`
          INSERT INTO mood_entries (id, user_id, rating, notes, date, created_at, updated_at, encrypted_data, version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          id,
          this.userId,
          moodEntry.rating,
          moodEntry.notes || null,
          moodEntry.date,
          moodEntry.createdAt,
          moodEntry.updatedAt,
          encryptedData,
          1
        ]);

        return moodEntry;
      } finally {
        client.release();
      }
    });
  }

  /**
   * Get mood entries with optional filtering
   */
  async getMoodEntries(options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<MoodEntry[]> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const { startDate, endDate, limit = 100, offset = 0 } = options;

    return await this.executeWithRetry(async () => {
      const client = await this.pool!.connect();
      
      try {
        let query = `
          SELECT encrypted_data, date, created_at, updated_at
          FROM mood_entries 
          WHERE user_id = $1
        `;
        const params: any[] = [this.userId];
        let paramIndex = 2;

        if (startDate) {
          query += ` AND date >= $${paramIndex}`;
          params.push(startDate);
          paramIndex++;
        }

        if (endDate) {
          query += ` AND date <= $${paramIndex}`;
          params.push(endDate);
          paramIndex++;
        }

        query += ` ORDER BY date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await client.query(query, params);
        
        return result.rows.map((row: any) => {
          const decryptedData = this.decrypt(row.encrypted_data);
          return {
            ...decryptedData,
            synced: true,
          };
        });
      } finally {
        client.release();
      }
    });
  }

  /**
   * Update an existing mood entry
   */
  async updateMoodEntry(id: string, updates: Partial<Omit<MoodEntry, 'id' | 'createdAt'>>): Promise<MoodEntry> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    return await this.executeWithRetry(async () => {
      const client = await this.pool!.connect();
      
      try {
        // Get existing entry
        const existingResult = await client.query(
          'SELECT encrypted_data FROM mood_entries WHERE id = $1 AND user_id = $2',
          [id, this.userId]
        );

        if (existingResult.rows.length === 0) {
          throw new Error('Mood entry not found');
        }

        const currentData = this.decrypt(existingResult.rows[0].encrypted_data);
        const updatedData: MoodEntry = {
          ...currentData,
          ...updates,
          updatedAt: new Date().toISOString(),
          synced: true,
        };

        const encryptedData = this.encrypt(updatedData);

        await client.query(`
          UPDATE mood_entries 
          SET rating = $1, notes = $2, updated_at = $3, encrypted_data = $4, version = version + 1
          WHERE id = $5 AND user_id = $6
        `, [
          updatedData.rating,
          updatedData.notes || null,
          updatedData.updatedAt,
          encryptedData,
          id,
          this.userId
        ]);

        return updatedData;
      } finally {
        client.release();
      }
    });
  }

  /**
   * Delete a mood entry
   */
  async deleteMoodEntry(id: string): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    await this.executeWithRetry(async () => {
      const client = await this.pool!.connect();
      
      try {
        const result = await client.query(
          'DELETE FROM mood_entries WHERE id = $1 AND user_id = $2',
          [id, this.userId]
        );

        if (result.rowCount === 0) {
          throw new Error('Mood entry not found');
        }
      } finally {
        client.release();
      }
    });
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<UserSettings | null> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    return await this.executeWithRetry(async () => {
      const client = await this.pool!.connect();
      
      try {
        const result = await client.query(
          'SELECT encrypted_data FROM user_settings WHERE user_id = $1',
          [this.userId]
        );

        if (result.rows.length === 0) {
          return null;
        }

        return this.decrypt(result.rows[0].encrypted_data);
      } finally {
        client.release();
      }
    });
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    return await this.executeWithRetry(async () => {
      const client = await this.pool!.connect();
      
      try {
        const now = new Date().toISOString();
        
        // Get existing settings
        const existingResult = await client.query(
          'SELECT encrypted_data FROM user_settings WHERE user_id = $1',
          [this.userId]
        );

        let updatedSettings: UserSettings;
        
        if (existingResult.rows.length > 0) {
          const currentData = this.decrypt(existingResult.rows[0].encrypted_data);
          updatedSettings = {
            ...currentData,
            ...settings,
            updatedAt: now,
          };
        } else {
          updatedSettings = {
            id: this.userId,
            theme: 'system',
            chartPreferences: {
              defaultPeriod: '30d',
              showNotes: true,
              showTrends: true,
            },
            privacy: {
              dataRetention: 365,
              cloudSync: true,
              analytics: false,
            },
            notifications: {
              dailyReminder: false,
              weeklyReport: false,
              moodInsights: false,
            },
            createdAt: now,
            updatedAt: now,
            ...settings,
          };
        }

        const encryptedData = this.encrypt(updatedSettings);

        await client.query(`
          INSERT INTO user_settings (user_id, encrypted_data, created_at, updated_at, version)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            encrypted_data = EXCLUDED.encrypted_data,
            updated_at = EXCLUDED.updated_at,
            version = user_settings.version + 1
        `, [
          this.userId,
          encryptedData,
          updatedSettings.createdAt,
          updatedSettings.updatedAt,
          1
        ]);

        return updatedSettings;
      } finally {
        client.release();
      }
    });
  }

  /**
   * Sync data from local to cloud
   */
  async syncFromLocal(syncItems: Array<{
    operation: 'create' | 'update' | 'delete';
    table: 'moodEntries' | 'userSettings';
    data: any;
  }>): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const item of syncItems) {
        switch (item.operation) {
          case 'create':
            if (item.table === 'moodEntries') {
              await this.createMoodEntry(item.data);
            } else if (item.table === 'userSettings') {
              await this.updateUserSettings(item.data);
            }
            break;
            
          case 'update':
            if (item.table === 'moodEntries') {
              await this.updateMoodEntry(item.data.id, item.data);
            } else if (item.table === 'userSettings') {
              await this.updateUserSettings(item.data);
            }
            break;
            
          case 'delete':
            if (item.table === 'moodEntries') {
              await this.deleteMoodEntry(item.data.id);
            }
            break;
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    lastEntryDate: string | null;
    averageRating: number;
    syncQueueSize: number;
  }> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    return await this.executeWithRetry(async () => {
      const client = await this.pool!.connect();
      
      try {
        const [entriesResult, syncResult] = await Promise.all([
          client.query(`
            SELECT COUNT(*) as total, MAX(date) as last_date, AVG(rating) as avg_rating
            FROM mood_entries 
            WHERE user_id = $1
          `, [this.userId]),
          
          client.query(`
            SELECT COUNT(*) as queue_size
            FROM sync_queue 
            WHERE user_id = $1 AND status = 'pending'
          `, [this.userId])
        ]);

        const entries = entriesResult.rows[0];
        const sync = syncResult.rows[0];

        return {
          totalEntries: parseInt(entries.total) || 0,
          lastEntryDate: entries.last_date,
          averageRating: entries.avg_rating ? Math.round(parseFloat(entries.avg_rating) * 100) / 100 : 0,
          syncQueueSize: parseInt(sync.queue_size) || 0,
        };
      } finally {
        client.release();
      }
    });
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}
