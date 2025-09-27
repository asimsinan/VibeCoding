const knex = require('knex');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create Knex connection
const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.NEON_DATABASE_URL,
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
  }
});

module.exports = db;
