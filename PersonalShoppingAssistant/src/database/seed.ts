/**
 * Database Seed Script
 * TASK-006: Migration Setup - FR-001 through FR-007
 * 
 * This script populates the database with initial test data
 * for development and testing purposes.
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { databaseConnection } from '../backend/src/config/database';

export class DatabaseSeeder {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Seed users and preferences
   */
  async seedUsers(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create test users
      const users = [
        {
          email: 'john.doe@example.com',
          password: 'password123',
          preferences: {
            categories: ['Electronics', 'Books'],
            priceRange: { min: 10, max: 500 },
            brands: ['Apple', 'Samsung', 'TechBooks'],
            stylePreferences: ['Modern', 'Minimalist']
          }
        },
        {
          email: 'jane.smith@example.com',
          password: 'password123',
          preferences: {
            categories: ['Clothing', 'Sports'],
            priceRange: { min: 20, max: 300 },
            brands: ['Nike', 'Adidas', 'Zara'],
            stylePreferences: ['Sporty', 'Casual']
          }
        },
        {
          email: 'bob.wilson@example.com',
          password: 'password123',
          preferences: {
            categories: ['Home', 'Books'],
            priceRange: { min: 5, max: 200 },
            brands: ['IKEA', 'TechBooks', 'Generic'],
            stylePreferences: ['Minimalist', 'Practical']
          }
        },
        {
          email: 'alice.brown@example.com',
          password: 'password123',
          preferences: {
            categories: ['Electronics', 'Clothing', 'Beauty'],
            priceRange: { min: 50, max: 1000 },
            brands: ['Apple', 'Nike', 'Sephora'],
            stylePreferences: ['Modern', 'Trendy', 'Luxury']
          }
        },
        {
          email: 'admin@shoppingassistant.com',
          password: 'admin123',
          preferences: {
            categories: ['Electronics', 'Books', 'Clothing', 'Home'],
            priceRange: { min: 0, max: 2000 },
            brands: ['Apple', 'Samsung', 'Nike', 'IKEA'],
            stylePreferences: ['Modern', 'Minimalist', 'Practical']
          }
        }
      ];

      for (const userData of users) {
        const passwordHash = await this.hashPassword(userData.password);
        
        // Insert user
        const userResult = await client.query(
          'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
          [userData.email, passwordHash]
        );
        
        const userId = userResult.rows[0].id;
        
        // Insert user preferences
        await client.query(
          `INSERT INTO user_preferences 
           (user_id, categories, price_range_min, price_range_max, brands, style_preferences) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            userData.preferences.categories,
            userData.preferences.priceRange.min,
            userData.preferences.priceRange.max,
            userData.preferences.brands,
            userData.preferences.stylePreferences
          ]
        );
      }
      
      await client.query('COMMIT');
      console.log('Users seeded successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error seeding users:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed products
   */
  async seedProducts(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const products = [
        // Electronics
        {
          name: 'iPhone 15 Pro',
          description: 'Latest Apple iPhone with titanium design and advanced camera system',
          price: 999.99,
          category: 'Electronics',
          brand: 'Apple',
          imageUrl: 'https://example.com/iphone15pro.jpg',
          availability: true
        },
        {
          name: 'Samsung Galaxy S24 Ultra',
          description: 'Samsung flagship smartphone with S Pen and advanced AI features',
          price: 1199.99,
          category: 'Electronics',
          brand: 'Samsung',
          imageUrl: 'https://example.com/galaxy-s24-ultra.jpg',
          availability: true
        },
        {
          name: 'MacBook Pro 16-inch',
          description: 'Apple MacBook Pro with M3 Pro chip and Liquid Retina XDR display',
          price: 2499.99,
          category: 'Electronics',
          brand: 'Apple',
          imageUrl: 'https://example.com/macbook-pro-16.jpg',
          availability: true
        },
        {
          name: 'iPad Air',
          description: 'Apple iPad Air with M2 chip and 10.9-inch Liquid Retina display',
          price: 599.99,
          category: 'Electronics',
          brand: 'Apple',
          imageUrl: 'https://example.com/ipad-air.jpg',
          availability: true
        },
        {
          name: 'Sony WH-1000XM5',
          description: 'Industry-leading noise canceling wireless headphones',
          price: 399.99,
          category: 'Electronics',
          brand: 'Sony',
          imageUrl: 'https://example.com/sony-wh1000xm5.jpg',
          availability: true
        },
        {
          name: 'Samsung 55" QLED TV',
          description: '4K QLED Smart TV with Quantum Dot technology',
          price: 899.99,
          category: 'Electronics',
          brand: 'Samsung',
          imageUrl: 'https://example.com/samsung-qled-tv.jpg',
          availability: true
        },
        
        // Books
        {
          name: 'TypeScript Handbook',
          description: 'Complete guide to TypeScript programming language',
          price: 49.99,
          category: 'Books',
          brand: 'TechBooks',
          imageUrl: 'https://example.com/typescript-handbook.jpg',
          availability: true
        },
        {
          name: 'React Guide',
          description: 'Learn React development from basics to advanced concepts',
          price: 39.99,
          category: 'Books',
          brand: 'TechBooks',
          imageUrl: 'https://example.com/react-guide.jpg',
          availability: true
        },
        {
          name: 'JavaScript: The Good Parts',
          description: 'Classic guide to JavaScript programming best practices',
          price: 29.99,
          category: 'Books',
          brand: 'TechBooks',
          imageUrl: 'https://example.com/javascript-good-parts.jpg',
          availability: true
        },
        {
          name: 'Clean Code',
          description: 'A Handbook of Agile Software Craftsmanship',
          price: 44.99,
          category: 'Books',
          brand: 'TechBooks',
          imageUrl: 'https://example.com/clean-code.jpg',
          availability: true
        },
        
        // Clothing
        {
          name: 'Nike Air Max 270',
          description: 'Comfortable running shoes with Max Air cushioning',
          price: 129.99,
          category: 'Clothing',
          brand: 'Nike',
          imageUrl: 'https://example.com/nike-air-max-270.jpg',
          availability: true
        },
        {
          name: 'Adidas Ultraboost 22',
          description: 'High-performance running shoes with Boost midsole',
          price: 149.99,
          category: 'Clothing',
          brand: 'Adidas',
          imageUrl: 'https://example.com/adidas-ultraboost-22.jpg',
          availability: true
        },
        {
          name: 'Nike Dri-FIT T-Shirt',
          description: 'Moisture-wicking athletic t-shirt',
          price: 29.99,
          category: 'Clothing',
          brand: 'Nike',
          imageUrl: 'https://example.com/nike-dri-fit-tshirt.jpg',
          availability: true
        },
        {
          name: 'Zara Denim Jacket',
          description: 'Classic denim jacket with modern fit',
          price: 79.99,
          category: 'Clothing',
          brand: 'Zara',
          imageUrl: 'https://example.com/zara-denim-jacket.jpg',
          availability: true
        },
        
        // Home
        {
          name: 'IKEA HEMNES Desk',
          description: 'Modern wooden desk with drawers and storage',
          price: 199.99,
          category: 'Home',
          brand: 'IKEA',
          imageUrl: 'https://example.com/ikea-hemnes-desk.jpg',
          availability: true
        },
        {
          name: 'IKEA MARKUS Office Chair',
          description: 'Ergonomic office chair with adjustable height',
          price: 149.99,
          category: 'Home',
          brand: 'IKEA',
          imageUrl: 'https://example.com/ikea-markus-chair.jpg',
          availability: true
        },
        {
          name: 'IKEA FADO Table Lamp',
          description: 'Modern table lamp with LED bulb',
          price: 39.99,
          category: 'Home',
          brand: 'IKEA',
          imageUrl: 'https://example.com/ikea-fado-lamp.jpg',
          availability: true
        },
        {
          name: 'IKEA MALM Bed Frame',
          description: 'Platform bed frame with headboard',
          price: 299.99,
          category: 'Home',
          brand: 'IKEA',
          imageUrl: 'https://example.com/ikea-malm-bed.jpg',
          availability: true
        },
        
        // Sports
        {
          name: 'Nike Basketball',
          description: 'Official size basketball for indoor and outdoor play',
          price: 24.99,
          category: 'Sports',
          brand: 'Nike',
          imageUrl: 'https://example.com/nike-basketball.jpg',
          availability: true
        },
        {
          name: 'Adidas Soccer Ball',
          description: 'Professional soccer ball for training and matches',
          price: 34.99,
          category: 'Sports',
          brand: 'Adidas',
          imageUrl: 'https://example.com/adidas-soccer-ball.jpg',
          availability: true
        },
        {
          name: 'Nike Yoga Mat',
          description: 'Non-slip yoga mat for fitness and meditation',
          price: 49.99,
          category: 'Sports',
          brand: 'Nike',
          imageUrl: 'https://example.com/nike-yoga-mat.jpg',
          availability: true
        },
        
        // Beauty
        {
          name: 'Sephora Foundation',
          description: 'Full coverage foundation with natural finish',
          price: 39.99,
          category: 'Beauty',
          brand: 'Sephora',
          imageUrl: 'https://example.com/sephora-foundation.jpg',
          availability: true
        },
        {
          name: 'MAC Lipstick',
          description: 'Long-wearing matte lipstick in classic red',
          price: 19.99,
          category: 'Beauty',
          brand: 'MAC',
          imageUrl: 'https://example.com/mac-lipstick.jpg',
          availability: true
        }
      ];

      for (const product of products) {
        await client.query(
          `INSERT INTO products (name, description, price, category, brand, image_url, availability) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            product.name,
            product.description,
            product.price,
            product.category,
            product.brand,
            product.imageUrl,
            product.availability
          ]
        );
      }
      
      await client.query('COMMIT');
      console.log('Products seeded successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error seeding products:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed interactions
   */
  async seedInteractions(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get user and product IDs
      const usersResult = await client.query('SELECT id FROM users ORDER BY id');
      const productsResult = await client.query('SELECT id FROM products ORDER BY id');
      
      const userIds = usersResult.rows.map(row => row.id);
      const productIds = productsResult.rows.map(row => row.id);
      
      // Create realistic interaction patterns
      const interactions = [];
      
      // User 1 (john.doe) - Electronics and Books lover
      interactions.push(
        { userId: userIds[0], productId: productIds[0], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[0], productId: productIds[0], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[0], productId: productIds[2], type: 'view', metadata: { source: 'browse' } },
        { userId: userIds[0], productId: productIds[2], type: 'purchase', metadata: { source: 'recommendation', amount: 2499.99 } },
        { userId: userIds[0], productId: productIds[6], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[0], productId: productIds[6], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[0], productId: productIds[7], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[0], productId: productIds[7], type: 'purchase', metadata: { source: 'recommendation', amount: 39.99 } }
      );
      
      // User 2 (jane.smith) - Clothing and Sports enthusiast
      interactions.push(
        { userId: userIds[1], productId: productIds[10], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[1], productId: productIds[10], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[1], productId: productIds[10], type: 'purchase', metadata: { source: 'recommendation', amount: 129.99 } },
        { userId: userIds[1], productId: productIds[11], type: 'view', metadata: { source: 'browse' } },
        { userId: userIds[1], productId: productIds[11], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[1], productId: productIds[12], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[1], productId: productIds[12], type: 'purchase', metadata: { source: 'recommendation', amount: 29.99 } },
        { userId: userIds[1], productId: productIds[17], type: 'view', metadata: { source: 'browse' } },
        { userId: userIds[1], productId: productIds[17], type: 'like', metadata: { source: 'recommendation' } }
      );
      
      // User 3 (bob.wilson) - Home and Books shopper
      interactions.push(
        { userId: userIds[2], productId: productIds[14], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[2], productId: productIds[14], type: 'purchase', metadata: { source: 'recommendation', amount: 199.99 } },
        { userId: userIds[2], productId: productIds[15], type: 'view', metadata: { source: 'browse' } },
        { userId: userIds[2], productId: productIds[15], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[2], productId: productIds[8], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[2], productId: productIds[8], type: 'purchase', metadata: { source: 'recommendation', amount: 29.99 } },
        { userId: userIds[2], productId: productIds[9], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[2], productId: productIds[9], type: 'like', metadata: { source: 'recommendation' } }
      );
      
      // User 4 (alice.brown) - Diverse interests
      interactions.push(
        { userId: userIds[3], productId: productIds[1], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[3], productId: productIds[1], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[3], productId: productIds[3], type: 'view', metadata: { source: 'browse' } },
        { userId: userIds[3], productId: productIds[3], type: 'purchase', metadata: { source: 'recommendation', amount: 599.99 } },
        { userId: userIds[3], productId: productIds[13], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[3], productId: productIds[13], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[3], productId: productIds[20], type: 'view', metadata: { source: 'browse' } },
        { userId: userIds[3], productId: productIds[20], type: 'purchase', metadata: { source: 'recommendation', amount: 39.99 } }
      );
      
      // User 5 (admin) - Broad interests
      interactions.push(
        { userId: userIds[4], productId: productIds[0], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[4], productId: productIds[0], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[4], productId: productIds[2], type: 'view', metadata: { source: 'browse' } },
        { userId: userIds[4], productId: productIds[2], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[4], productId: productIds[6], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[4], productId: productIds[6], type: 'purchase', metadata: { source: 'recommendation', amount: 49.99 } },
        { userId: userIds[4], productId: productIds[10], type: 'view', metadata: { source: 'browse' } },
        { userId: userIds[4], productId: productIds[10], type: 'like', metadata: { source: 'recommendation' } },
        { userId: userIds[4], productId: productIds[14], type: 'view', metadata: { source: 'search' } },
        { userId: userIds[4], productId: productIds[14], type: 'like', metadata: { source: 'recommendation' } }
      );
      
      // Insert interactions
      for (const interaction of interactions) {
        await client.query(
          `INSERT INTO interactions (user_id, product_id, type, metadata) 
           VALUES ($1, $2, $3, $4)`,
          [
            interaction.userId,
            interaction.productId,
            interaction.type,
            JSON.stringify(interaction.metadata)
          ]
        );
      }
      
      await client.query('COMMIT');
      console.log('Interactions seeded successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error seeding interactions:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed recommendations
   */
  async seedRecommendations(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get user and product IDs
      const usersResult = await client.query('SELECT id FROM users ORDER BY id');
      const productsResult = await client.query('SELECT id FROM products ORDER BY id');
      
      const userIds = usersResult.rows.map(row => row.id);
      const productIds = productsResult.rows.map(row => row.id);
      
      // Create sample recommendations
      const recommendations = [];
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // User 1 recommendations (Electronics and Books)
      recommendations.push(
        { userId: userIds[0], productId: productIds[1], score: 0.85, algorithm: 'hybrid' },
        { userId: userIds[0], productId: productIds[3], score: 0.78, algorithm: 'hybrid' },
        { userId: userIds[0], productId: productIds[4], score: 0.72, algorithm: 'hybrid' },
        { userId: userIds[0], productId: productIds[8], score: 0.68, algorithm: 'hybrid' }
      );
      
      // User 2 recommendations (Clothing and Sports)
      recommendations.push(
        { userId: userIds[1], productId: productIds[11], score: 0.90, algorithm: 'hybrid' },
        { userId: userIds[1], productId: productIds[12], score: 0.82, algorithm: 'hybrid' },
        { userId: userIds[1], productId: productIds[13], score: 0.75, algorithm: 'hybrid' },
        { userId: userIds[1], productId: productIds[17], score: 0.70, algorithm: 'hybrid' }
      );
      
      // User 3 recommendations (Home and Books)
      recommendations.push(
        { userId: userIds[2], productId: productIds[15], score: 0.88, algorithm: 'hybrid' },
        { userId: userIds[2], productId: productIds[16], score: 0.81, algorithm: 'hybrid' },
        { userId: userIds[2], productId: productIds[17], score: 0.76, algorithm: 'hybrid' },
        { userId: userIds[2], productId: productIds[9], score: 0.73, algorithm: 'hybrid' }
      );
      
      // User 4 recommendations (Diverse)
      recommendations.push(
        { userId: userIds[3], productId: productIds[0], score: 0.92, algorithm: 'hybrid' },
        { userId: userIds[3], productId: productIds[2], score: 0.85, algorithm: 'hybrid' },
        { userId: userIds[3], productId: productIds[13], score: 0.79, algorithm: 'hybrid' },
        { userId: userIds[3], productId: productIds[20], score: 0.74, algorithm: 'hybrid' }
      );
      
      // User 5 recommendations (Admin - Broad)
      recommendations.push(
        { userId: userIds[4], productId: productIds[1], score: 0.89, algorithm: 'hybrid' },
        { userId: userIds[4], productId: productIds[3], score: 0.83, algorithm: 'hybrid' },
        { userId: userIds[4], productId: productIds[7], score: 0.77, algorithm: 'hybrid' },
        { userId: userIds[4], productId: productIds[11], score: 0.71, algorithm: 'hybrid' },
        { userId: userIds[4], productId: productIds[15], score: 0.68, algorithm: 'hybrid' }
      );
      
      // Insert recommendations
      for (const rec of recommendations) {
        await client.query(
          `INSERT INTO recommendations (user_id, product_id, score, algorithm, expires_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            rec.userId,
            rec.productId,
            rec.score,
            rec.algorithm,
            expiresAt
          ]
        );
      }
      
      await client.query('COMMIT');
      console.log('Recommendations seeded successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error seeding recommendations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all seed operations
   */
  async seed(): Promise<void> {
    console.log('Starting database seeding...');
    
    try {
      await this.seedUsers();
      await this.seedProducts();
      await this.seedInteractions();
      await this.seedRecommendations();
      
      console.log('Database seeding completed successfully');
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear in reverse order due to foreign key constraints
      await client.query('DELETE FROM recommendations');
      await client.query('DELETE FROM interactions');
      await client.query('DELETE FROM products');
      await client.query('DELETE FROM user_preferences');
      await client.query('DELETE FROM users');
      
      await client.query('COMMIT');
      console.log('Database cleared successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error clearing database:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  
  try {
    await databaseConnection.initialize();
    const pool = databaseConnection.getPool();
    const seeder = new DatabaseSeeder(pool);
    
    switch (command) {
      case 'seed':
        await seeder.seed();
        break;
      case 'clear':
        await seeder.clear();
        break;
      default:
        console.log('Usage: npm run db:seed [seed|clear]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await databaseConnection.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export is already declared above
