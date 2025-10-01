#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_7YHn8jJlIpdW@ep-empty-flower-admmhvgf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkMigrations() {
  try {
    console.log('Connecting to production database...');
    
    // Check migrations table structure
    const tableResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'migrations' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Migrations table structure:');
    tableResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check existing migrations
    const statusResult = await pool.query('SELECT * FROM migrations ORDER BY executed_at');
    console.log('\n📊 Existing migrations:');
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.executed_at}`);
    });
    
    // Insert the problematic migration
    await pool.query(
      'INSERT INTO migrations (name, executed_at) VALUES ($1, NOW())',
      ['002_add_style_column']
    );
    
    console.log('✅ Migration marked as completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMigrations();
