const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration for creating databases
const adminConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: 'postgres', // Connect to default postgres database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Database connection configuration for application
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'crowdfunding_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 60000,
};

// Create databases if they don't exist
async function createDatabases() {
  let adminClient;
  try {
    console.log('🔄 Creating databases...');
    
    adminClient = await new Pool(adminConfig).connect();
    
    // Create development database
    await adminClient.query('CREATE DATABASE crowdfunding_dev');
    console.log('✅ Created crowdfunding_dev database');
    
    // Create production database
    await adminClient.query('CREATE DATABASE crowdfunding_prod');
    console.log('✅ Created crowdfunding_prod database');
    
    return true;
  } catch (error) {
    if (error.code === '42P04') {
      console.log('ℹ️  Databases already exist, continuing...');
      return true;
    } else {
      console.error('❌ Failed to create databases:', error.message);
      return false;
    }
  } finally {
    if (adminClient) {
      adminClient.release();
    }
  }
}

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
async function testConnection() {
  let client;
  try {
    console.log('🔄 Testing database connection...');
    console.log(`📊 Connecting to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    
    console.log('✅ Database connection successful!');
    console.log(`⏰ Current time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].postgres_version}`);
    
    // Test connection pool
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    
    console.log('📈 Connection pool stats:', poolStats);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Test database schema and tables
async function testSchema() {
  let client;
  try {
    console.log('\n🔄 Testing database schema...');
    
    client = await pool.connect();
    
    // Check if we can create a test table
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_data TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Insert test data
    await client.query(`
      INSERT INTO connection_test (test_data) 
      VALUES ('Database connection test successful')
    `);
    
    // Query test data
    const result = await client.query('SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 1');
    
    console.log('✅ Schema test successful!');
    console.log(`📝 Test record: ${result.rows[0].test_data}`);
    
    // Clean up test table
    await client.query('DROP TABLE IF EXISTS connection_test');
    
    return true;
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting database connection tests...\n');
  
  const dbCreation = await createDatabases();
  if (!dbCreation) {
    console.log('💥 Database creation failed. Exiting.');
    process.exit(1);
  }
  
  const connectionTest = await testConnection();
  const schemaTest = await testSchema();
  
  console.log('\n📊 Test Results:');
  console.log(`Database Creation: ${dbCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Connection Test: ${connectionTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Schema Test: ${schemaTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (dbCreation && connectionTest && schemaTest) {
    console.log('\n🎉 All database tests passed! Database is ready for use.');
    console.log('📋 Database Configuration Summary:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Pool Max: ${dbConfig.max}`);
    console.log(`   Pool Min: ${dbConfig.min}`);
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please check your database configuration.');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down database connection pool...');
  await pool.end();
  process.exit(0);
});

// Run tests
runTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});