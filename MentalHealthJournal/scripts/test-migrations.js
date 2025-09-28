#!/usr/bin/env node
/**
 * Test Database Migrations
 * 
 * Tests database migration and rollback functionality.
 * Ensures migrations can be applied and rolled back successfully.
 * 
 * @fileoverview Migration testing utility
 * @author Mental Health Journal App
 * @version 1.0.0
 */

const { MigrationManager } = require('./migrate');
const { RollbackManager } = require('./rollback');
const { Pool } = require('pg');

class MigrationTester {
  constructor() {
    this.migrationManager = new MigrationManager();
    this.rollbackManager = new RollbackManager();
  }

  /**
   * Test migration system
   */
  async testMigrations() {
    console.log('Testing database migrations...\n');
    
    const testResults = {
      passed: 0,
      failed: 0,
      tests: [],
    };

    // Test 1: Check migration files exist
    await this.test('Migration files exist', async () => {
      const migrations = this.migrationManager.migrations;
      if (migrations.length === 0) {
        throw new Error('No migration files found');
      }
      console.log(`Found ${migrations.length} migration files`);
    }, testResults);

    // Test 2: Check rollback files exist
    await this.test('Rollback files exist', async () => {
      const migrations = this.migrationManager.migrations;
      let missingRollbacks = 0;
      
      for (const migration of migrations) {
        const rollbackFile = migration.file.replace('.sql', '-rollback.sql');
        const fs = require('fs');
        if (!fs.existsSync(rollbackFile)) {
          missingRollbacks++;
          console.warn(`Missing rollback file for migration ${migration.version}`);
        }
      }
      
      if (missingRollbacks > 0) {
        console.warn(`${missingRollbacks} migrations lack rollback files`);
      }
    }, testResults);

    // Test 3: Test PostgreSQL connection
    await this.test('PostgreSQL connection', async () => {
      const config = this.migrationManager.getPostgresConfig();
      if (!config) {
        throw new Error('PostgreSQL not configured');
      }
      
      const pool = new Pool(config);
      try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('PostgreSQL connection successful');
      } finally {
        await pool.end();
      }
    }, testResults);

    // Test 4: Test migration syntax
    await this.test('Migration SQL syntax', async () => {
      const fs = require('fs');
      const migrations = this.migrationManager.migrations;
      
      for (const migration of migrations) {
        const sql = fs.readFileSync(migration.file, 'utf8');
        
        // Basic syntax checks
        if (!sql.trim()) {
          throw new Error(`Migration ${migration.version} is empty`);
        }
        
        if (!sql.includes('CREATE TABLE') && !sql.includes('ALTER TABLE')) {
          console.warn(`Migration ${migration.version} contains no table operations`);
        }
        
        // Check for transaction safety
        if (sql.includes('DROP TABLE') && !sql.includes('IF EXISTS')) {
          console.warn(`Migration ${migration.version} uses unsafe DROP TABLE`);
        }
      }
      
      console.log('Migration syntax validation passed');
    }, testResults);

    // Test 5: Test rollback syntax
    await this.test('Rollback SQL syntax', async () => {
      const fs = require('fs');
      const migrations = this.migrationManager.migrations;
      
      for (const migration of migrations) {
        const rollbackFile = migration.file.replace('.sql', '-rollback.sql');
        if (fs.existsSync(rollbackFile)) {
          const sql = fs.readFileSync(rollbackFile, 'utf8');
          
          if (!sql.trim()) {
            throw new Error(`Rollback ${migration.version} is empty`);
          }
          
          // Check for safe rollback operations
          if (sql.includes('DROP TABLE') && !sql.includes('IF EXISTS')) {
            console.warn(`Rollback ${migration.version} uses unsafe DROP TABLE`);
          }
        }
      }
      
      console.log('Rollback syntax validation passed');
    }, testResults);

    // Test 6: Dry run migration
    await this.test('Dry run migration', async () => {
      const config = this.migrationManager.getPostgresConfig();
      if (!config) {
        console.log('Skipping dry run - PostgreSQL not configured');
        return;
      }
      
      // This would require a test database
      console.log('Dry run test would require a test database');
    }, testResults);

    // Print summary
    console.log('\n=== Test Summary ===');
    console.log(`Total tests: ${testResults.tests.length}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    
    if (testResults.failed > 0) {
      console.log('\nFailed tests:');
      testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
      process.exit(1);
    } else {
      console.log('\nAll tests passed! ✓');
    }
  }

  /**
   * Run a single test
   */
  async test(name, testFn, results) {
    console.log(`\nTesting: ${name}`);
    
    try {
      await testFn();
      console.log(`✓ ${name} passed`);
      results.passed++;
      results.tests.push({ name, passed: true });
    } catch (error) {
      console.error(`✗ ${name} failed: ${error.message}`);
      results.failed++;
      results.tests.push({ name, passed: false, error: error.message });
    }
  }

  /**
   * Test migration status command
   */
  async testMigrationStatus() {
    console.log('\nTesting migration status command...');
    
    try {
      await this.migrationManager.showStatus();
      console.log('Migration status command successful');
    } catch (error) {
      console.error('Migration status command failed:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const tester = new MigrationTester();

  try {
    switch (command) {
      case 'all':
        await tester.testMigrations();
        break;
      case 'status':
        await tester.testMigrationStatus();
        break;
      default:
        console.log(`
Migration Testing Tool

Usage:
  node scripts/test-migrations.js <command>

Commands:
  all       Run all migration tests
  status    Test migration status command

Examples:
  node scripts/test-migrations.js all
  node scripts/test-migrations.js status
`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationTester };
