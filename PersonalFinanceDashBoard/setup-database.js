const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

async function setupDatabase() {
  console.log('🚀 Setting up Personal Finance Dashboard database...');

  // Database connection configuration
  const connectionConfig = {
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  };

  const client = new Client(connectionConfig);

  try {
    // Connect to the database
    await client.connect();
    console.log('📦 Connected to database successfully');

    // Drop existing tables if they exist (for clean setup)
    await client.query('DROP TABLE IF EXISTS transactions');
    await client.query('DROP TABLE IF EXISTS categories');
    await client.query('DROP TABLE IF EXISTS users');

    // Create users table with explicit password column
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('👥 Users table created');

    // Create categories table
    await client.query(`
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
        user_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('📁 Categories table created');

    // Create transactions table
    await client.query(`
      CREATE TABLE transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        amount NUMERIC(10, 2) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
        date DATE NOT NULL,
        description TEXT,
        category_id UUID REFERENCES categories(id),
        user_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('💰 Transactions table created');

    // Create demo users
    const users = [
      {
        id: 'a22002ba-8d08-41d4-8c07-62784123244a',
        email: 'demo@example.com',
        password: 'demo_password_hash'
      },
      {
        id: 'b33113cb-9d09-5d5f-9c07-73834123245b',
        email: 'user2@example.com',
        password: 'user2_password_hash'
      }
    ];

    // Insert demo users
    for (const user of users) {
      await client.query(`
        INSERT INTO users (id, email, password) 
        VALUES ($1, $2, $3)
      `, [user.id, user.email, user.password]);
      console.log(`🧑 User created: ${user.email}`);
    }

    // Seed default categories for demo users
    const defaultCategories = [
      { name: 'Salary', type: 'income', userId: 'a22002ba-8d08-41d4-8c07-62784123244a' },
      { name: 'Freelance', type: 'income', userId: 'a22002ba-8d08-41d4-8c07-62784123244a' },
      { name: 'Groceries', type: 'expense', userId: 'a22002ba-8d08-41d4-8c07-62784123244a' },
      { name: 'Dining Out', type: 'expense', userId: 'a22002ba-8d08-41d4-8c07-62784123244a' },
      { name: 'Rent', type: 'expense', userId: 'a22002ba-8d08-41d4-8c07-62784123244a' },
      
      // Categories for the second user
      { name: 'Consulting', type: 'income', userId: 'b33113cb-9d09-5d5f-9c07-73834123245b' },
      { name: 'Investments', type: 'income', userId: 'b33113cb-9d09-5d5f-9c07-73834123245b' },
      { name: 'Utilities', type: 'expense', userId: 'b33113cb-9d09-5d5f-9c07-73834123245b' },
      { name: 'Transportation', type: 'expense', userId: 'b33113cb-9d09-5d5f-9c07-73834123245b' }
    ];

    for (const category of defaultCategories) {
      await client.query(`
        INSERT INTO categories (name, type, user_id) 
        VALUES ($1, $2, $3)
      `, [category.name, category.type, category.userId]);
    }
    console.log('📝 Default categories created');

    console.log('✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

setupDatabase().catch(console.error);
