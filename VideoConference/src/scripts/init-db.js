/**
 * Database Initialization Script
 * Sets up the database schema for the video conferencing application
 */

import { DatabaseService } from '../lib/video-conferencing/services/database.service.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    const dbService = DatabaseService.getInstance();
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'video-conferencing', 'models', 'database.schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Reading database schema...');
    
    // Execute the schema
    console.log('🔧 Creating database tables...');
    await dbService.query(schema);
    
    console.log('✅ Database initialized successfully!');
    
    // Test the connection
    const result = await dbService.query('SELECT COUNT(*) FROM rooms');
    console.log(`📊 Rooms table created with ${result.rows[0].count} rows`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };
