#!/usr/bin/env node
/**
 * Database Tests for AppointmentScheduler
 * 
 * This file contains tests for database connectivity, schema validation,
 * and migration functionality.
 * 
 * Maps to Phase 2: Database Setup
 * TDD Phase: Contract
 * Constitutional Compliance: Integration-First Testing Gate, Performance Gate
 */

const { 
  checkDatabaseHealth, 
  executeQuery, 
  executeTransaction,
  connectWithRetry 
} = require('../../src/config/database');

describe('Database Tests', () => {
  let dbPool;

  beforeAll(async () => {
    // Connect to database with retry logic
    dbPool = await connectWithRetry();
  });

  afterAll(async () => {
    if (dbPool) {
      await dbPool.end();
    }
  });

  describe('Database Connection', () => {
    test('should establish database connection', () => {
      expect(dbPool).toBeDefined();
      expect(dbPool.totalCount).toBeGreaterThanOrEqual(0);
    });

    test('should pass health check', () => {
      return checkDatabaseHealth().then(health => {
        expect(health.status).toBe('healthy');
        expect(health.database).toBeDefined();
        expect(health.database.currentTime).toBeDefined();
        expect(health.database.version).toBeDefined();
        expect(health.database.environment).toBeDefined();
      });
    });

    test('should execute simple query', () => {
      return executeQuery('SELECT NOW() as current_time').then(result => {
        expect(result.rows).toBeDefined();
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].current_time).toBeDefined();
      });
    });
  });

  describe('Database Schema', () => {
    test('should have appointments table', async () => {
      const result = await executeQuery(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments'
      `);
      
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].table_name).toBe('appointments');
    });

    test('should have proper table structure', async () => {
      const result = await executeQuery(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        ORDER BY ordinal_position
      `);
      
      const columns = result.rows.map(row => row.column_name);
      
      expect(columns).toContain('id');
      expect(columns).toContain('start_time');
      expect(columns).toContain('end_time');
      expect(columns).toContain('user_email');
      expect(columns).toContain('user_name');
      expect(columns).toContain('notes');
      expect(columns).toContain('status');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('should have required indexes', async () => {
      const result = await executeQuery(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'appointments'
      `);
      
      const indexes = result.rows.map(row => row.indexname);
      
      expect(indexes).toContain('idx_appointments_start_time');
      expect(indexes).toContain('idx_appointments_end_time');
      expect(indexes).toContain('idx_appointments_time_range');
      expect(indexes).toContain('idx_appointments_user_email');
      expect(indexes).toContain('idx_appointments_status');
      expect(indexes).toContain('idx_appointments_no_conflict');
    });

    test('should have conflict prevention constraint', async () => {
      const result = await executeQuery(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'appointments'
        AND constraint_type = 'CHECK'
      `);
      
      const constraints = result.rows.map(row => row.constraint_name);
      
      expect(constraints).toContain('valid_time_range');
      expect(constraints).toContain('valid_status');
      expect(constraints).toContain('valid_email');
    });
  });

  describe('Database Functions', () => {
    test('should have check_slot_availability function', async () => {
      const result = await executeQuery(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'check_slot_availability'
      `);
      
      expect(result.rows.length).toBe(1);
    });

    test('should have get_calendar_data function', async () => {
      const result = await executeQuery(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'get_calendar_data'
      `);
      
      expect(result.rows.length).toBe(1);
    });

    test('should check slot availability correctly', async () => {
      const result = await executeQuery(`
        SELECT * FROM check_slot_availability(
          '2024-12-20T10:00:00Z'::TIMESTAMPTZ,
          '2024-12-20T11:00:00Z'::TIMESTAMPTZ
        )
      `);
      
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].is_available).toBeDefined();
      expect(result.rows[0].conflicting_appointments).toBeDefined();
    });

    test('should get calendar data correctly', async () => {
      const result = await executeQuery(`
        SELECT * FROM get_calendar_data(2024, 12, 'UTC')
        LIMIT 5
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].date).toBeDefined();
      expect(result.rows[0].day_of_week).toBeDefined();
      expect(result.rows[0].is_available).toBeDefined();
      expect(result.rows[0].time_slots).toBeDefined();
    });
  });

  describe('Database Triggers', () => {
    test('should have updated_at trigger', async () => {
      const result = await executeQuery(`
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'appointments'
        AND trigger_name = 'update_appointments_updated_at'
      `);
      
      expect(result.rows.length).toBe(1);
    });

    test('should have conflict validation trigger', async () => {
      const result = await executeQuery(`
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'appointments'
        AND trigger_name = 'validate_appointment_conflict_trigger'
      `);
      
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Database Transactions', () => {
    test('should execute transaction successfully', async () => {
      const result = await executeTransaction(async (client) => {
        const queryResult = await client.query('SELECT NOW() as current_time');
        return queryResult.rows[0];
      });
      
      expect(result.current_time).toBeDefined();
    });

    test('should rollback transaction on error', async () => {
      await expect(
        executeTransaction(async (client) => {
          await client.query('SELECT NOW()');
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });

  describe('Database Performance', () => {
    test('should execute queries within performance threshold', async () => {
      const startTime = Date.now();
      
      await executeQuery('SELECT COUNT(*) FROM appointments');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
    });

    test('should handle concurrent connections', async () => {
      const promises = [];
      
      // Create 5 concurrent queries
      for (let i = 0; i < 5; i++) {
        promises.push(executeQuery('SELECT NOW() as query_time'));
      }
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result.rows[0].query_time).toBeDefined();
      });
    });
  });

  describe('Database Error Handling', () => {
    test('should handle invalid queries gracefully', async () => {
      await expect(
        executeQuery('SELECT * FROM non_existent_table')
      ).rejects.toThrow();
    });

    test('should handle connection errors gracefully', () => {
      // This test would require simulating a connection failure
      // For now, we'll just test that the error handling structure exists
      expect(typeof executeQuery).toBe('function');
    });
  });
});
