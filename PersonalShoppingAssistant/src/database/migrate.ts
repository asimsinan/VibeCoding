/**
 * Database Migration System
 * TASK-006: Migration Setup - FR-001 through FR-007
 * 
 * This module handles database migrations with version control,
 * rollback functionality, and environment-specific configurations.
 */

import { Pool, PoolClient } from 'pg';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { databaseConnection } from '../backend/src/config/database';

export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
  executedAt?: Date;
}

export class MigrationManager {
  private pool: Pool;
  private migrationsPath: string;

  constructor(pool: Pool, migrationsPath: string = './src/database/migrations') {
    this.pool = pool;
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize migration tracking table
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          version VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Migration tracking table initialized');
    } finally {
      client.release();
    }
  }

  /**
   * Get all migration files
   */
  private getMigrationFiles(): string[] {
    try {
      const files = readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      return files;
    } catch (error) {
      console.error('Error reading migration files:', error);
      return [];
    }
  }

  /**
   * Parse migration file
   */
  private parseMigrationFile(filename: string): Migration {
    const filePath = join(this.migrationsPath, filename);
    const content = readFileSync(filePath, 'utf8');
    
    // Extract version from filename (e.g., 001_initial_schema.sql -> 001)
    const version = filename.split('_')[0];
    const name = filename.replace('.sql', '').replace(`${version}_`, '');
    
    // Split content by -- DOWN migration marker
    const parts = content.split('-- DOWN MIGRATION');
    const up = parts[0].trim();
    const down = parts[1] ? parts[1].trim() : '';
    
    return {
      version,
      name,
      up,
      down
    };
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(): Promise<Migration[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT version, name, executed_at FROM migrations ORDER BY version'
      );
      
      return result.rows.map(row => ({
        version: row.version,
        name: row.name,
        up: '',
        down: '',
        executedAt: row.executed_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const migrationFiles = this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));
    
    const pendingMigrations: Migration[] = [];
    
    for (const filename of migrationFiles) {
      const migration = this.parseMigrationFile(filename);
      
      if (!executedVersions.has(migration.version)) {
        pendingMigrations.push(migration);
      }
    }
    
    return pendingMigrations;
  }

  /**
   * Execute migration
   */
  async executeMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute UP migration
      if (migration.up) {
        await client.query(migration.up);
      }
      
      // Record migration
      await client.query(
        'INSERT INTO migrations (version, name) VALUES ($1, $2)',
        [migration.version, migration.name]
      );
      
      await client.query('COMMIT');
      
      console.log(`Migration ${migration.version}_${migration.name} executed successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Migration ${migration.version}_${migration.name} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute DOWN migration
      if (migration.down) {
        await client.query(migration.down);
      }
      
      // Remove migration record
      await client.query(
        'DELETE FROM migrations WHERE version = $1',
        [migration.version]
      );
      
      await client.query('COMMIT');
      
      console.log(`Migration ${migration.version}_${migration.name} rolled back successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Rollback of ${migration.version}_${migration.name} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    console.log('Starting database migration...');
    
    await this.initialize();
    
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations found');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
    
    console.log('Database migration completed successfully');
  }

  /**
   * Rollback last migration
   */
  async rollback(): Promise<void> {
    console.log('Rolling back last migration...');
    
    const executedMigrations = await this.getExecutedMigrations();
    
    if (executedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const migrationFiles = this.getMigrationFiles();
    const migrationFile = migrationFiles.find(f => f.startsWith(lastMigration.version));
    
    if (!migrationFile) {
      throw new Error(`Migration file for version ${lastMigration.version} not found`);
    }
    
    const migration = this.parseMigrationFile(migrationFile);
    await this.rollbackMigration(migration);
    
    console.log('Migration rollback completed successfully');
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    executed: Migration[];
    pending: Migration[];
  }> {
    await this.initialize();
    
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    
    return { executed, pending };
  }

  /**
   * Reset all migrations (DANGEROUS - for development only)
   */
  async reset(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reset is not allowed in production environment');
    }
    
    console.log('Resetting all migrations...');
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Drop all tables
      await client.query('DROP TABLE IF EXISTS migrations CASCADE');
      await client.query('DROP TABLE IF EXISTS recommendations CASCADE');
      await client.query('DROP TABLE IF EXISTS interactions CASCADE');
      await client.query('DROP TABLE IF EXISTS products CASCADE');
      await client.query('DROP TABLE IF EXISTS user_preferences CASCADE');
      await client.query('DROP TABLE IF EXISTS users CASCADE');
      
      // Drop functions
      await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
      await client.query('DROP FUNCTION IF EXISTS is_valid_email(TEXT) CASCADE');
      await client.query('DROP FUNCTION IF EXISTS get_user_interaction_stats(INTEGER) CASCADE');
      await client.query('DROP FUNCTION IF EXISTS get_product_popularity_score(INTEGER) CASCADE');
      await client.query('DROP FUNCTION IF EXISTS cleanup_expired_recommendations() CASCADE');
      await client.query('DROP FUNCTION IF EXISTS refresh_recommendation_performance() CASCADE');
      
      // Drop views
      await client.query('DROP VIEW IF EXISTS user_profiles CASCADE');
      await client.query('DROP VIEW IF EXISTS product_stats CASCADE');
      await client.query('DROP VIEW IF EXISTS active_recommendations CASCADE');
      
      // Drop materialized view
      await client.query('DROP MATERIALIZED VIEW IF EXISTS recommendation_performance CASCADE');
      
      await client.query('COMMIT');
      
      console.log('Database reset completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database reset failed:', error);
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
    const migrationManager = new MigrationManager(pool);
    
    switch (command) {
      case 'migrate':
        await migrationManager.migrate();
        break;
      case 'rollback':
        await migrationManager.rollback();
        break;
      case 'status':
        const status = await migrationManager.getStatus();
        console.log('Executed migrations:', status.executed.length);
        console.log('Pending migrations:', status.pending.length);
        break;
      case 'reset':
        await migrationManager.reset();
        break;
      default:
        console.log('Usage: npm run db:migrate [migrate|rollback|status|reset]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error);
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
