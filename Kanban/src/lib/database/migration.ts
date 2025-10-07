// Database migration system for Kanban application
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
  executedAt?: Date;
}

export class MigrationManager {
  private supabase: any;
  private migrationsPath: string;

  constructor(supabaseUrl: string, supabaseKey: string, migrationsPath: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize the migrations table
   */
  async initialize(): Promise<void> {
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await this.supabase.rpc('exec_sql', { sql: createMigrationsTable });
  }

  /**
   * Get all migration files from the filesystem
   */
  getMigrationFiles(): string[] {
    if (!existsSync(this.migrationsPath)) {
      return [];
    }
    
    return readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  /**
   * Parse migration file and extract version, name, up, and down sections
   */
  parseMigrationFile(filePath: string): Migration {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let version = '';
    let name = '';
    let up = '';
    let down = '';
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('-- Migration:')) {
        const parts = trimmed.replace('-- Migration:', '').trim().split(' ');
        version = parts[0];
        name = parts.slice(1).join(' ');
      } else if (trimmed.startsWith('-- Up:')) {
        currentSection = 'up';
      } else if (trimmed.startsWith('-- Down:')) {
        currentSection = 'down';
      } else if (currentSection === 'up' && trimmed) {
        up += line + '\n';
      } else if (currentSection === 'down' && trimmed) {
        down += line + '\n';
      }
    }
    
    return {
      version,
      name,
      up: up.trim(),
      down: down.trim()
    };
  }

  /**
   * Get executed migrations from database
   */
  async getExecutedMigrations(): Promise<Migration[]> {
    const { data, error } = await this.supabase
      .from('migrations')
      .select('*')
      .order('version');
    
    if (error) {
      throw new Error(`Failed to get executed migrations: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Mark migration as executed
   */
  async markMigrationExecuted(migration: Migration): Promise<void> {
    const { error } = await this.supabase
      .from('migrations')
      .insert({
        version: migration.version,
        name: migration.name,
        executed_at: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`Failed to mark migration as executed: ${error.message}`);
    }
  }

  /**
   * Remove migration from executed list
   */
  async unmarkMigrationExecuted(version: string): Promise<void> {
    const { error } = await this.supabase
      .from('migrations')
      .delete()
      .eq('version', version);
    
    if (error) {
      throw new Error(`Failed to unmark migration: ${error.message}`);
    }
  }

  /**
   * Execute a migration
   */
  async executeMigration(migration: Migration): Promise<void> {
    try {
      // Execute the up migration
      await this.supabase.rpc('exec_sql', { sql: migration.up });
      
      // Mark as executed
      await this.markMigrationExecuted(migration);
      
      console.log(`✅ Migration ${migration.version} executed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    try {
      // Execute the down migration
      await this.supabase.rpc('exec_sql', { sql: migration.down });
      
      // Remove from executed list
      await this.unmarkMigrationExecuted(migration.version);
      
      console.log(`✅ Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Rollback of migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    await this.initialize();
    
    const migrationFiles = this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));
    
    const pendingMigrations = migrationFiles
      .map(file => this.parseMigrationFile(join(this.migrationsPath, file)))
      .filter(migration => !executedVersions.has(migration.version));
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }
    
    console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
    
    console.log('✅ All migrations completed successfully');
  }

  /**
   * Rollback the last migration
   */
  async rollback(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    
    if (executedMigrations.length === 0) {
      console.log('✅ No migrations to rollback');
      return;
    }
    
    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const migrationFiles = this.getMigrationFiles();
    const migrationFile = migrationFiles.find(file => 
      file.startsWith(lastMigration.version)
    );
    
    if (!migrationFile) {
      throw new Error(`Migration file not found for version ${lastMigration.version}`);
    }
    
    const migration = this.parseMigrationFile(join(this.migrationsPath, migrationFile));
    await this.rollbackMigration(migration);
  }

  /**
   * Get migration status
   */
  async status(): Promise<{
    executed: Migration[];
    pending: Migration[];
  }> {
    const migrationFiles = this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));
    
    const allMigrations = migrationFiles.map(file => 
      this.parseMigrationFile(join(this.migrationsPath, file))
    );
    
    const pending = allMigrations.filter(m => !executedVersions.has(m.version));
    
    return {
      executed: executedMigrations,
      pending
    };
  }
}

// Migration utility functions
export function createMigration(version: string, name: string, up: string, down: string): string {
  return `-- Migration: ${version} ${name}

-- Up:
${up}

-- Down:
${down}
`;
}

export function generateVersion(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}
