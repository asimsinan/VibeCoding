#!/usr/bin/env node
/**
 * Test database connection with your Vercel PostgreSQL setup
 */

require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    client.release();
    
    console.log('✅ Database connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].postgres_version);
    
    // Test if we can create tables
    console.log('\n🔍 Testing table creation permissions...');
    const testTable = await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table creation permissions confirmed');
    
    // Clean up test table
    await client.query('DROP TABLE IF EXISTS test_connection');
    console.log('🧹 Test table cleaned up');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('\n🎉 Database is ready for your appointment scheduler!');
}

if (require.main === module) {
  testConnection();
}

module.exports = testConnection;
