import { SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, basename, extname } from 'path'

export interface Migration {
  version: string
  description: string
  up: string[]
  down: string[]
  appliedAt?: Date
  checksum?: string
}

interface MigrationResult {
  success: boolean
  message: string
  migrationsApplied: string[]
  migrationsRolledBack: string[]
  error?: string
}

interface MigrationStatus {
  currentVersion: string
  pendingMigrations: string[]
  appliedMigrations: string[]
  isUpToDate: boolean
}

class DatabaseMigrationManager {
  private client: SupabaseClient
  private migrationsPath: string

  constructor(client: SupabaseClient, migrationsPath: string = 'src/lib/database/migrations') {
    this.client = client
    this.migrationsPath = migrationsPath
  }

  /**
   * Initialize migration system
   */
  async initialize(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable()
    } catch (error) {
      throw new Error(`Failed to initialize migration system: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create migrations tracking table
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64),
        up_sql TEXT,
        down_sql TEXT
      );
    `

    const { error } = await this.client.rpc('exec_sql', { sql: createTableSQL })
    if (error) {
      throw new Error(`Failed to create migrations table: ${error.message}`)
    }
  }

  /**
   * Load migration files from directory
   */
  loadMigrations(): Migration[] {
    const migrations: Migration[] = []

    try {
      const files = readdirSync(this.migrationsPath)
        .filter(file => extname(file) === '.sql')
        .sort()

      for (const file of files) {
        const migration = this.parseMigrationFile(file)
        if (migration) {
          migrations.push(migration)
        }
      }
    } catch (error) {
      throw new Error(`Failed to load migrations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return migrations
  }

  /**
   * Parse migration file
   */
  private parseMigrationFile(filename: string): Migration | null {
    try {
      const filePath = join(this.migrationsPath, filename)
      const content = readFileSync(filePath, 'utf-8')
      
      // Extract version from filename (e.g., "001_initial_schema.sql" -> "001")
      const version = basename(filename, '.sql').split('_')[0]
      
      // Extract description from filename (e.g., "001_initial_schema.sql" -> "initial_schema")
      const description = basename(filename, '.sql').split('_').slice(1).join('_')
      
      // Parse SQL content
      const sqlBlocks = this.parseSQLBlocks(content)
      
      return {
        version,
        description,
        up: sqlBlocks.up,
        down: sqlBlocks.down,
        checksum: this.calculateChecksum(content)
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Parse SQL blocks from migration file
   */
  private parseSQLBlocks(content: string): { up: string[], down: string[] } {
    const up: string[] = []
    const down: string[] = []
    
    let currentBlock: string[] = up
    let currentSQL = ''
    
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (trimmedLine.startsWith('-- UP')) {
        if (currentSQL.trim()) {
          currentBlock.push(currentSQL.trim())
          currentSQL = ''
        }
        currentBlock = up
      } else if (trimmedLine.startsWith('-- DOWN')) {
        if (currentSQL.trim()) {
          currentBlock.push(currentSQL.trim())
          currentSQL = ''
        }
        currentBlock = down
      } else if (trimmedLine && !trimmedLine.startsWith('--')) {
        currentSQL += line + '\n'
      }
    }
    
    if (currentSQL.trim()) {
      currentBlock.push(currentSQL.trim())
    }
    
    return { up, down }
  }

  /**
   * Calculate checksum for migration content
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * Get current migration status
   */
  async getStatus(): Promise<MigrationStatus> {
    try {
      const { data: appliedMigrations, error } = await this.client
        .from('schema_migrations')
        .select('version')
        .order('version')

      if (error) {
        throw new Error(`Failed to get migration status: ${error.message}`)
      }

      const appliedVersions = (appliedMigrations || []).map(m => m.version)
      const allMigrations = this.loadMigrations()
      const allVersions = allMigrations.map(m => m.version)
      
      const pendingMigrations = allVersions.filter(v => !appliedVersions.includes(v))
      const currentVersion = appliedVersions.length > 0 ? appliedVersions[appliedVersions.length - 1] : 'none'

      return {
        currentVersion,
        pendingMigrations,
        appliedMigrations: appliedVersions,
        isUpToDate: pendingMigrations.length === 0
      }
    } catch (error) {
      throw new Error(`Failed to get migration status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Apply pending migrations
   */
  async migrate(targetVersion?: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      migrationsApplied: [],
      migrationsRolledBack: []
    }

    try {
      const status = await this.getStatus()
      const allMigrations = this.loadMigrations()
      
      let migrationsToApply = allMigrations.filter(m => 
        status.pendingMigrations.includes(m.version)
      )

      if (targetVersion) {
        migrationsToApply = migrationsToApply.filter(m => m.version <= targetVersion)
      }

      if (migrationsToApply.length === 0) {
        result.success = true
        result.message = 'No migrations to apply'
        return result
      }

      // Apply migrations in order
      for (const migration of migrationsToApply) {
        try {
          await this.applyMigration(migration)
          result.migrationsApplied.push(migration.version)
        } catch (error) {
          result.error = `Failed to apply migration ${migration.version}: ${error instanceof Error ? error.message : 'Unknown error'}`
          return result
        }
      }

      result.success = true
      result.message = `Successfully applied ${result.migrationsApplied.length} migrations`
      
    } catch (error) {
      result.error = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return result
  }

  /**
   * Apply a single migration
   */
  private async applyMigration(migration: Migration): Promise<void> {
    try {
      // Execute UP SQL
      for (const sql of migration.up) {
        if (sql.trim()) {
          const { error } = await this.client.rpc('exec_sql', { sql })
          if (error) {
            throw new Error(`SQL execution failed: ${error.message}`)
          }
        }
      }

      // Record migration as applied
      const { error: insertError } = await this.client
        .from('schema_migrations')
        .insert({
          version: migration.version,
          description: migration.description,
          checksum: migration.checksum,
          up_sql: migration.up.join('\n'),
          down_sql: migration.down.join('\n')
        })

      if (insertError) {
        throw new Error(`Failed to record migration: ${insertError.message}`)
      }

    } catch (error) {
      throw new Error(`Failed to apply migration ${migration.version}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Rollback migrations
   */
  async rollback(targetVersion?: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      migrationsApplied: [],
      migrationsRolledBack: []
    }

    try {
      const status = await this.getStatus()
      const allMigrations = this.loadMigrations()
      
      let migrationsToRollback = allMigrations.filter(m => 
        status.appliedMigrations.includes(m.version)
      )

      if (targetVersion) {
        migrationsToRollback = migrationsToRollback.filter(m => m.version > targetVersion)
      }

      if (migrationsToRollback.length === 0) {
        result.success = true
        result.message = 'No migrations to rollback'
        return result
      }

      // Rollback migrations in reverse order
      for (const migration of migrationsToRollback.reverse()) {
        try {
          await this.rollbackMigration(migration)
          result.migrationsRolledBack.push(migration.version)
        } catch (error) {
          result.error = `Failed to rollback migration ${migration.version}: ${error instanceof Error ? error.message : 'Unknown error'}`
          return result
        }
      }

      result.success = true
      result.message = `Successfully rolled back ${result.migrationsRolledBack.length} migrations`
      
    } catch (error) {
      result.error = `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return result
  }

  /**
   * Rollback a single migration
   */
  private async rollbackMigration(migration: Migration): Promise<void> {
    try {
      // Execute DOWN SQL
      for (const sql of migration.down) {
        if (sql.trim()) {
          const { error } = await this.client.rpc('exec_sql', { sql })
          if (error) {
            throw new Error(`SQL execution failed: ${error.message}`)
          }
        }
      }

      // Remove migration record
      const { error: deleteError } = await this.client
        .from('schema_migrations')
        .delete()
        .eq('version', migration.version)

      if (deleteError) {
        throw new Error(`Failed to remove migration record: ${deleteError.message}`)
      }

    } catch (error) {
      throw new Error(`Failed to rollback migration ${migration.version}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a new migration file
   */
  createMigration(description: string): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')
    const version = `${timestamp}_${description.replace(/[^a-zA-Z0-9]/g, '_')}`
    const filename = `${version}.sql`
    const filePath = join(this.migrationsPath, filename)

    const template = `-- Migration: ${description}
-- Version: ${version}
-- Created: ${new Date().toISOString()}

-- UP Migration
-- Add your UP migration SQL here
-- Example:
-- CREATE TABLE example_table (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- DOWN Migration
-- Add your DOWN migration SQL here
-- Example:
-- DROP TABLE IF EXISTS example_table;
`

    try {
      require('fs').writeFileSync(filePath, template)
      return filePath
    } catch (error) {
      throw new Error(`Failed to create migration file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate migration files
   */
  validateMigrations(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const migrations = this.loadMigrations()

    for (const migration of migrations) {
      if (!migration.version) {
        errors.push('Migration missing version')
      }
      if (!migration.description) {
        errors.push(`Migration ${migration.version} missing description`)
      }
      if (migration.up.length === 0) {
        errors.push(`Migration ${migration.version} has no UP SQL`)
      }
      if (migration.down.length === 0) {
        errors.push(`Migration ${migration.version} has no DOWN SQL`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export { DatabaseMigrationManager }
export type { MigrationResult, MigrationStatus }
