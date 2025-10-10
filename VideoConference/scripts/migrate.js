#!/usr/bin/env node

/**
 * Database Migration Script
 * Handles database schema migrations with versioning and rollback capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../src/lib/video-conferencing/services/database.service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration configuration
const MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

/**
 * Migration class
 */
class Migration {
  constructor(version, name, up, down) {
    this.version = version;
    this.name = name;
    this.up = up;
    this.down = down;
  }

  async executeUp() {
    console.log(`  ↑ Executing migration ${this.version}: ${this.name}`);
    await this.up();
  }

  async executeDown() {
    console.log(`  ↓ Rolling back migration ${this.version}: ${this.name}`);
    await this.down();
  }
}

/**
 * Migration manager
 */
class MigrationManager {
  constructor() {
    this.migrations = new Map();
  }

  /**
   * Load all migration files
   */
  async loadMigrations() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.js'))
      .sort();

    for (const file of files) {
      try {
        const migrationPath = path.join(MIGRATIONS_DIR, file);
        const migration = await import(migrationPath);
        
        if (migration.default && migration.default.version) {
          this.migrations.set(migration.default.version, migration.default);
        }
      } catch (error) {
        console.error(`Error loading migration ${file}:`, error.message);
      }
    }
  }

  /**
   * Initialize migrations table
   */
  async initializeMigrationsTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
          version VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
    } catch (error) {
      console.error('Error initializing migrations table:', error);
      throw error;
    }
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations() {
    try {
      const result = await db.query(`SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY version`);
      return result.rows.map(row => row.version);
    } catch (error) {
      console.error('Error getting executed migrations:', error);
      throw error;
    }
  }

  /**
   * Mark migration as executed
   */
  async markMigrationExecuted(version, name) {
    try {
      await db.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (version, name) VALUES ($1, $2)`,
        [version, name]
      );
    } catch (error) {
      console.error('Error marking migration as executed:', error);
      throw error;
    }
  }

  /**
   * Remove migration from executed list
   */
  async unmarkMigrationExecuted(version) {
    try {
      await db.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`, [version]);
    } catch (error) {
      console.error('Error unmarking migration as executed:', error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    console.log('🔄 Running database migrations...');
    
    try {
      await this.loadMigrations();
      await this.initializeMigrationsTable();
      const executedMigrations = await this.getExecutedMigrations();
      
      const pendingMigrations = Array.from(this.migrations.keys())
        .filter(version => !executedMigrations.includes(version))
        .sort();

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      for (const version of pendingMigrations) {
        const migration = this.migrations.get(version);
        if (migration) {
          await db.transaction(async (client) => {
            await migration.executeUp();
            await client.query(
              `INSERT INTO ${MIGRATIONS_TABLE} (version, name) VALUES ($1, $2)`,
              [version, migration.name]
            );
          });
        }
      }

      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  async rollback() {
    console.log('🔄 Rolling back last migration...');
    
    try {
      await this.loadMigrations();
      await this.initializeMigrationsTable();
      const executedMigrations = await this.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        console.log('✅ No migrations to rollback');
        return;
      }

      const lastMigrationVersion = executedMigrations[executedMigrations.length - 1];
      const migration = this.migrations.get(lastMigrationVersion);
      
      if (migration) {
        await db.transaction(async (client) => {
          await migration.executeDown();
          await client.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`, [lastMigrationVersion]);
        });
        console.log(`✅ Rolled back migration ${lastMigrationVersion}: ${migration.name}`);
      } else {
        console.log(`⚠️  Migration ${lastMigrationVersion} not found in migration files`);
      }
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Rollback all migrations
   */
  async rollbackAll() {
    console.log('🔄 Rolling back all migrations...');
    
    try {
      await this.loadMigrations();
      await this.initializeMigrationsTable();
      const executedMigrations = await this.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        console.log('✅ No migrations to rollback');
        return;
      }

      // Rollback in reverse order
      for (let i = executedMigrations.length - 1; i >= 0; i--) {
        const version = executedMigrations[i];
        const migration = this.migrations.get(version);
        
        if (migration) {
          await db.transaction(async (client) => {
            await migration.executeDown();
            await client.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`, [version]);
          });
          console.log(`✅ Rolled back migration ${version}: ${migration.name}`);
        } else {
          console.log(`⚠️  Migration ${version} not found in migration files`);
        }
      }

      console.log('✅ All migrations rolled back successfully');
    } catch (error) {
      console.error('❌ Rollback all failed:', error);
      throw error;
    }
  }

  /**
   * Show migration status
   */
  async status() {
    console.log('📊 Migration Status:');
    
    try {
      await this.loadMigrations();
      await this.initializeMigrationsTable();
      const executedMigrations = await this.getExecutedMigrations();
      
      console.log(`\n📋 Executed migrations (${executedMigrations.length}):`);
      for (const version of executedMigrations) {
        const migration = this.migrations.get(version);
        const name = migration ? migration.name : 'Unknown';
        console.log(`  ✅ ${version}: ${name}`);
      }

      const allMigrations = Array.from(this.migrations.keys()).sort();
      const pendingMigrations = allMigrations.filter(version => !executedMigrations.includes(version));
      
      console.log(`\n📋 Pending migrations (${pendingMigrations.length}):`);
      for (const version of pendingMigrations) {
        const migration = this.migrations.get(version);
        const name = migration ? migration.name : 'Unknown';
        console.log(`  ⏳ ${version}: ${name}`);
      }
    } catch (error) {
      console.error('❌ Error getting migration status:', error);
      throw error;
    }
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || 'migrate';
  
  try {
    // Initialize database
    await db.initialize();
    
    const manager = new MigrationManager();
    
    switch (command) {
      case 'migrate':
        await manager.migrate();
        break;
      case 'rollback':
        await manager.rollback();
        break;
      case 'rollback-all':
        await manager.rollbackAll();
        break;
      case 'status':
        await manager.status();
        break;
      default:
        console.log('Usage: node migrate.js [migrate|rollback|rollback-all|status]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MigrationManager, Migration };
