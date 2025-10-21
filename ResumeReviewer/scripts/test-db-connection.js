#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests PostgreSQL connection with proper error handling and connection pooling
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/resume_reviewer_dev?schema=public'
      }
    }
  });

  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Database connection established successfully');

    // Test query execution
    console.log('\n🔍 Testing query execution...');
    const result = await prisma.$queryRaw`SELECT version() as version, now() as current_time`;
    console.log('✅ Query executed successfully');
    console.log(`📊 PostgreSQL Version: ${result[0].version}`);
    console.log(`⏰ Current Time: ${result[0].current_time}`);

    // Test connection pooling
    console.log('\n🏊 Testing connection pooling...');
    const poolTest = await Promise.all([
      prisma.$queryRaw`SELECT 1 as test1`,
      prisma.$queryRaw`SELECT 2 as test2`,
      prisma.$queryRaw`SELECT 3 as test3`
    ]);
    console.log('✅ Connection pooling test passed');
    console.log(`📊 Pool test results: ${poolTest.map(r => r[0]).map(r => Object.values(r)[0]).join(', ')}`);

    // Test transaction capability
    console.log('\n🔄 Testing transaction capability...');
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1`;
      await tx.$queryRaw`SELECT 2`;
    });
    console.log('✅ Transaction test passed');

    // Test database schema access
    console.log('\n📋 Testing schema access...');
    const schemaInfo = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      LIMIT 5
    `;
    console.log('✅ Schema access test passed');
    console.log(`📊 Database tables accessible: ${schemaInfo.length} tables found`);

    // Test UUID generation
    console.log('\n🆔 Testing UUID generation...');
    const uuidResult = await prisma.$queryRaw`SELECT gen_random_uuid() as uuid`;
    console.log('✅ UUID generation test passed');
    console.log(`📊 Generated UUID: ${uuidResult[0].uuid}`);

    console.log('\n🎉 All database tests passed successfully!');
    console.log('\n📊 Database Configuration Summary:');
    console.log(`   • Database Type: PostgreSQL`);
    console.log(`   • Connection Status: ✅ Connected`);
    console.log(`   • Query Execution: ✅ Working`);
    console.log(`   • Connection Pooling: ✅ Working`);
    console.log(`   • Transactions: ✅ Working`);
    console.log(`   • Schema Access: ✅ Working`);
    console.log(`   • UUID Generation: ✅ Working`);

  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'UNKNOWN'}`);
    console.error(`   Details: ${error.details || 'No additional details'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting Tips:');
      console.error('   • Ensure PostgreSQL is running');
      console.error('   • Check if the port 5432 is accessible');
      console.error('   • Verify DATABASE_URL environment variable');
    } else if (error.code === 'P1001') {
      console.error('\n💡 Troubleshooting Tips:');
      console.error('   • Check database credentials');
      console.error('   • Verify database exists');
      console.error('   • Check network connectivity');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('\n✅ Database connection test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database connection test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
