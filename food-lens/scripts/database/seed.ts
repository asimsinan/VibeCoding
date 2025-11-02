/**
 * Database Seeding Script
 * Generates initial data for development and testing environments
 */

import { initializeFirebase, getFirestoreInstance } from '../../src/lib/food-label-scanner/config/firebase';
import { collection, doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { User } from '../../src/lib/food-label-scanner/models/User';
import { FoodScan } from '../../src/lib/food-label-scanner/models/FoodScan';
import { NutritionInfo } from '../../src/lib/food-label-scanner/models/NutritionInfo';
import { AllergenInfo } from '../../src/lib/food-label-scanner/models/AllergenInfo';
import { logger } from '../../src/lib/food-label-scanner/utils/logger';

interface SeedData {
  users: Array<Partial<User>>;
  scans: Array<Partial<FoodScan>>;
}

class DatabaseSeeder {
  private db: any;

  async initialize(): Promise<void> {
    await initializeFirebase();
    this.db = getFirestoreInstance();
  }

  generateSampleUsers(count: number = 5): Array<Partial<User>> {
    const users: Array<Partial<User>> = [];
    const names = [
      { displayName: 'John Doe', email: 'john@example.com' },
      { displayName: 'Jane Smith', email: 'jane@example.com' },
      { displayName: 'Bob Johnson', email: 'bob@example.com' },
      { displayName: 'Alice Williams', email: 'alice@example.com' },
      { displayName: 'Charlie Brown', email: 'charlie@example.com' },
    ];

    for (let i = 0; i < Math.min(count, names.length); i++) {
      users.push({
        uid: `seed_user_${i + 1}`,
        email: names[i].email,
        displayName: names[i].displayName,
        language: i % 2 === 0 ? 'en' : 'tr',
        dietaryRestrictions: i === 0 ? ['peanuts', 'dairy'] : [],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        lastLoginAt: new Date(),
        stats: {
          totalScans: Math.floor(Math.random() * 50),
          lastScanAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return users;
  }

  generateSampleScans(userIds: string[], count: number = 20): Array<Partial<FoodScan>> {
    const scans: Array<Partial<FoodScan>> = [];
    const foodItems = [
      { name: 'Chocolate Chip Cookies', brand: 'Generic', calories: 150 },
      { name: 'Whole Wheat Bread', brand: 'Bakery Fresh', calories: 80 },
      { name: 'Greek Yogurt', brand: 'Healthy Choice', calories: 120 },
      { name: 'Granola Bar', brand: 'Nature Valley', calories: 200 },
      { name: 'Apple', brand: 'Fresh Farm', calories: 95 },
      { name: 'Banana', brand: 'Fresh Farm', calories: 105 },
      { name: 'Orange Juice', brand: 'Tropicana', calories: 110 },
      { name: 'Milk', brand: 'Dairy Fresh', calories: 150 },
      { name: 'Eggs', brand: 'Farm Fresh', calories: 70 },
      { name: 'Cereal', brand: 'Kellogg\'s', calories: 180 },
    ];

    const statuses: Array<'pending' | 'processing' | 'completed' | 'failed'> = [
      'completed',
      'completed',
      'completed',
      'pending',
      'processing',
    ];

    for (let i = 0; i < count; i++) {
      const foodItem = foodItems[Math.floor(Math.random() * foodItems.length)];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      const scan: Partial<FoodScan> = {
        scanId: `seed_scan_${i + 1}`,
        userId,
        imageUrl: 'data:placeholder',
        imageMetadata: {
          size: 1024 * 1024,
          format: 'jpeg' as const,
          width: 1920,
          height: 1080,
          uploadedAt: createdAt,
        },
        language: i % 2 === 0 ? 'en' : 'tr',
        status: status as any,
        createdAt,
        processedAt: status === 'completed' ? new Date(createdAt.getTime() + 30000) : null,
      };

      if (status === 'completed') {
        scan.nutritionData = new NutritionInfo(
          foodItem.name,
          '1 serving',
          foodItem.calories,
          {
            protein: Math.floor(Math.random() * 20) + 5,
            carbs: Math.floor(Math.random() * 40) + 10,
            fat: Math.floor(Math.random() * 15) + 3,
            fiber: Math.floor(Math.random() * 10),
            sodium: Math.floor(Math.random() * 500) + 50,
            sugar: Math.floor(Math.random() * 30) + 5,
            saturatedFat: Math.floor(Math.random() * 10),
            transFat: 0,
          }
        );

        scan.allergens = [];
        if (foodItem.name.includes('Chocolate') || Math.random() > 0.7) {
          scan.allergens.push(new AllergenInfo('Milk', 'medium', 'Contains dairy'));
        }
        if (foodItem.name.includes('Bread') || foodItem.name.includes('Cereal')) {
          scan.allergens.push(new AllergenInfo('Wheat', 'high', 'Contains gluten'));
        }
        if (foodItem.name.includes('Cookies') && Math.random() > 0.5) {
          scan.allergens.push(new AllergenInfo('Eggs', 'low', 'May contain eggs'));
        }
      }

      scans.push(scan);
    }

    return scans;
  }

  async seedUsers(users: Array<Partial<User>>): Promise<void> {
    logger.info(`Seeding ${users.length} users...`);
    const batch = writeBatch(this.db);
    
    for (const user of users) {
      const userRef = doc(collection(this.db, 'users'), user.uid);
      batch.set(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        language: user.language || 'en',
        dietaryRestrictions: user.dietaryRestrictions || [],
        createdAt: Timestamp.fromDate(user.createdAt || new Date()),
        lastLoginAt: Timestamp.fromDate(user.lastLoginAt || new Date()),
        preferences: user.preferences || {},
        stats: {
          totalScans: user.stats?.totalScans || 0,
          lastScanAt: user.stats?.lastScanAt ? Timestamp.fromDate(user.stats.lastScanAt) : null,
        },
      });
    }
    
    await batch.commit();
    logger.info(`✅ Seeded ${users.length} users`);
  }

  async seedScans(scans: Array<Partial<FoodScan>>): Promise<void> {
    logger.info(`Seeding ${scans.length} scans...`);
    const batchSize = 500; // Firestore batch limit
    
    for (let i = 0; i < scans.length; i += batchSize) {
      const batch = writeBatch(this.db);
      const batchScans = scans.slice(i, i + batchSize);
      
      for (const scan of batchScans) {
        const scanRef = doc(collection(this.db, 'scans'), scan.scanId);
        batch.set(scanRef, {
          scanId: scan.scanId,
          userId: scan.userId,
          status: scan.status,
          imageUrl: scan.imageUrl || 'data:placeholder',
          imageData: scan.imageData || null,
          imageMetadata: {
            ...scan.imageMetadata!,
            uploadedAt: Timestamp.fromDate(scan.imageMetadata!.uploadedAt),
          },
          language: scan.language || 'en',
          createdAt: Timestamp.fromDate(scan.createdAt || new Date()),
          processedAt: scan.processedAt ? Timestamp.fromDate(scan.processedAt) : null,
          nutritionData: scan.nutritionData?.toJSON() || null,
          allergens: scan.allergens?.map(a => a.toJSON()) || [],
          alternatives: scan.alternatives?.map(a => a.toJSON()) || null,
          error: scan.error || null,
        });
      }
      
      await batch.commit();
      logger.info(`✅ Seeded batch ${Math.floor(i / batchSize) + 1} (${batchScans.length} scans)`);
    }
    
    logger.info(`✅ Seeded ${scans.length} scans`);
  }

  async seed(environment: 'development' | 'testing' = 'development'): Promise<void> {
    logger.info(`Starting database seeding for ${environment} environment...`);
    
    await this.initialize();
    
    const userCount = environment === 'development' ? 5 : 10;
    const scanCount = environment === 'development' ? 20 : 50;
    
    // Generate sample data
    const users = this.generateSampleUsers(userCount);
    const scans = this.generateSampleScans(users.map(u => u.uid!), scanCount);
    
    // Seed database
    await this.seedUsers(users);
    await this.seedScans(scans);
    
    logger.info('✅ Database seeding completed');
  }

  async clear(): Promise<void> {
    logger.warn('⚠️  Clearing all seeded data...');
    
    await this.initialize();
    
    // Note: In production, this would be more sophisticated
    // For now, this is a placeholder - actual clearing would require
    // batch deletion of documents
    logger.warn('Manual cleanup required - use Firebase Console to delete documents');
  }
}

// CLI execution
async function main() {
  const command = process.argv[2] || 'seed';
  const environment = (process.argv[3] as 'development' | 'testing') || 'development';
  const seeder = new DatabaseSeeder();
  
  try {
    if (command === 'seed') {
      await seeder.seed(environment);
    } else if (command === 'clear') {
      await seeder.clear();
    } else {
      console.error(`Unknown command: ${command}`);
      console.error('Usage: tsx seed.ts [seed|clear] [development|testing]');
      process.exit(1);
    }
    
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DatabaseSeeder };

