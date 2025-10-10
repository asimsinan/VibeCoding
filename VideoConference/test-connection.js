#!/usr/bin/env node

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config({ path: '.env.local' });

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  console.log('🔍 Testing Supabase connection...');
  console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':***@')); // Hide password

  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('✅ Database version:', result.rows[0].version);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
    `);
    
    console.log('📊 Existing tables:', tablesResult.rows.map(row => row.tablename));
    
    // Check if user table exists
    const userTableExists = tablesResult.rows.some(row => row.tablename === 'user');
    if (!userTableExists) {
      console.log('❌ User table does not exist! Need to create schema.');
      console.log('Run: npm run db:setup-fixed');
    } else {
      console.log('✅ User table exists');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
