/**
 * Database Setup Script
 * Complete database initialization for fresh installations
 * Runs migrations and seeds initial data
 */

import { MigrationRunner } from './migrate';
import { DatabaseSeeder } from './seed';
import { logger } from '../../src/lib/food-label-scanner/utils/logger';

interface SetupOptions {
  environment?: 'development' | 'testing' | 'production';
  runMigrations?: boolean;
  seedData?: boolean;
  userCount?: number;
  scanCount?: number;
}

class DatabaseSetup {
  private migrationRunner: MigrationRunner;
  private seeder: DatabaseSeeder;

  constructor() {
    this.migrationRunner = new MigrationRunner();
    this.seeder = new DatabaseSeeder();
  }

  async setup(options: SetupOptions = {}): Promise<void> {
    const {
      environment = 'development',
      runMigrations = true,
      seedData = true,
    } = options;

    logger.info('🚀 Starting database setup...');
    logger.info(`Environment: ${environment}`);

    try {
      // Step 1: Run migrations
      if (runMigrations) {
        logger.info('📦 Running database migrations...');
        await this.migrationRunner.runMigrations();
        logger.info('✅ Migrations completed');
      }

      // Step 2: Seed initial data (only for dev/testing)
      if (seedData && environment !== 'production') {
        logger.info('🌱 Seeding initial data...');
        await this.seeder.seed(environment);
        logger.info('✅ Data seeding completed');
      } else if (environment === 'production') {
        logger.info('ℹ️  Skipping data seeding for production environment');
      }

      logger.info('✅ Database setup completed successfully');
    } catch (error: any) {
      logger.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  async verify(): Promise<boolean> {
    logger.info('🔍 Verifying database setup...');
    
    try {
      await this.migrationRunner.initialize();
      // Additional verification can be added here
      logger.info('✅ Database verification passed');
      return true;
    } catch (error: any) {
      logger.error('❌ Database verification failed:', error);
      return false;
    }
  }
}

// CLI execution
async function main() {
  const command = process.argv[2] || 'setup';
  const environment = (process.argv[3] as 'development' | 'testing' | 'production') || 'development';
  
  const setup = new DatabaseSetup();
  
  try {
    if (command === 'setup') {
      await setup.setup({ environment });
    } else if (command === 'verify') {
      const isValid = await setup.verify();
      process.exit(isValid ? 0 : 1);
    } else {
      console.error(`Unknown command: ${command}`);
      console.error('Usage: tsx setup.ts [setup|verify] [environment]');
      process.exit(1);
    }
    
    console.log('✅ Setup completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DatabaseSetup };

