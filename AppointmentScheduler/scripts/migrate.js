#!/usr/bin/env node
/**
 * Database Migration Script
 * 
 * Creates the necessary database tables and functions for the appointment scheduler
 */

require('dotenv').config();
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Vercel PostgreSQL
  });

  try {
    console.log('🔄 Starting database migration...');

    // Read the schema file
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../src/schema/appointments.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the entire schema as one statement to handle dollar-quoted strings
    try {
      await pool.query(schema);
      console.log('✅ Executed schema successfully');
    } catch (error) {
      // If the entire schema fails, try to execute individual statements
      console.log('⚠️  Full schema execution failed, trying individual statements...');
      
      // Split by semicolon and execute each statement
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement);
            console.log('✅ Executed statement');
          } catch (error) {
            // Ignore "already exists" errors
            if (!error.message.includes('already exists') && !error.message.includes('already defined')) {
              console.error('❌ Error executing statement:', error.message);
              throw error;
            } else {
              console.log('⚠️  Statement already exists, skipping');
            }
          }
        }
      }
    }

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
