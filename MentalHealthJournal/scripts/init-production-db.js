/**
 * Production Database Initialization Script
 * 
 * This script initializes the database schema for production deployment.
 * Run this after setting up your PostgreSQL database on Vercel.
 */

const { Pool } = require('pg');

// Database configuration
const config = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'moodtracker',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(config);

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🚀 Initializing production database...');

    // Create mood_entries table (matching migration script)
    await client.query(`
      CREATE TABLE IF NOT EXISTS mood_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
          notes TEXT,
          date DATE NOT NULL,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'archived')),
          tags TEXT[],
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

          -- Ensure only one mood entry per user per day
          UNIQUE(user_id, date)
      );
    `);

    // Handle existing mood_entries table with different schema
    try {
      // Check if entry_date column exists and rename it to date
      const result = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'mood_entries' AND column_name = 'entry_date';
      `);

      if (result.rows.length > 0) {
        // entry_date column exists, rename it to date
        await client.query(`ALTER TABLE mood_entries RENAME COLUMN entry_date TO date;`);
        console.log('Renamed entry_date column to date');
      }
    } catch (error) {
      // Column might not exist or other issues
      console.log('Date column migration check completed');
    }

    // Add status column if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'archived'));
      `);
      console.log('Status column check completed');
    } catch (error) {
      // Column might already exist or other issues
      console.log('Status column migration check completed');
    }

    // Add tags column if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS tags TEXT[];
      `);
      console.log('Tags column check completed');
    } catch (error) {
      // Column might already exist or other issues
      console.log('Tags column migration check completed');
    }

    // Add metadata column if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
      `);
      console.log('Metadata column check completed');
    } catch (error) {
      // Column might already exist or other issues
      console.log('Metadata column migration check completed');
    }

    // Create users table (matching migration script schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          preferences JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add preferences column if it doesn't exist (for existing databases)
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';
      `);
    } catch (error) {
      // Column might already exist or other issues
      console.log('Preferences column check completed');
    }

    // Insert default user for testing
    await client.query(`
      INSERT INTO users (id, email, username, password_hash, preferences)
      VALUES (
          '00000000-0000-0000-0000-000000000000',
          'test@moodtracker.app',
          'testuser',
          '$2b$10$dummy.hash.for.testing.purposes.only',
          '{"theme": "light", "language": "en", "timezone": "UTC", "dateFormat": "YYYY-MM-DD", "weekStartsOn": 1, "defaultChartPeriod": "month", "enableNotifications": true, "notificationTime": "09:00", "dataRetentionDays": 365, "exportFormat": "json"}'
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    // Create user_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          theme VARCHAR(20) DEFAULT 'light',
          language VARCHAR(10) DEFAULT 'en',
          timezone VARCHAR(50) DEFAULT 'UTC',
          date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
          week_starts_on INTEGER DEFAULT 0,
          default_chart_period VARCHAR(20) DEFAULT 'month',
          enable_notifications BOOLEAN DEFAULT FALSE,
          notification_time TIME,
          data_retention_days INTEGER DEFAULT 365,
          export_format VARCHAR(10) DEFAULT 'json',
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries (user_id);
      CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON mood_entries (date);
      CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries (user_id, date);
      CREATE INDEX IF NOT EXISTS idx_mood_entries_status ON mood_entries (status);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
    `);

    // Create function to update updated_at timestamp automatically
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers
    await client.query(`
      DROP TRIGGER IF EXISTS update_mood_entries_updated_at ON mood_entries;
      CREATE TRIGGER update_mood_entries_updated_at
      BEFORE UPDATE ON mood_entries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created: mood_entries, users, user_settings');
    console.log('🔍 Indexes created for performance');
    console.log('⚡ Triggers created for automatic timestamp updates');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Production database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
