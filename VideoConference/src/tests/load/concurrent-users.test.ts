/**
 * Concurrent User Load Tests
 * Tests for handling multiple concurrent users in the video conferencing application
 */

import { LoadTestUtils, LoadTestScenarios, LoadTester, LoadTestConfig } from './load-test-utils';

describe('Concurrent User Load Tests', () => {
  let loadTester: LoadTester;

  beforeAll(async () => {
    loadTester = new LoadTester();
  });

  describe('User Registration Load Tests', () => {
    it('should handle 10 concurrent user registrations', async () => {
      const config: LoadTestConfig = {
        name: '10 Concurrent User Registrations',
        description: 'Test user registration with 10 concurrent users',
        userCount: 10,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserRegistration);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      expect(result.stats.p95ResponseTime).toBeLessThan(2000); // P95 less than 2 seconds
    }, 30000);

    it('should handle 50 concurrent user registrations', async () => {
      const config: LoadTestConfig = {
        name: '50 Concurrent User Registrations',
        description: 'Test user registration with 50 concurrent users',
        userCount: 50,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserRegistration);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(70); // At least 70% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(2000); // Less than 2 seconds average
      expect(result.stats.p95ResponseTime).toBeLessThan(5000); // P95 less than 5 seconds
    }, 60000);

    it('should handle 100 concurrent user registrations', async () => {
      const config: LoadTestConfig = {
        name: '100 Concurrent User Registrations',
        description: 'Test user registration with 100 concurrent users',
        userCount: 100,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserRegistration);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(60); // At least 60% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(3000); // Less than 3 seconds average
      expect(result.stats.p95ResponseTime).toBeLessThan(8000); // P95 less than 8 seconds
    }, 120000);
  });

  describe('User Login Load Tests', () => {
    it('should handle 25 concurrent user logins', async () => {
      const config: LoadTestConfig = {
        name: '25 Concurrent User Logins',
        description: 'Test user login with 25 concurrent users',
        userCount: 25,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserLogin);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(90); // At least 90% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(500); // Less than 500ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1000); // P95 less than 1 second
    }, 30000);

    it('should handle 100 concurrent user logins', async () => {
      const config: LoadTestConfig = {
        name: '100 Concurrent User Logins',
        description: 'Test user login with 100 concurrent users',
        userCount: 100,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserLogin);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      expect(result.stats.p95ResponseTime).toBeLessThan(2000); // P95 less than 2 seconds
    }, 60000);
  });

  describe('Room Creation Load Tests', () => {
    it('should handle 20 concurrent room creations', async () => {
      const config: LoadTestConfig = {
        name: '20 Concurrent Room Creations',
        description: 'Test room creation with 20 concurrent users',
        userCount: 20,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentRoomCreation);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(800); // Less than 800ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1500); // P95 less than 1.5 seconds
    }, 30000);

    it('should handle 50 concurrent room creations', async () => {
      const config: LoadTestConfig = {
        name: '50 Concurrent Room Creations',
        description: 'Test room creation with 50 concurrent users',
        userCount: 50,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentRoomCreation);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1200); // Less than 1.2 seconds average
      expect(result.stats.p95ResponseTime).toBeLessThan(2500); // P95 less than 2.5 seconds
    }, 60000);
  });

  describe('Room Joining Load Tests', () => {
    it('should handle 30 concurrent room joins', async () => {
      const config: LoadTestConfig = {
        name: '30 Concurrent Room Joins',
        description: 'Test room joining with 30 concurrent users',
        userCount: 30,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentRoomJoining);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(90); // At least 90% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(600); // Less than 600ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1200); // P95 less than 1.2 seconds
    }, 30000);

    it('should handle 100 concurrent room joins', async () => {
      const config: LoadTestConfig = {
        name: '100 Concurrent Room Joins',
        description: 'Test room joining with 100 concurrent users',
        userCount: 100,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentRoomJoining);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      expect(result.stats.p95ResponseTime).toBeLessThan(2000); // P95 less than 2 seconds
    }, 60000);
  });

  describe('Message Sending Load Tests', () => {
    it('should handle 20 users sending 5 messages each', async () => {
      const config: LoadTestConfig = {
        name: '20 Users Sending 5 Messages Each',
        description: 'Test message sending with 20 users, 5 messages per user',
        userCount: 20,
        operationsPerUser: 5
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentMessageSending);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(90); // At least 90% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(400); // Less than 400ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(800); // P95 less than 800ms
    }, 30000);

    it('should handle 50 users sending 10 messages each', async () => {
      const config: LoadTestConfig = {
        name: '50 Users Sending 10 Messages Each',
        description: 'Test message sending with 50 users, 10 messages per user',
        userCount: 50,
        operationsPerUser: 10
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentMessageSending);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(600); // Less than 600ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1200); // P95 less than 1.2 seconds
    }, 60000);
  });

  describe('Mixed Operations Load Tests', () => {
    it('should handle mixed operations with 25 users', async () => {
      const config: LoadTestConfig = {
        name: 'Mixed Operations with 25 Users',
        description: 'Test mixed operations (login, create room, join room, send messages) with 25 users',
        userCount: 25,
        operationsPerUser: 4
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        const results = [];
        
        // Mix of different operations
        const loginResults = await LoadTestScenarios.concurrentUserLogin(userCount);
        results.push(...loginResults);
        
        const roomResults = await LoadTestScenarios.concurrentRoomCreation(userCount);
        results.push(...roomResults);
        
        const joinResults = await LoadTestScenarios.concurrentRoomJoining(userCount, 5);
        results.push(...joinResults);
        
        const messageResults = await LoadTestScenarios.concurrentMessageSending(userCount, 2);
        results.push(...messageResults);
        
        return results;
      });
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      expect(result.stats.p95ResponseTime).toBeLessThan(2000); // P95 less than 2 seconds
    }, 60000);

    it('should handle mixed operations with 50 users', async () => {
      const config: LoadTestConfig = {
        name: 'Mixed Operations with 50 Users',
        description: 'Test mixed operations (login, create room, join room, send messages) with 50 users',
        userCount: 50,
        operationsPerUser: 3
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        const results = [];
        
        // Mix of different operations
        const loginResults = await LoadTestScenarios.concurrentUserLogin(userCount);
        results.push(...loginResults);
        
        const roomResults = await LoadTestScenarios.concurrentRoomCreation(userCount);
        results.push(...roomResults);
        
        const joinResults = await LoadTestScenarios.concurrentRoomJoining(userCount, 10);
        results.push(...joinResults);
        
        return results;
      });
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(75); // At least 75% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1500); // Less than 1.5 seconds average
      expect(result.stats.p95ResponseTime).toBeLessThan(3000); // P95 less than 3 seconds
    }, 90000);
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with user count', async () => {
      const configs: LoadTestConfig[] = [
        {
          name: '10 Users',
          description: 'Baseline test with 10 users',
          userCount: 10,
          operationsPerUser: 1
        },
        {
          name: '25 Users',
          description: 'Test with 25 users',
          userCount: 25,
          operationsPerUser: 1
        },
        {
          name: '50 Users',
          description: 'Test with 50 users',
          userCount: 50,
          operationsPerUser: 1
        }
      ];

      const results = await loadTester.runMultipleLoadTests(configs, LoadTestScenarios.concurrentUserLogin);
      
      // Verify that performance doesn't degrade significantly with scale
      expect(results).toHaveLength(3);
      
      // Success rate should remain high across all scales
      results.forEach(result => {
        expect(result.stats.successRate).toBeGreaterThanOrEqual(80);
      });
      
      // Response time should not increase dramatically
      const responseTimes = results.map(r => r.stats.averageResponseTime);
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      // Max response time should not be more than 3x the min
      expect(maxResponseTime).toBeLessThan(minResponseTime * 3);
    }, 120000);
  });

  describe('Resource Usage Tests', () => {
    it('should maintain reasonable memory usage under load', async () => {
      const config: LoadTestConfig = {
        name: 'Memory Usage Test',
        description: 'Test memory usage with 50 concurrent users',
        userCount: 50,
        operationsPerUser: 2
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserLogin);
      
      // Memory usage should be reasonable (less than 500MB)
      expect(result.memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024);
      expect(result.memoryUsage.heapTotal).toBeLessThan(1000 * 1024 * 1024);
      
      // Success rate should still be high
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85);
    }, 60000);

    it('should handle sustained load over time', async () => {
      const config: LoadTestConfig = {
        name: 'Sustained Load Test',
        description: 'Test sustained load with 30 users over multiple operations',
        userCount: 30,
        operationsPerUser: 5
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        const results = [];
        
        // Run multiple rounds of operations
        for (let round = 0; round < 3; round++) {
          const roundResults = await LoadTestScenarios.concurrentUserLogin(userCount);
          results.push(...roundResults);
          
          // Small delay between rounds
          await LoadTestUtils.sleep(1000);
        }
        
        return results;
      });
      
      // Performance should remain consistent over time
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85);
      expect(result.stats.averageResponseTime).toBeLessThan(1000);
      
      // Memory usage should not grow excessively
      expect(result.memoryUsage.heapUsed).toBeLessThan(300 * 1024 * 1024);
    }, 90000);
  });
});
