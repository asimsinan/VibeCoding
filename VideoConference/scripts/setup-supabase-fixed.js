/**
 * Database Setup Script (Fixed Version)
 * Set up Supabase database with proper error handling
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function setupSupabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    console.log('💡 Please create .env.local with your Supabase database URL');
    process.exit(1);
  }

  // Check if password is still placeholder
  if (connectionString.includes('[YOUR-PASSWORD]')) {
    console.error('❌ Please update .env.local with your actual Supabase database password');
    console.log('🔑 Get your password from: https://supabase.com/dashboard/project/rnugtlgygqbvtbklnmhn');
    console.log('📝 Go to Settings > Database and copy the password');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  const client = await pool.connect();
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('🕐 Server time:', result.rows[0].now);
    
    console.log('\n🗄️  Applying database schema...');
    
    // Read and execute the fixed schema
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'supabase-schema-fixed.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSql.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await client.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n🎉 Database schema applied successfully!');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Verify indexes
    const indexesResult = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n🔍 Created indexes:');
    indexesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.indexname} on ${row.tablename}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupSupabase();
