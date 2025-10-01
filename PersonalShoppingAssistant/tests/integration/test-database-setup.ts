/**
 * Test Database Setup - PostgreSQL test database configuration
 * TASK-003: Create Integration Test Scenarios - FR-001 through FR-007
 * 
 * This file sets up the test database with proper schema and fixtures
 * for integration testing.
 */

import { Pool, PoolClient } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

export class TestDatabaseSetup {
  private pool: Pool;
  private testDbName: string;

  constructor() {
    this.testDbName = process.env.DB_NAME || 'test_shopping_assistant';
    
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'postgres', // Connect to default postgres database first
      user: process.env.DB_USER || 'test',
      password: process.env.DB_PASSWORD || 'test',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async setupTestDatabase(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Drop test database if it exists
      await client.query(`DROP DATABASE IF EXISTS ${this.testDbName}`);
      
      // Create test database
      await client.query(`CREATE DATABASE ${this.testDbName}`);
      
      console.log(`Test database '${this.testDbName}' created successfully`);
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createSchema(): Promise<void> {
    // Create a new pool connection to the test database
    const testPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: this.testDbName,
      user: process.env.DB_USER || 'test',
      password: process.env.DB_PASSWORD || 'test',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    const client = await testPool.connect();
    
    try {
      // Create database schema
      await client.query(`
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- User preferences table
        CREATE TABLE IF NOT EXISTS user_preferences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          categories TEXT[] DEFAULT '{}',
          price_range_min DECIMAL(10,2) DEFAULT 0,
          price_range_max DECIMAL(10,2) DEFAULT 1000,
          brands TEXT[] DEFAULT '{}',
          style_preferences TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Products table
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
          category VARCHAR(100) NOT NULL,
          brand VARCHAR(100) NOT NULL,
          image_url VARCHAR(500),
          availability BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Interactions table
        CREATE TABLE IF NOT EXISTS interactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL CHECK (type IN ('view', 'like', 'dislike', 'purchase')),
          metadata JSONB DEFAULT '{}',
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Recommendations table
        CREATE TABLE IF NOT EXISTS recommendations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
          algorithm VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
        CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
        CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
        CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_interactions_product_id ON interactions(product_id);
        CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
        CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp);
        CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
        CREATE INDEX IF NOT EXISTS idx_recommendations_product_id ON recommendations(product_id);
        CREATE INDEX IF NOT EXISTS idx_recommendations_score ON recommendations(score);
        CREATE INDEX IF NOT EXISTS idx_recommendations_expires_at ON recommendations(expires_at);

        -- Create full-text search index for products
        CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

        -- Create composite indexes for common queries
        CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category, price);
        CREATE INDEX IF NOT EXISTS idx_products_brand_availability ON products(brand, availability);
        CREATE INDEX IF NOT EXISTS idx_interactions_user_type ON interactions(user_id, type);
        CREATE INDEX IF NOT EXISTS idx_interactions_product_type ON interactions(product_id, type);
      `);

      console.log('Database schema created successfully');
    } catch (error) {
      console.error('Error creating database schema:', error);
      throw error;
    } finally {
      client.release();
      await testPool.end();
    }
  }

  async seedTestData(): Promise<void> {
    const testPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: this.testDbName,
      user: process.env.DB_USER || 'test',
      password: process.env.DB_PASSWORD || 'test',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    const client = await testPool.connect();
    
    try {
      // Insert test users
      await client.query(`
        INSERT INTO users (email, password_hash) VALUES
        ('testuser1@example.com', '$2b$10$testhash1'),
        ('testuser2@example.com', '$2b$10$testhash2'),
        ('testuser3@example.com', '$2b$10$testhash3'),
        ('admin@example.com', '$2b$10$adminhash')
      `);

      // Insert user preferences
      await client.query(`
        INSERT INTO user_preferences (user_id, categories, price_range_min, price_range_max, brands, style_preferences) VALUES
        (1, ARRAY['Electronics', 'Books'], 10.00, 500.00, ARRAY['Apple', 'Samsung'], ARRAY['Modern']),
        (2, ARRAY['Electronics', 'Clothing'], 20.00, 300.00, ARRAY['Nike', 'Adidas'], ARRAY['Sporty']),
        (3, ARRAY['Books', 'Home'], 5.00, 100.00, ARRAY['IKEA'], ARRAY['Minimalist']),
        (4, ARRAY['Electronics', 'Books', 'Clothing'], 0.00, 1000.00, ARRAY['Apple', 'Nike', 'Samsung'], ARRAY['Modern', 'Sporty'])
      `);

      // Insert test products
      await client.query(`
        INSERT INTO products (name, description, price, category, brand, image_url, availability) VALUES
        ('iPhone 15', 'Latest Apple iPhone with advanced features', 999.99, 'Electronics', 'Apple', 'https://example.com/iphone15.jpg', true),
        ('Samsung Galaxy S24', 'Samsung flagship smartphone', 899.99, 'Electronics', 'Samsung', 'https://example.com/galaxy-s24.jpg', true),
        ('MacBook Pro', 'Apple MacBook Pro laptop', 1999.99, 'Electronics', 'Apple', 'https://example.com/macbook-pro.jpg', true),
        ('iPad Air', 'Apple iPad Air tablet', 599.99, 'Electronics', 'Apple', 'https://example.com/ipad-air.jpg', true),
        ('Nike Air Max', 'Comfortable running shoes', 129.99, 'Clothing', 'Nike', 'https://example.com/nike-air-max.jpg', true),
        ('Adidas Ultraboost', 'High-performance running shoes', 149.99, 'Clothing', 'Adidas', 'https://example.com/adidas-ultraboost.jpg', true),
        ('TypeScript Handbook', 'Complete guide to TypeScript', 49.99, 'Books', 'TechBooks', 'https://example.com/typescript-handbook.jpg', true),
        ('React Guide', 'Learn React development', 39.99, 'Books', 'TechBooks', 'https://example.com/react-guide.jpg', true),
        ('IKEA Desk', 'Modern minimalist desk', 199.99, 'Home', 'IKEA', 'https://example.com/ikea-desk.jpg', true),
        ('IKEA Chair', 'Ergonomic office chair', 149.99, 'Home', 'IKEA', 'https://example.com/ikea-chair.jpg', true),
        ('Samsung TV', '4K Smart TV', 799.99, 'Electronics', 'Samsung', 'https://example.com/samsung-tv.jpg', true),
        ('Nike T-Shirt', 'Comfortable cotton t-shirt', 29.99, 'Clothing', 'Nike', 'https://example.com/nike-tshirt.jpg', true),
        ('JavaScript Book', 'Learn JavaScript programming', 34.99, 'Books', 'TechBooks', 'https://example.com/javascript-book.jpg', true),
        ('IKEA Lamp', 'Modern table lamp', 39.99, 'Home', 'IKEA', 'https://example.com/ikea-lamp.jpg', true),
        ('Apple Watch', 'Smartwatch with health features', 399.99, 'Electronics', 'Apple', 'https://example.com/apple-watch.jpg', true)
      `);

      // Insert test interactions
      await client.query(`
        INSERT INTO interactions (user_id, product_id, type, metadata) VALUES
        (1, 1, 'view', '{"source": "search"}'),
        (1, 1, 'like', '{"source": "recommendation"}'),
        (1, 3, 'view', '{"source": "browse"}'),
        (1, 3, 'purchase', '{"source": "recommendation", "amount": 1999.99}'),
        (1, 7, 'view', '{"source": "search"}'),
        (1, 7, 'like', '{"source": "recommendation"}'),
        (2, 2, 'view', '{"source": "search"}'),
        (2, 2, 'like', '{"source": "recommendation"}'),
        (2, 5, 'view', '{"source": "browse"}'),
        (2, 5, 'purchase', '{"source": "recommendation", "amount": 129.99}'),
        (2, 6, 'view', '{"source": "search"}'),
        (2, 6, 'like', '{"source": "recommendation"}'),
        (3, 9, 'view', '{"source": "search"}'),
        (3, 9, 'purchase', '{"source": "recommendation", "amount": 199.99}'),
        (3, 10, 'view', '{"source": "browse"}'),
        (3, 10, 'like', '{"source": "recommendation"}'),
        (3, 13, 'view', '{"source": "search"}'),
        (3, 13, 'purchase', '{"source": "recommendation", "amount": 34.99}'),
        (4, 1, 'view', '{"source": "search"}'),
        (4, 1, 'like', '{"source": "recommendation"}'),
        (4, 5, 'view', '{"source": "browse"}'),
        (4, 5, 'purchase', '{"source": "recommendation", "amount": 129.99}'),
        (4, 7, 'view', '{"source": "search"}'),
        (4, 7, 'like', '{"source": "recommendation"}')
      `);

      // Insert test recommendations
      await client.query(`
        INSERT INTO recommendations (user_id, product_id, score, algorithm, expires_at) VALUES
        (1, 2, 0.85, 'hybrid', NOW() + INTERVAL '24 hours'),
        (1, 4, 0.78, 'hybrid', NOW() + INTERVAL '24 hours'),
        (1, 8, 0.72, 'hybrid', NOW() + INTERVAL '24 hours'),
        (2, 1, 0.82, 'hybrid', NOW() + INTERVAL '24 hours'),
        (2, 12, 0.75, 'hybrid', NOW() + INTERVAL '24 hours'),
        (2, 15, 0.68, 'hybrid', NOW() + INTERVAL '24 hours'),
        (3, 10, 0.88, 'hybrid', NOW() + INTERVAL '24 hours'),
        (3, 14, 0.81, 'hybrid', NOW() + INTERVAL '24 hours'),
        (3, 8, 0.76, 'hybrid', NOW() + INTERVAL '24 hours'),
        (4, 2, 0.90, 'hybrid', NOW() + INTERVAL '24 hours'),
        (4, 6, 0.83, 'hybrid', NOW() + INTERVAL '24 hours'),
        (4, 8, 0.77, 'hybrid', NOW() + INTERVAL '24 hours')
      `);

      console.log('Test data seeded successfully');
    } catch (error) {
      console.error('Error seeding test data:', error);
      throw error;
    } finally {
      client.release();
      await testPool.end();
    }
  }

  async cleanupTestDatabase(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Drop test database
      await client.query(`DROP DATABASE IF EXISTS ${this.testDbName}`);
      console.log(`Test database '${this.testDbName}' cleaned up successfully`);
    } catch (error) {
      console.error('Error cleaning up test database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTestPool(): Promise<Pool> {
    return new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: this.testDbName,
      user: process.env.DB_USER || 'test',
      password: process.env.DB_PASSWORD || 'test',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const testDbSetup = new TestDatabaseSetup();
