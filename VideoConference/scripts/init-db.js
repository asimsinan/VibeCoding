/**
 * Database Initialization Script
 * Sets up the database schema for the video conferencing application
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    // Create database connection
    const pool = new Pool({
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'videoconference'
    });
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'video-conferencing', 'models', 'database.schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Reading database schema...');
    
    // Execute the schema
    console.log('🔧 Creating database tables...');
    await pool.query(schema);
    
    console.log('✅ Database initialized successfully!');
    
    // Test the connection
    const result = await pool.query('SELECT COUNT(*) FROM rooms');
    console.log(`📊 Rooms table created with ${result.rows[0].count} rows`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('🎉 Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
