#!/usr/bin/env node
/**
 * Mock Database Manager for Integration Tests
 * 
 * Provides a mock implementation of DatabaseManager for testing
 * without requiring actual database connections.
 */

export class MockDatabaseManager {
  private queryResults: any[] = []
  private queryIndex = 0

  constructor() {
    // Initialize with default mock responses
    this.setupDefaultMocks()
  }

  /**
   * Mock query method
   */
  async query(sql: string, params?: any[]): Promise<{ rows: any[], rowCount: number }> {
    // Return mock data based on query type
    if (sql.includes('SELECT COUNT(*)')) {
      return { rows: [{ count: '0' }], rowCount: 1 }
    }
    
    if (sql.includes('SELECT * FROM')) {
      return { rows: [], rowCount: 0 }
    }
    
    if (sql.includes('INSERT INTO')) {
      return { rows: [], rowCount: 1 }
    }
    
    if (sql.includes('UPDATE')) {
      return { rows: [], rowCount: 1 }
    }
    
    if (sql.includes('DELETE')) {
      return { rows: [], rowCount: 1 }
    }

    // Default response
    return { rows: [], rowCount: 0 }
  }

  /**
   * Setup default mock responses
   */
  private setupDefaultMocks(): void {
    // Add any default mock data here
  }

  /**
   * Set custom query result
   */
  setQueryResult(result: any): void {
    this.queryResults.push(result)
  }

  /**
   * Reset mock state
   */
  reset(): void {
    this.queryResults = []
    this.queryIndex = 0
  }
}

export default MockDatabaseManager
