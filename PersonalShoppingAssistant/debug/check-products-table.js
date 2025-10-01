#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_7YHn8jJlIpdW@ep-empty-flower-admmhvgf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkProductsTable() {
  try {
    console.log('Connecting to production database...');
    
    // Check products table structure
    const tableResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Products table structure:');
    tableResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if rating column exists
    const ratingExists = tableResult.rows.some(row => row.column_name === 'rating');
    console.log(`\n🔍 Rating column exists: ${ratingExists}`);
    
    // If rating column doesn't exist, add it
    if (!ratingExists) {
      console.log('➕ Adding rating column...');
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00 
        CHECK (rating >= 0.00 AND rating <= 5.00)
      `);
      console.log('✅ Rating column added successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkProductsTable();
