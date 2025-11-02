/**
 * Database Migration Script
 * Sets up Firestore database structure and indexes for Food Lens
 * 
 * Note: Firestore is schemaless, but we ensure proper collection structure
 * and create necessary indexes for optimal query performance.
 */

import { initializeFirebase, getFirestoreInstance } from '../../src/lib/food-label-scanner/config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { logger } from '../../src/lib/food-label-scanner/utils/logger';

interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

class MigrationRunner {
  private db: any;
  private migrations: Migration[] = [];

  constructor() {
    this.migrations = [
      {
        version: '1.0.0',
        description: 'Initial database schema setup',
        up: async () => await this.migration_1_0_0(),
      },
      {
        version: '1.1.0',
        description: 'Add indexes for scan queries',
        up: async () => await this.migration_1_1_0(),
      },
    ];
  }

  private async migration_1_0_0(): Promise<void> {
    logger.info('Running migration 1.0.0: Initial database schema setup');
    
    // Create collections structure documentation
    // Firestore creates collections on first write, so we create sample documents
    // to ensure collections exist
    
    const collections = ['users', 'scans', 'alternatives'];
    
    for (const collectionName of collections) {
      const ref = collection(this.db, collectionName);
      const sampleDoc = doc(ref, '__schema__');
      
      // Check if collection already has documents
      const snapshot = await getDocs(query(ref, limit(1)));
      
      if (snapshot.empty) {
        // Create schema marker document
        await setDoc(sampleDoc, {
          _schemaVersion: '1.0.0',
          _createdAt: new Date(),
          _type: 'schema_marker',
        });
        logger.info(`Created schema marker for collection: ${collectionName}`);
      } else {
        logger.info(`Collection ${collectionName} already has documents`);
      }
    }
    
    logger.info('Migration 1.0.0 completed');
  }

  private async migration_1_1_0(): Promise<void> {
    logger.info('Running migration 1.1.0: Add indexes for scan queries');
    
    // Note: Firestore composite indexes must be created manually in Firebase Console
    // This migration documents required indexes and verifies collection structure
    
    const requiredIndexes = [
      {
        collection: 'scans',
        fields: [
          { field: 'userId', order: 'ASC' },
          { field: 'createdAt', order: 'DESC' },
        ],
        description: 'Index for user scan history queries',
      },
      {
        collection: 'scans',
        fields: [
          { field: 'status', order: 'ASC' },
          { field: 'createdAt', order: 'DESC' },
        ],
        description: 'Index for pending scan processing',
      },
    ];
    
    logger.info('Required Firestore indexes:');
    requiredIndexes.forEach(index => {
      logger.info(`  Collection: ${index.collection}`);
      logger.info(`  Fields: ${index.fields.map(f => `${f.field} ${f.order}`).join(', ')}`);
      logger.info(`  Description: ${index.description}`);
    });
    
    logger.info('Note: Indexes must be created manually in Firebase Console');
    logger.info('Migration 1.1.0 completed');
  }

  async initialize(): Promise<void> {
    await initializeFirebase();
    this.db = getFirestoreInstance();
  }

  async runMigrations(): Promise<void> {
    logger.info('Starting database migrations...');
    
    await this.initialize();
    
    // Check migration status
    const migrationStatusRef = doc(this.db, '_migrations', 'status');
    const statusDoc = await getDoc(migrationStatusRef);
    const currentVersion = statusDoc.exists() ? statusDoc.data()?.version : '0.0.0';
    
    logger.info(`Current database version: ${currentVersion}`);
    
    // Run pending migrations
    for (const migration of this.migrations) {
      if (this.compareVersions(migration.version, currentVersion) > 0) {
        logger.info(`Running migration ${migration.version}: ${migration.description}`);
        try {
          await migration.up();
          
          // Update migration status
          await setDoc(migrationStatusRef, {
            version: migration.version,
            lastMigration: migration.description,
            migratedAt: new Date(),
          });
          
          logger.info(`Migration ${migration.version} completed successfully`);
        } catch (error: any) {
          logger.error(`Migration ${migration.version} failed:`, error);
          throw error;
        }
      } else {
        logger.info(`Migration ${migration.version} already applied, skipping`);
      }
    }
    
    logger.info('All migrations completed');
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  async rollback(version: string): Promise<void> {
    logger.info(`Rolling back to version ${version}...`);
    
    await this.initialize();
    
    // Find and run rollback migrations
    for (let i = this.migrations.length - 1; i >= 0; i--) {
      const migration = this.migrations[i];
      
      if (this.compareVersions(migration.version, version) > 0 && migration.down) {
        logger.info(`Rolling back migration ${migration.version}`);
        await migration.down();
      }
    }
    
    logger.info('Rollback completed');
  }
}

// CLI execution
async function main() {
  const command = process.argv[2] || 'migrate';
  const runner = new MigrationRunner();
  
  try {
    if (command === 'migrate') {
      await runner.runMigrations();
    } else if (command === 'rollback') {
      const version = process.argv[3] || '0.0.0';
      await runner.rollback(version);
    } else {
      console.error(`Unknown command: ${command}`);
      console.error('Usage: tsx migrate.ts [migrate|rollback] [version]');
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { MigrationRunner };

