/**
 * PostgreSQL Adapter for API Routes
 * 
 * This provides PostgreSQL database operations for the API routes.
 */

import { Pool, PoolClient } from 'pg';

interface ApiMoodEntry {
  id: string; // UUID as string
  user_id: string;
  rating: number;
  notes: string | null;
  entry_date: string;
  date: string; // Also include date for compatibility
  created_at: string;
  updated_at: string;
  status: string;
  tags: string[];
  metadata: Record<string, any>;
}

class PostgresAdapter {
  private static instance: PostgresAdapter;
  private pool: Pool;

  private constructor() {
    // For Vercel deployment, use DATABASE_URL if available, otherwise use individual env vars
    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          // Add connection timeout and retry configuration for serverless
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
          max: 1, // Limit connections for serverless
        }
      : {
          host: process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          database: process.env.POSTGRES_DB || 'moodtracker',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || 'postgres',
          ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
          max: 1,
        };

    this.pool = new Pool(config);

    // Test connection on initialization
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  static getInstance(): PostgresAdapter {
    if (!PostgresAdapter.instance) {
      PostgresAdapter.instance = new PostgresAdapter();
    }
    return PostgresAdapter.instance;
  }

  /**
   * Health check method to test database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Create a new mood entry
  async createMoodEntry(entry: Omit<ApiMoodEntry, 'id' | 'created_at' | 'updated_at'>): Promise<ApiMoodEntry> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO mood_entries (user_id, rating, notes, entry_date, status, tags, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id, rating, notes, entry_date, created_at, updated_at, status, tags, metadata
      `;
      
      const values = [
        entry.user_id,
        entry.rating,
        entry.notes,
        entry.entry_date,
        entry.status,
        entry.tags,
        JSON.stringify(entry.metadata)
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];
      
      return {
        id: row.id,
        user_id: row.user_id,
        rating: row.rating,
        notes: row.notes,
        entry_date: row.entry_date || row.date, // Handle both column names
        date: row.entry_date || row.date, // Also provide date for compatibility
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
        tags: row.tags || [],
        metadata: row.metadata || {}
      };
    } finally {
      client.release();
    }
  }

  // Get a mood entry by ID
  async getMoodEntry(id: string): Promise<ApiMoodEntry | undefined> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM mood_entries WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        rating: row.rating,
        notes: row.notes,
        entry_date: row.entry_date || row.date, // Handle both column names
        date: row.entry_date || row.date, // Also provide date for compatibility
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
        tags: row.tags || [],
        metadata: row.metadata || {}
      };
    } finally {
      client.release();
    }
  }

  // Update a mood entry
  async updateMoodEntry(id: string, updates: Partial<Omit<ApiMoodEntry, 'id' | 'user_id' | 'created_at'>>): Promise<ApiMoodEntry | undefined> {
    const client = await this.pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.rating !== undefined) {
        setClause.push(`rating = $${paramCount++}`);
        values.push(updates.rating);
      }
      if (updates.notes !== undefined) {
        setClause.push(`notes = $${paramCount++}`);
        values.push(updates.notes);
      }
      if (updates.entry_date !== undefined) {
        setClause.push(`entry_date = $${paramCount++}`);
        values.push(updates.entry_date);
      }
      if (updates.status !== undefined) {
        setClause.push(`status = $${paramCount++}`);
        values.push(updates.status);
      }
      if (updates.tags !== undefined) {
        setClause.push(`tags = $${paramCount++}`);
        values.push(updates.tags);
      }
      if (updates.metadata !== undefined) {
        setClause.push(`metadata = $${paramCount++}`);
        values.push(JSON.stringify(updates.metadata));
      }

      if (setClause.length === 0) {
        return this.getMoodEntry(id);
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE mood_entries 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, user_id, rating, notes, entry_date, created_at, updated_at, status, tags, metadata
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        rating: row.rating,
        notes: row.notes,
        entry_date: row.entry_date || row.date, // Handle both column names
        date: row.entry_date || row.date, // Also provide date for compatibility
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
        tags: row.tags || [],
        metadata: row.metadata || {}
      };
    } finally {
      client.release();
    }
  }

  // Delete a mood entry
  async deleteMoodEntry(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM mood_entries WHERE id = $1';
      const result = await client.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // Get all mood entries for a user
  async getAllMoodEntries(userId: string): Promise<ApiMoodEntry[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM mood_entries
        WHERE user_id = $1
        ORDER BY entry_date DESC
      `;
      const result = await client.query(query, [userId]);

      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        rating: row.rating,
        notes: row.notes,
        entry_date: row.entry_date || row.date, // Handle both column names
        date: row.entry_date || row.date, // Also provide date for compatibility
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
        tags: row.tags || [],
        metadata: row.metadata || {}
      })) as ApiMoodEntry[];
    } finally {
      client.release();
    }
  }

  // Get mood entries by date range for a user
  async getMoodEntriesByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiMoodEntry[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM mood_entries
        WHERE user_id = $1 AND entry_date >= $2 AND entry_date <= $3
        ORDER BY entry_date DESC
      `;
      const result = await client.query(query, [userId, startDate, endDate]);
      
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        rating: row.rating,
        notes: row.notes,
        entry_date: row.entry_date || row.date, // Handle both column names
        date: row.entry_date || row.date, // Also provide date for compatibility
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
        tags: row.tags || [],
        metadata: row.metadata || {}
      })) as ApiMoodEntry[];
    } finally {
      client.release();
    }
  }

  // Close the connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default PostgresAdapter;
