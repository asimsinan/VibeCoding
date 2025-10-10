/**
 * Database Schema Check Script
 * Check existing tables and fix schema issues
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config({ path: '.env.local' });

async function checkDatabaseSchema() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  const client = await pool.connect();
  try {
    console.log('🔍 Checking existing database schema...');
    
    // Check if users table exists and its structure
    const usersTableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    if (usersTableCheck.rows.length === 0) {
      console.log('❌ Users table does not exist');
    } else {
      console.log('✅ Users table exists with columns:');
      usersTableCheck.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }
    
    // Check all tables
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 All tables in database:');
    tablesCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check indexes
    const indexesCheck = await client.query(`
      SELECT indexname, tablename, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n🔍 Existing indexes:');
    indexesCheck.rows.forEach(row => {
      console.log(`   - ${row.indexname} on ${row.tablename}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkDatabaseSchema();
