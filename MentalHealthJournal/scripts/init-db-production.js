#!/usr/bin/env node

/**
 * Production Database Initialization Script
 *
 * This script initializes the database schema for production deployment.
 * Run this after setting up your PostgreSQL database on Vercel.
 */

const { initializeDatabase } = require('./init-production-db');

async function main() {
  try {
    console.log('🔧 Starting production database initialization...');
    await initializeDatabase();
    console.log('✅ Production database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { initializeDatabase };
