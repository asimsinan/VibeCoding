/**
 * Migration: Add user_id to participants table
 * This links participants to authenticated users, allowing proper duplicate detection
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/videoconference'
});

async function up() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Adding user_id column to participants table...');
    
    // Add user_id column (nullable initially for existing data)
    await client.query(`
      ALTER TABLE participants 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    `);
    
    // Create index for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
    `);
    
    // Create composite index for room + user lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_room_user ON participants(room_id, user_id);
    `);
    
    // Add unique constraint to prevent duplicate active connections for same user in same room
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_room_user_connected 
      ON participants(room_id, user_id) 
      WHERE is_connected = true;
    `);
    
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
up().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

