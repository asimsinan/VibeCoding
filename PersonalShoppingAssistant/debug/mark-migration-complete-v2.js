#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_7YHn8jJlIpdW@ep-empty-flower-admmhvgf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function markMigrationComplete() {
  try {
    console.log('Connecting to production database...');
    
    // Mark the migration as completed with version
    await pool.query(
      'INSERT INTO migrations (version, name, executed_at) VALUES ($1, $2, NOW())',
      ['002', 'add_style_column']
    );
    
    console.log('✅ Migration marked as completed');
    
    // Check migration status
    const statusResult = await pool.query('SELECT * FROM migrations ORDER BY executed_at');
    console.log('📊 Migration status:');
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.version}: ${row.name} - ${row.executed_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

markMigrationComplete();
