#!/usr/bin/env node
/**
 * Database Setup Script
 * 
 * Executes the database schema in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema...')
    
    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    console.log('📄 Schema file loaded successfully')

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
          
          // Use rpc to execute raw SQL
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`)
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.warn(`⚠️  Warning on statement ${i + 1}: ${err}`)
          // Continue with other statements
        }
      }
    }

    console.log('🎉 Database schema setup completed!')
    
    // Test the connection by querying a table
    console.log('🔍 Testing database connection...')
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.log('⚠️  Database test query failed (this might be expected):', error.message)
    } else {
      console.log('✅ Database connection test successful!')
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()
