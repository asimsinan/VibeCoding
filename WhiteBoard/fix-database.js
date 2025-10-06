#!/usr/bin/env node

/**
 * Database Fix Script
 * 
 * This script helps fix the RLS policies in your Supabase database.
 * Run this after the initial migration to fix permission issues.
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Database Fix Helper')
console.log('=====================\n')

console.log('Your database tables were created, but there are RLS policy issues.')
console.log('This script will help you fix the permissions.\n')

console.log('📋 Steps to fix the database:')
console.log('1. Go to https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Go to SQL Editor')
console.log('4. Copy and paste the SQL below')
console.log('5. Click "Run" to execute the fix\n')

console.log('📄 Fix SQL:')
console.log('==========')

// Read and display the fix file
const fixPath = path.join(__dirname, 'fix-database-policies.sql')

if (fs.existsSync(fixPath)) {
  console.log(fs.readFileSync(fixPath, 'utf8'))
} else {
  console.log('❌ Fix file not found at:', fixPath)
}

console.log('\n✅ After running this fix, try creating a whiteboard again!')
