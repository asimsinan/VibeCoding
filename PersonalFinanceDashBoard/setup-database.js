#!/usr/bin/env node

/**
 * Database Setup Script for Personal Finance Dashboard
 * This script sets up the database tables on your Neon PostgreSQL database
 */

const knex = require('knex');
const path = require('path');

// Database configuration
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_iS8ZtyQvNOn9@ep-rough-pine-adxhszaa-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  migrations: {
    directory: path.join(__dirname, 'database/migrations')
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Personal Finance Dashboard database...');
    
    // Run migrations
    console.log('📦 Running database migrations...');
    await db.migrate.latest();
    console.log('✅ Migrations completed successfully!');
    
    // Create a sample user first (required for foreign key constraint)
    console.log('👤 Setting up default user...');
    const defaultUserId = 'a22002ba-8d08-41d4-8c07-62784123244a';
    const existingUser = await db('users').where('id', defaultUserId).first();
    
    if (!existingUser) {
      await db('users').insert({
        id: defaultUserId,
        username: 'demo_user',
        email: 'demo@example.com',
        password_hash: 'demo_password_hash', // In production, this should be properly hashed
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('✅ Default user created successfully!');
    } else {
      console.log('ℹ️  Default user already exists, skipping...');
    }
    
    // Create some default categories
    console.log('📝 Creating default categories...');
    
    const defaultCategories = [
      { name: 'Food & Dining', type: 'expense' },
      { name: 'Transportation', type: 'expense' },
      { name: 'Entertainment', type: 'expense' },
      { name: 'Shopping', type: 'expense' },
      { name: 'Bills & Utilities', type: 'expense' },
      { name: 'Healthcare', type: 'expense' },
      { name: 'Education', type: 'expense' },
      { name: 'Travel', type: 'expense' },
      { name: 'Salary', type: 'income' },
      { name: 'Freelance', type: 'income' },
      { name: 'Investment', type: 'income' },
      { name: 'Other Income', type: 'income' }
    ];

    // Check if categories already exist
    const existingCategories = await db('categories').count('* as count').first();
    
    if (parseInt(existingCategories.count) === 0) {
      // Insert default categories with the default user ID
      const categoriesToInsert = defaultCategories.map(category => ({
        ...category,
        user_id: defaultUserId,
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      await db('categories').insert(categoriesToInsert);
      console.log('✅ Default categories created successfully!');
    } else {
      console.log('ℹ️  Categories already exist, skipping...');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📊 Your database is ready with:');
    console.log('   - Users table');
    console.log('   - Categories table (with default categories)');
    console.log('   - Transactions table');
    console.log('');
    console.log('🔗 You can now deploy to Vercel!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the setup
setupDatabase();
