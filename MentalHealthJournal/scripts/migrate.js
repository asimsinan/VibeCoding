#!/usr/bin/env node
/**
 * Database Migration Script
 * 
 * Handles database migrations for both IndexedDB and PostgreSQL.
 * Supports version control and rollback strategies.
 * 
 * @fileoverview Database migration management
 * @author Mental Health Journal App
 * @version 1.0.0
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class MigrationManager {
  constructor() {
    this.migrations = [];
    this.loadMigrations();
  }

  /**
   * Load available migrations
   */
  loadMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, creating...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    this.migrations = files.map(file => {
      const version = file.split('-')[0];
      const name = file.replace('.sql', '').replace(`${version}-`, '');
      return {
        version: parseInt(version),
        name,
        file: path.join(migrationsDir, file),
      };
    });

    console.log(`Loaded ${this.migrations.length} migrations`);
  }

  /**
   * Run migrations
   */
  async runMigrations() {
    console.log('Starting database migrations...');

    // Check if PostgreSQL is configured
    const postgresConfig = this.getPostgresConfig();
    if (postgresConfig) {
      await this.runPostgresMigrations(postgresConfig);
    } else {
      console.log('PostgreSQL not configured, skipping cloud migrations');
    }

    console.log('Migrations completed successfully');
  }

  /**
   * Get PostgreSQL configuration from environment
   */
  getPostgresConfig() {
    const {
      DATABASE_URL,
      POSTGRES_HOST,
      POSTGRES_PORT,
      POSTGRES_DB,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_SSL,
    } = process.env;

    if (DATABASE_URL) {
      try {
        const url = new URL(DATABASE_URL);
        return {
          host: url.hostname,
          port: parseInt(url.port || '5432', 10),
          database: url.pathname.slice(1),
          user: url.username,
          password: url.password,
          ssl: url.protocol === 'postgresql+ssl:' || url.searchParams.get('sslmode') === 'require',
        };
      } catch (error) {
        console.error('Invalid DATABASE_URL:', error.message);
        return null;
      }
    }

    if (POSTGRES_HOST && POSTGRES_USER && POSTGRES_PASSWORD) {
      return {
        host: POSTGRES_HOST,
        port: parseInt(POSTGRES_PORT || '5432', 10),
        database: POSTGRES_DB || 'moodtracker',
        user: POSTGRES_USER,
        password: POSTGRES_PASSWORD,
        ssl: POSTGRES_SSL === 'true',
      };
    }

    return null;
  }

  /**
   * Run PostgreSQL migrations
   */
  async runPostgresMigrations(config) {
    const pool = new Pool(config);
    const client = await pool.connect();

    try {
      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Get applied migrations
      const appliedResult = await client.query(
        'SELECT version FROM schema_migrations ORDER BY version'
      );
      const appliedVersions = appliedResult.rows.map(row => row.version);

      // Find pending migrations
      const pendingMigrations = this.migrations.filter(
        migration => !appliedVersions.includes(migration.version)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations`);

      // Apply each migration
      for (const migration of pendingMigrations) {
        console.log(`Applying migration ${migration.version}: ${migration.name}`);
        
        try {
          await client.query('BEGIN');
          
          // Read and execute migration file
          const sql = fs.readFileSync(migration.file, 'utf8');
          await client.query(sql);
          
          // Record migration as applied
          await client.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [migration.version, migration.name]
          );
          
          await client.query('COMMIT');
          console.log(`✓ Applied migration ${migration.version}: ${migration.name}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`✗ Failed to apply migration ${migration.version}: ${error.message}`);
          throw error;
        }
      }
    } finally {
      client.release();
      await pool.end();
    }
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations(count = 1) {
    console.log(`Rolling back ${count} migration(s)...`);

    const postgresConfig = this.getPostgresConfig();
    if (!postgresConfig) {
      console.log('PostgreSQL not configured, cannot rollback');
      return;
    }

    const pool = new Pool(postgresConfig);
    const client = await pool.connect();

    try {
      // Get applied migrations in reverse order
      const appliedResult = await client.query(
        'SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT $1',
        [count]
      );

      if (appliedResult.rows.length === 0) {
        console.log('No migrations to rollback');
        return;
      }

      for (const migration of appliedResult.rows) {
        console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
        
        try {
          await client.query('BEGIN');
          
          // Find rollback file
          const rollbackFile = path.join(
            __dirname, 
            'migrations', 
            `${migration.version}-${migration.name}-rollback.sql`
          );

          if (fs.existsSync(rollbackFile)) {
            const sql = fs.readFileSync(rollbackFile, 'utf8');
            await client.query(sql);
          } else {
            console.warn(`No rollback file found for migration ${migration.version}`);
          }
          
          // Remove migration record
          await client.query(
            'DELETE FROM schema_migrations WHERE version = $1',
            [migration.version]
          );
          
          await client.query('COMMIT');
          console.log(`✓ Rolled back migration ${migration.version}: ${migration.name}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`✗ Failed to rollback migration ${migration.version}: ${error.message}`);
          throw error;
        }
      }
    } finally {
      client.release();
      await pool.end();
    }
  }

  /**
   * Show migration status
   */
  async showStatus() {
    console.log('Migration Status:');
    console.log('================');

    const postgresConfig = this.getPostgresConfig();
    if (!postgresConfig) {
      console.log('PostgreSQL not configured');
      return;
    }

    const pool = new Pool(postgresConfig);
    const client = await pool.connect();

    try {
      // Get applied migrations
      const appliedResult = await client.query(
        'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
      );

      console.log('\nApplied Migrations:');
      if (appliedResult.rows.length === 0) {
        console.log('  None');
      } else {
        appliedResult.rows.forEach(row => {
          console.log(`  ${row.version}: ${row.name} (${row.applied_at})`);
        });
      }

      // Show pending migrations
      const appliedVersions = appliedResult.rows.map(row => row.version);
      const pendingMigrations = this.migrations.filter(
        migration => !appliedVersions.includes(migration.version)
      );

      console.log('\nPending Migrations:');
      if (pendingMigrations.length === 0) {
        console.log('  None');
      } else {
        pendingMigrations.forEach(migration => {
          console.log(`  ${migration.version}: ${migration.name}`);
        });
      }
    } finally {
      client.release();
      await pool.end();
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const manager = new MigrationManager();

  try {
    switch (command) {
      case 'up':
        await manager.runMigrations();
        break;
      case 'down':
        const count = parseInt(process.argv[3] || '1', 10);
        await manager.rollbackMigrations(count);
        break;
      case 'status':
        await manager.showStatus();
        break;
      default:
        console.log(`
Database Migration Tool

Usage:
  node scripts/migrate.js <command> [options]

Commands:
  up [count]     Apply pending migrations
  down [count]   Rollback migrations (default: 1)
  status         Show migration status

Examples:
  node scripts/migrate.js up
  node scripts/migrate.js down 2
  node scripts/migrate.js status
`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationManager };
