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

// Create a global variable to store the Knex instance
let cachedDb = null;

// Function to create a new Knex instance
function createKnexInstance() {
  return knex({
    client: 'pg',
    connection: {
      connectionString: process.env.NEON_DATABASE_URL || FALLBACK_DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false 
      }
    },
    pool: {
      min: 0,
      max: 2,  // Reduced for serverless environment
      createTimeoutMillis: 3000,
      acquireTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      propagateCreateError: false
    },
    debug: true // Enable Knex debug logging
  });
}

// Export a function to get or create a Knex instance
module.exports = () => {
  if (!cachedDb) {
    cachedDb = createKnexInstance();
  }
  return cachedDb;
};
