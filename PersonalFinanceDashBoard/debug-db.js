const dotenv = require('dotenv');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function diagnoseDatabase() {
  console.log('Database Diagnostic Script');
  console.log('-------------------------');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL ? '[PRESENT]' : '[MISSING]');

  // Test database connection
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  });

  try {
    console.log('\nAttempting to connect to database...');
    await client.connect();
    console.log('✅ Database connection successful');

    // List users
    const usersResult = await client.query('SELECT id, email FROM users');
    console.log('\nUsers in the database:');
    console.log(usersResult.rows);

    // Check for demo user
    const demoUserResult = await client.query("SELECT * FROM users WHERE email = 'demo@example.com'");
    console.log('\nDemo User:');
    console.log(demoUserResult.rows.length > 0 ? demoUserResult.rows[0] : 'No demo user found');

  } catch (error) {
    console.error('❌ Database connection or query error:', error);
  } finally {
    await client.end();
  }
}

diagnoseDatabase().catch(console.error);
