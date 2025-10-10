/**
 * Database Performance Load Tests
 * Tests for database performance under various load conditions
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { LoadTestUtils, LoadTestScenarios, LoadTester, LoadTestConfig } from './load-test-utils';

describe('Database Performance Load Tests', () => {
  let loadTester: LoadTester;
  let dbService: DatabaseService;

  beforeAll(async () => {
    loadTester = new LoadTester();
    dbService = DatabaseService.getInstance();
  });

  describe('Database Query Performance', () => {
    it('should handle 100 concurrent simple queries', async () => {
      const config: LoadTestConfig = {
        name: '100 Concurrent Simple Queries',
        description: 'Test database performance with 100 concurrent simple queries',
        userCount: 100,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        return LoadTestScenarios.concurrentDatabaseQueries(userCount);
      });
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(95); // At least 95% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(100); // Less than 100ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(200); // P95 less than 200ms
    }, 30000);

    it('should handle 500 concurrent simple queries', async () => {
      const config: LoadTestConfig = {
        name: '500 Concurrent Simple Queries',
        description: 'Test database performance with 500 concurrent simple queries',
        userCount: 500,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        return LoadTestScenarios.concurrentDatabaseQueries(userCount);
      });
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(90); // At least 90% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(200); // Less than 200ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(500); // P95 less than 500ms
    }, 60000);

    it('should handle 1000 concurrent simple queries', async () => {
      const config: LoadTestConfig = {
        name: '1000 Concurrent Simple Queries',
        description: 'Test database performance with 1000 concurrent simple queries',
        userCount: 1000,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        return LoadTestScenarios.concurrentDatabaseQueries(userCount);
      });
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(300); // Less than 300ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(800); // P95 less than 800ms
    }, 120000);
  });

  describe('Database Write Performance', () => {
    it('should handle 50 concurrent user insertions', async () => {
      const config: LoadTestConfig = {
        name: '50 Concurrent User Insertions',
        description: 'Test database write performance with 50 concurrent user insertions',
        userCount: 50,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserRegistration);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(500); // Less than 500ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1000); // P95 less than 1 second
    }, 30000);

    it('should handle 100 concurrent room insertions', async () => {
      const config: LoadTestConfig = {
        name: '100 Concurrent Room Insertions',
        description: 'Test database write performance with 100 concurrent room insertions',
        userCount: 100,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentRoomCreation);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(75); // At least 75% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(800); // Less than 800ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1500); // P95 less than 1.5 seconds
    }, 60000);

    it('should handle 200 concurrent message insertions', async () => {
      const config: LoadTestConfig = {
        name: '200 Concurrent Message Insertions',
        description: 'Test database write performance with 200 concurrent message insertions',
        userCount: 20,
        operationsPerUser: 10
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentMessageSending);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(300); // Less than 300ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(600); // P95 less than 600ms
    }, 60000);
  });

  describe('Database Read Performance', () => {
    it('should handle 200 concurrent user reads', async () => {
      const config: LoadTestConfig = {
        name: '200 Concurrent User Reads',
        description: 'Test database read performance with 200 concurrent user reads',
        userCount: 200,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserLogin);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(90); // At least 90% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(200); // Less than 200ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(400); // P95 less than 400ms
    }, 30000);

    it('should handle 500 concurrent room reads', async () => {
      const config: LoadTestConfig = {
        name: '500 Concurrent Room Reads',
        description: 'Test database read performance with 500 concurrent room reads',
        userCount: 500,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        const results = [];
        const promises = [];
        
        for (let i = 0; i < userCount; i++) {
          promises.push(
            (async () => {
              const startTime = Date.now();
              try {
                await dbService.query('SELECT * FROM rooms LIMIT 10');
                const duration = Date.now() - startTime;
                results.push({ success: true, duration });
              } catch (error) {
                const duration = Date.now() - startTime;
                results.push({ 
                  success: false, 
                  duration, 
                  error: error instanceof Error ? error.message : 'Unknown error' 
                });
              }
            })()
          );
        }
        
        await Promise.all(promises);
        return results;
      });
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(300); // Less than 300ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(600); // P95 less than 600ms
    }, 60000);
  });

  describe('Database Transaction Performance', () => {
    it('should handle 100 concurrent transactions', async () => {
      const config: LoadTestConfig = {
        name: '100 Concurrent Transactions',
        description: 'Test database transaction performance with 100 concurrent transactions',
        userCount: 100,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        const results = [];
        const promises = [];
        
        for (let i = 0; i < userCount; i++) {
          promises.push(
            (async () => {
              const startTime = Date.now();
              try {
                await dbService.query('BEGIN');
                await dbService.query('INSERT INTO "user" (email, password_hash, name) VALUES ($1, $2, $3)', [
                  `transaction${i}@example.com`,
                  'hashed_password',
                  `Transaction User ${i}`
                ]);
                await dbService.query('COMMIT');
                const duration = Date.now() - startTime;
                results.push({ success: true, duration });
              } catch (error) {
                try {
                  await dbService.query('ROLLBACK');
                } catch (rollbackError) {
                  // Ignore rollback errors
                }
                const duration = Date.now() - startTime;
                results.push({ 
                  success: false, 
                  duration, 
                  error: error instanceof Error ? error.message : 'Unknown error' 
                });
              }
            })()
          );
        }
        
        await Promise.all(promises);
        return results;
      });
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      expect(result.stats.p95ResponseTime).toBeLessThan(2000); // P95 less than 2 seconds
    }, 60000);
  });

  describe('Database Connection Pool Performance', () => {
    it('should handle connection pool exhaustion gracefully', async () => {
      const config: LoadTestConfig = {
        name: 'Connection Pool Exhaustion Test',
        description: 'Test database behavior when connection pool is exhausted',
        userCount: 1000,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        return LoadTestScenarios.concurrentDatabaseQueries(userCount);
      });
      
      // Even with connection pool exhaustion, we should have reasonable success rate
      expect(result.stats.successRate).toBeGreaterThanOrEqual(70); // At least 70% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      
      // Should not have too many connection-related errors
      const connectionErrors = result.stats.errors.filter(error => 
        error.includes('connection') || error.includes('pool') || error.includes('timeout')
      );
      expect(connectionErrors.length).toBeLessThan(result.stats.failed * 0.5); // Less than 50% of failures
    }, 120000);
  });

  describe('Database Index Performance', () => {
    it('should perform well with indexed queries', async () => {
      const config: LoadTestConfig = {
        name: 'Indexed Query Performance',
        description: 'Test database performance with indexed queries',
        userCount: 200,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        const results = [];
        const promises = [];
        
        for (let i = 0; i < userCount; i++) {
          promises.push(
            (async () => {
              const startTime = Date.now();
              try {
                // Query that should use indexes
                await dbService.query('SELECT * FROM "user" WHERE email = $1', [`user${i}@example.com`]);
                const duration = Date.now() - startTime;
                results.push({ success: true, duration });
              } catch (error) {
                const duration = Date.now() - startTime;
                results.push({ 
                  success: false, 
                  duration, 
                  error: error instanceof Error ? error.message : 'Unknown error' 
                });
              }
            })()
          );
        }
        
        await Promise.all(promises);
        return results;
      });
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(100); // Less than 100ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(200); // P95 less than 200ms
    }, 30000);
  });

  describe('Database Memory Usage', () => {
    it('should maintain reasonable memory usage under database load', async () => {
      const config: LoadTestConfig = {
        name: 'Database Memory Usage Test',
        description: 'Test memory usage under heavy database load',
        userCount: 500,
        operationsPerUser: 2
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        return LoadTestScenarios.concurrentDatabaseQueries(userCount);
      });
      
      // Memory usage should be reasonable even under heavy load
      expect(result.memoryUsage.heapUsed).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
      expect(result.memoryUsage.heapTotal).toBeLessThan(400 * 1024 * 1024); // Less than 400MB
      
      // Performance should still be good
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85);
      expect(result.stats.averageResponseTime).toBeLessThan(300);
    }, 60000);
  });

  describe('Database Scalability', () => {
    it('should scale database operations linearly', async () => {
      const configs: LoadTestConfig[] = [
        {
          name: '100 Queries',
          description: 'Baseline test with 100 queries',
          userCount: 100,
          operationsPerUser: 1
        },
        {
          name: '300 Queries',
          description: 'Test with 300 queries',
          userCount: 300,
          operationsPerUser: 1
        },
        {
          name: '500 Queries',
          description: 'Test with 500 queries',
          userCount: 500,
          operationsPerUser: 1
        }
      ];

      const results = await loadTester.runMultipleLoadTests(configs, async (userCount, operationsPerUser) => {
        return LoadTestScenarios.concurrentDatabaseQueries(userCount);
      });
      
      // Verify that performance scales reasonably
      expect(results).toHaveLength(3);
      
      // Success rate should remain high across all scales
      results.forEach(result => {
        expect(result.stats.successRate).toBeGreaterThanOrEqual(85);
      });
      
      // Response time should not increase dramatically
      const responseTimes = results.map(r => r.stats.averageResponseTime);
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      // Max response time should not be more than 2x the min
      expect(maxResponseTime).toBeLessThan(minResponseTime * 2);
    }, 120000);
  });
});
