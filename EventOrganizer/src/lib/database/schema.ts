import { SupabaseClient } from '@supabase/supabase-js'

interface SchemaValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  tables: TableInfo[]
}

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  indexes: IndexInfo[]
  constraints: ConstraintInfo[]
  triggers: TriggerInfo[]
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue: any
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignTable?: string
  foreignColumn?: string
}

interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
  type: string
}

interface ConstraintInfo {
  name: string
  type: string
  columns: string[]
  definition: string
}

interface TriggerInfo {
  name: string
  event: string
  timing: string
  function: string
}

interface MigrationInfo {
  version: string
  description: string
  up: string[]
  down: string[]
  appliedAt?: Date
}

class DatabaseSchemaManager {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * Validate database schema against expected structure
   */
  async validateSchema(): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      tables: []
    }

    try {
      // Get all tables in public schema
      const { data: tables, error: tablesError } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')

      if (tablesError) {
        result.errors.push(`Failed to fetch tables: ${tablesError.message}`)
        result.isValid = false
        return result
      }

      // Validate each table
      for (const table of tables || []) {
        const tableInfo = await this.getTableInfo(table.table_name)
        result.tables.push(tableInfo)
      }

      // Validate required tables exist
      const requiredTables = [
        'users', 'events', 'sessions', 'event_attendees', 
        'session_attendees', 'notifications', 'connections', 
        'messages', 'event_analytics'
      ]

      const existingTableNames = result.tables.map(t => t.name)
      const missingTables = requiredTables.filter(name => !existingTableNames.includes(name))

      if (missingTables.length > 0) {
        result.errors.push(`Missing required tables: ${missingTables.join(', ')}`)
        result.isValid = false
      } else if (existingTableNames.length === 0) {
        // If no tables exist at all, add a specific error
        result.errors.push(`Missing required tables: ${requiredTables.join(', ')}`)
        result.isValid = false
      }

      // Validate required columns for each table
      await this.validateTableColumns(result)

      // Validate indexes
      await this.validateIndexes(result)

      // Validate constraints
      await this.validateConstraints(result)

      // Validate triggers
      await this.validateTriggers(result)

    } catch (error) {
      result.errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.isValid = false
    }

    return result
  }

  /**
   * Get detailed information about a table
   */
  private async getTableInfo(tableName: string): Promise<TableInfo> {
    const tableInfo: TableInfo = {
      name: tableName,
      columns: [],
      indexes: [],
      constraints: [],
      triggers: []
    }

    // Get columns
    const { data: columns } = await this.client
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)

    tableInfo.columns = (columns || []).map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      defaultValue: col.column_default,
      isPrimaryKey: col.column_key === 'PRI',
      isForeignKey: col.column_key === 'MUL',
      foreignTable: col.referenced_table_name,
      foreignColumn: col.referenced_column_name
    }))

    // Get indexes
    const { data: indexes } = await this.client
      .from('pg_indexes')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', tableName)

    tableInfo.indexes = (indexes || []).map(idx => ({
      name: idx.indexname,
      columns: idx.indexdef.split('(')[1]?.split(')')[0]?.split(',') || [],
      unique: idx.indexdef.includes('UNIQUE'),
      type: idx.indexdef.includes('gin') ? 'gin' : 'btree'
    }))

    // Get constraints
    const { data: constraints } = await this.client
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)

    tableInfo.constraints = (constraints || []).map(constraint => ({
      name: constraint.constraint_name,
      type: constraint.constraint_type,
      columns: [], // Would need additional query to get columns
      definition: constraint.constraint_name
    }))

    // Get triggers
    const { data: triggers } = await this.client
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_schema', 'public')
      .eq('event_object_table', tableName)

    tableInfo.triggers = (triggers || []).map(trigger => ({
      name: trigger.trigger_name,
      event: trigger.event_manipulation,
      timing: trigger.action_timing,
      function: trigger.action_statement
    }))

    return tableInfo
  }

  /**
   * Validate table columns against expected schema
   */
  private async validateTableColumns(result: SchemaValidationResult): Promise<void> {
    const expectedColumns = {
      users: ['id', 'email', 'full_name', 'created_at', 'updated_at'],
      events: ['id', 'organizer_id', 'title', 'description', 'start_date', 'end_date', 'capacity', 'status'],
      sessions: ['id', 'event_id', 'title', 'speaker', 'start_time', 'end_time'],
      event_attendees: ['id', 'event_id', 'user_id', 'status'],
      notifications: ['id', 'recipient_id', 'type', 'title', 'message', 'status'],
      connections: ['id', 'requester_id', 'target_id', 'status']
    }

    for (const table of result.tables) {
      const expectedCols = expectedColumns[table.name as keyof typeof expectedColumns]
      if (expectedCols) {
        const existingCols = table.columns.map(c => c.name)
        const missingCols = expectedCols.filter(col => !existingCols.includes(col))
        
        if (missingCols.length > 0) {
          result.errors.push(`Table ${table.name} missing columns: ${missingCols.join(', ')}`)
          result.isValid = false
        }
      }
    }
  }

  /**
   * Validate indexes
   */
  private async validateIndexes(result: SchemaValidationResult): Promise<void> {
    const requiredIndexes = {
      events: ['organizer_id', 'start_date', 'status'],
      sessions: ['event_id', 'start_time'],
      event_attendees: ['event_id', 'user_id'],
      notifications: ['recipient_id', 'status'],
      connections: ['requester_id', 'target_id']
    }

    for (const table of result.tables) {
      const requiredIdx = requiredIndexes[table.name as keyof typeof requiredIndexes]
      if (requiredIdx) {
        const existingIndexes = table.indexes.map(i => i.columns.join(','))
        
        for (const requiredCol of requiredIdx) {
          const hasIndex = existingIndexes.some(idx => idx.includes(requiredCol))
          if (!hasIndex) {
            result.warnings.push(`Table ${table.name} missing index on column: ${requiredCol}`)
          }
        }
      }
    }
  }

  /**
   * Validate constraints
   */
  private async validateConstraints(result: SchemaValidationResult): Promise<void> {
    // Check for required constraints
    const eventsTable = result.tables.find(t => t.name === 'events')
    if (eventsTable) {
      const hasCapacityConstraint = eventsTable.constraints.some(c => 
        c.type === 'CHECK' && c.definition.includes('capacity')
      )
      if (!hasCapacityConstraint) {
        result.warnings.push('Events table missing capacity constraint')
      }
    }
  }

  /**
   * Validate triggers
   */
  private async validateTriggers(result: SchemaValidationResult): Promise<void> {
    // Check for required triggers
    const eventsTable = result.tables.find(t => t.name === 'events')
    if (eventsTable) {
      const hasUpdatedAtTrigger = eventsTable.triggers.some(t => 
        t.function.includes('update_updated_at_column')
      )
      if (!hasUpdatedAtTrigger) {
        result.warnings.push('Events table missing updated_at trigger')
      }
    }
  }

  /**
   * Get schema version
   */
  async getSchemaVersion(): Promise<string> {
    try {
      const { data, error } = await this.client
        .from('schema_migrations')
        .select('version')
        .order('applied_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        return 'unknown'
      }

      return data.version
    } catch {
      return 'unknown'
    }
  }

  /**
   * Check if schema is up to date
   */
  async isSchemaUpToDate(): Promise<boolean> {
    const currentVersion = await this.getSchemaVersion()
    const expectedVersion = '1.0.0' // Current schema version
    
    return currentVersion === expectedVersion
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalTables: number
    totalIndexes: number
    totalConstraints: number
    totalTriggers: number
    schemaVersion: string
  }> {
    const validation = await this.validateSchema()
    const schemaVersion = await this.getSchemaVersion()

    return {
      totalTables: validation.tables.length,
      totalIndexes: validation.tables.reduce((sum, table) => sum + table.indexes.length, 0),
      totalConstraints: validation.tables.reduce((sum, table) => sum + table.constraints.length, 0),
      totalTriggers: validation.tables.reduce((sum, table) => sum + table.triggers.length, 0),
      schemaVersion
    }
  }
}

export { DatabaseSchemaManager }
export type { SchemaValidationResult, TableInfo, ColumnInfo, IndexInfo, ConstraintInfo, TriggerInfo, MigrationInfo }
