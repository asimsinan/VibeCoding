const knex = require('knex');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Fallback database URL (replace with your actual fallback URL)
const FALLBACK_DATABASE_URL = 'postgresql://neondb_owner:npg_iS8ZtyQvNOn9@ep-rough-pine-adxhszaa-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? '[PRESENT]' : '[MISSING]'
});

// Create Knex connection
const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.NEON_DATABASE_URL || FALLBACK_DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  },
  pool: {
    min: 0,
    max: 5,
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false
  },
  debug: true // Enable Knex debug logging
});

// Test connection
db.raw('SELECT 1')
  .then(() => console.log('Database connection successful'))
  .catch((err) => {
    console.error('Database connection error:', err);
    console.error('Connection details:', {
      connectionString: process.env.NEON_DATABASE_URL ? '[REDACTED]' : 'MISSING',
      fallbackUsed: !process.env.NEON_DATABASE_URL
    });
  });

module.exports = db;
