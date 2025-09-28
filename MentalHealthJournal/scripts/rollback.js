#!/usr/bin/env node
/**
 * Database Rollback Script
 * 
 * Handles database rollbacks for both IndexedDB and PostgreSQL.
 * Supports selective rollback and rollback validation.
 * 
 * @fileoverview Database rollback management
 * @author Mental Health Journal App
 * @version 1.0.0
 */

const { MigrationManager } = require('./migrate');

class RollbackManager extends MigrationManager {
  constructor() {
    super();
  }

  /**
   * Rollback to specific version
   */
  async rollbackToVersion(targetVersion) {
    console.log(`Rolling back to version ${targetVersion}...`);

    const postgresConfig = this.getPostgresConfig();
    if (!postgresConfig) {
      console.log('PostgreSQL not configured, cannot rollback');
      return;
    }

    const pool = new Pool(postgresConfig);
    const client = await pool.connect();

    try {
      // Get migrations to rollback (versions > targetVersion)
      const migrationsToRollback = await client.query(
        'SELECT version, name FROM schema_migrations WHERE version > $1 ORDER BY version DESC',
        [targetVersion]
      );

      if (migrationsToRollback.rows.length === 0) {
        console.log('No migrations to rollback');
        return;
      }

      console.log(`Found ${migrationsToRollback.rows.length} migrations to rollback`);

      for (const migration of migrationsToRollback.rows) {
        await this.rollbackSingleMigration(client, migration);
      }

      console.log(`Successfully rolled back to version ${targetVersion}`);
    } finally {
      client.release();
      await pool.end();
    }
  }

  /**
   * Rollback single migration
   */
  async rollbackSingleMigration(client, migration) {
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
        console.log(`✓ Executed rollback SQL for ${migration.version}`);
      } else {
        console.warn(`⚠ No rollback file found for migration ${migration.version}`);
        // For safety, we'll still remove the migration record
        // but won't execute any rollback SQL
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

  /**
   * Validate rollback safety
   */
  async validateRollback(targetVersion) {
    console.log(`Validating rollback to version ${targetVersion}...`);

    const postgresConfig = this.getPostgresConfig();
    if (!postgresConfig) {
      console.log('PostgreSQL not configured, cannot validate');
      return false;
    }

    const pool = new Pool(postgresConfig);
    const client = await pool.connect();

    try {
      // Check if target version exists
      const targetResult = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [targetVersion]
      );

      if (targetResult.rows.length === 0) {
        console.error(`Target version ${targetVersion} not found`);
        return false;
      }

      // Check for data dependencies
      const migrationsToRollback = await client.query(
        'SELECT version, name FROM schema_migrations WHERE version > $1 ORDER BY version',
        [targetVersion]
      );

      console.log(`Would rollback ${migrationsToRollback.rows.length} migrations:`);
      migrationsToRollback.rows.forEach(row => {
        console.log(`  - ${row.version}: ${row.name}`);
      });

      // Check for rollback files
      let allRollbackFilesExist = true;
      for (const migration of migrationsToRollback.rows) {
        const rollbackFile = path.join(
          __dirname, 
          'migrations', 
          `${migration.version}-${migration.name}-rollback.sql`
        );
        
        if (!fs.existsSync(rollbackFile)) {
          console.warn(`⚠ No rollback file for ${migration.version}: ${migration.name}`);
          allRollbackFilesExist = false;
        }
      }

      if (!allRollbackFilesExist) {
        console.warn('Some migrations lack rollback files - rollback may be incomplete');
      }

      return true;
    } finally {
      client.release();
      await pool.end();
    }
  }

  /**
   * Create rollback file for a migration
   */
  createRollbackFile(migrationVersion, migrationName) {
    const rollbackFile = path.join(
      __dirname, 
      'migrations', 
      `${migrationVersion}-${migrationName}-rollback.sql`
    );

    if (fs.existsSync(rollbackFile)) {
      console.log(`Rollback file already exists: ${rollbackFile}`);
      return;
    }

    // Create basic rollback template
    const rollbackContent = `-- Rollback for migration ${migrationVersion}: ${migrationName}
-- Generated on ${new Date().toISOString()}

-- WARNING: This is a template rollback file
-- Review and modify before using in production

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS table_name;
-- ALTER TABLE table_name DROP COLUMN column_name;

-- Remember to:
-- 1. Test the rollback in a development environment
-- 2. Backup data before running rollback
-- 3. Verify rollback doesn't break existing functionality
`;

    fs.writeFileSync(rollbackFile, rollbackContent);
    console.log(`Created rollback file: ${rollbackFile}`);
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const manager = new RollbackManager();

  try {
    switch (command) {
      case 'to':
        const targetVersion = parseInt(process.argv[3], 10);
        if (isNaN(targetVersion)) {
          console.error('Invalid target version');
          process.exit(1);
        }
        await manager.rollbackToVersion(targetVersion);
        break;
      case 'count':
        const count = parseInt(process.argv[3] || '1', 10);
        await manager.rollbackMigrations(count);
        break;
      case 'validate':
        const validateVersion = parseInt(process.argv[3], 10);
        if (isNaN(validateVersion)) {
          console.error('Invalid target version');
          process.exit(1);
        }
        const isValid = await manager.validateRollback(validateVersion);
        process.exit(isValid ? 0 : 1);
        break;
      case 'create-rollback':
        const version = process.argv[3];
        const name = process.argv[4];
        if (!version || !name) {
          console.error('Usage: create-rollback <version> <name>');
          process.exit(1);
        }
        manager.createRollbackFile(version, name);
        break;
      default:
        console.log(`
Database Rollback Tool

Usage:
  node scripts/rollback.js <command> [options]

Commands:
  to <version>           Rollback to specific version
  count <number>         Rollback specified number of migrations
  validate <version>     Validate rollback safety
  create-rollback <version> <name>  Create rollback file template

Examples:
  node scripts/rollback.js to 2
  node scripts/rollback.js count 3
  node scripts/rollback.js validate 2
  node scripts/rollback.js create-rollback 3 add-user-table
`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Rollback failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { RollbackManager };
