#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up the Supabase database by running the migration.
 * Run this script after setting up your Supabase project.
 */

const fs = require('fs')
const path = require('path')

console.log('🗄️  Database Setup Helper')
console.log('========================\n')

console.log('To set up your Supabase database, you have a few options:\n')

console.log('📋 Option 1: Using Supabase Dashboard (Recommended)')
console.log('1. Go to https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Go to SQL Editor')
console.log('4. Copy and paste the contents of supabase/migrations/001_initial_schema.sql')
console.log('5. Click "Run" to execute the migration\n')

console.log('📋 Option 2: Using Supabase CLI')
console.log('1. Install Supabase CLI: npm install -g supabase')
console.log('2. Login: supabase login')
console.log('3. Link your project: supabase link --project-ref YOUR_PROJECT_REF')
console.log('4. Push migrations: supabase db push\n')

console.log('📋 Option 3: Manual SQL Execution')
console.log('1. Copy the migration file content:')
console.log('2. Paste it into your Supabase SQL Editor')
console.log('3. Execute the script\n')

// Read and display the migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql')

if (fs.existsSync(migrationPath)) {
  console.log('📄 Migration file content:')
  console.log('========================')
  console.log(fs.readFileSync(migrationPath, 'utf8'))
} else {
  console.log('❌ Migration file not found at:', migrationPath)
}

console.log('\n✅ After running the migration, refresh your whiteboard page!')
