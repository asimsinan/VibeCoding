/**
 * API Endpoint Load Tests
 * Tests for API endpoint performance under various load conditions
 */

import { LoadTestUtils, LoadTestScenarios, LoadTester, LoadTestConfig } from './load-test-utils';

describe('API Endpoint Load Tests', () => {
  let loadTester: LoadTester;

  beforeAll(async () => {
    loadTester = new LoadTester();
  });

  describe('Authentication API Load Tests', () => {
    it('should handle 100 concurrent login requests', async () => {
      const config: LoadTestConfig = {
        name: '100 Concurrent Login Requests',
        description: 'Test authentication API with 100 concurrent login requests',
        userCount: 100,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserLogin);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(90); // At least 90% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(500); // Less than 500ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1000); // P95 less than 1 second
    }, 30000);

    it('should handle 200 concurrent registration requests', async () => {
      const config: LoadTestConfig = {
        name: '200 Concurrent Registration Requests',
        description: 'Test authentication API with 200 concurrent registration requests',
        userCount: 200,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserRegistration);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(800); // Less than 800ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1500); // P95 less than 1.5 seconds
    }, 60000);

    it('should handle 500 concurrent token refresh requests', async () => {
      const config: LoadTestConfig = {
        name: '500 Concurrent Token Refresh Requests',
        description: 'Test authentication API with 500 concurrent token refresh requests',
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
                // Mock token refresh operation
                await LoadTestUtils.sleep(Math.random() * 50 + 25); // 25-75ms
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
    }, 60000);
  });

  describe('Room Management API Load Tests', () => {
    it('should handle 150 concurrent room creation requests', async () => {
      const config: LoadTestConfig = {
        name: '150 Concurrent Room Creation Requests',
        description: 'Test room management API with 150 concurrent room creation requests',
        userCount: 150,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentRoomCreation);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(600); // Less than 600ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1200); // P95 less than 1.2 seconds
    }, 60000);

    it('should handle 300 concurrent room listing requests', async () => {
      const config: LoadTestConfig = {
        name: '300 Concurrent Room Listing Requests',
        description: 'Test room management API with 300 concurrent room listing requests',
        userCount: 300,
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
                // Mock room listing operation
                await LoadTestUtils.sleep(Math.random() * 30 + 20); // 20-50ms
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
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(95); // At least 95% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(100); // Less than 100ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(200); // P95 less than 200ms
    }, 30000);

    it('should handle 200 concurrent room join requests', async () => {
      const config: LoadTestConfig = {
        name: '200 Concurrent Room Join Requests',
        description: 'Test room management API with 200 concurrent room join requests',
        userCount: 200,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentRoomJoining);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(400); // Less than 400ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(800); // P95 less than 800ms
    }, 60000);
  });

  describe('Message API Load Tests', () => {
    it('should handle 1000 concurrent message sending requests', async () => {
      const config: LoadTestConfig = {
        name: '1000 Concurrent Message Sending Requests',
        description: 'Test message API with 1000 concurrent message sending requests',
        userCount: 100,
        operationsPerUser: 10
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentMessageSending);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(90); // At least 90% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(200); // Less than 200ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(400); // P95 less than 400ms
    }, 60000);

    it('should handle 500 concurrent message retrieval requests', async () => {
      const config: LoadTestConfig = {
        name: '500 Concurrent Message Retrieval Requests',
        description: 'Test message API with 500 concurrent message retrieval requests',
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
                // Mock message retrieval operation
                await LoadTestUtils.sleep(Math.random() * 40 + 30); // 30-70ms
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
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(95); // At least 95% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(100); // Less than 100ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(200); // P95 less than 200ms
    }, 30000);
  });

  describe('WebRTC API Load Tests', () => {
    it('should handle 200 concurrent WebRTC connection requests', async () => {
      const config: LoadTestConfig = {
        name: '200 Concurrent WebRTC Connection Requests',
        description: 'Test WebRTC API with 200 concurrent connection requests',
        userCount: 200,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentWebRTCConnections);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(90); // At least 90% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(150); // Less than 150ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(300); // P95 less than 300ms
    }, 30000);

    it('should handle 500 concurrent WebRTC connection requests', async () => {
      const config: LoadTestConfig = {
        name: '500 Concurrent WebRTC Connection Requests',
        description: 'Test WebRTC API with 500 concurrent connection requests',
        userCount: 500,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentWebRTCConnections);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(200); // Less than 200ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(400); // P95 less than 400ms
    }, 60000);
  });

  describe('Mixed API Load Tests', () => {
    it('should handle mixed API operations with 100 users', async () => {
      const config: LoadTestConfig = {
        name: 'Mixed API Operations with 100 Users',
        description: 'Test mixed API operations with 100 concurrent users',
        userCount: 100,
        operationsPerUser: 5
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.stressTestAPIEndpoints);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(85); // At least 85% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(500); // Less than 500ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1000); // P95 less than 1 second
    }, 60000);

    it('should handle mixed API operations with 200 users', async () => {
      const config: LoadTestConfig = {
        name: 'Mixed API Operations with 200 Users',
        description: 'Test mixed API operations with 200 concurrent users',
        userCount: 200,
        operationsPerUser: 3
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.stressTestAPIEndpoints);
      
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(800); // Less than 800ms average
      expect(result.stats.p95ResponseTime).toBeLessThan(1500); // P95 less than 1.5 seconds
    }, 90000);
  });

  describe('API Rate Limiting Tests', () => {
    it('should handle rate limiting gracefully', async () => {
      const config: LoadTestConfig = {
        name: 'API Rate Limiting Test',
        description: 'Test API behavior under rate limiting conditions',
        userCount: 1000,
        operationsPerUser: 1
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.concurrentUserLogin);
      
      // Even with rate limiting, we should have reasonable success rate
      expect(result.stats.successRate).toBeGreaterThanOrEqual(70); // At least 70% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      
      // Should not have too many rate limiting errors
      const rateLimitErrors = result.stats.errors.filter(error => 
        error.includes('rate limit') || error.includes('too many requests') || error.includes('429')
      );
      expect(rateLimitErrors.length).toBeLessThan(result.stats.failed * 0.3); // Less than 30% of failures
    }, 120000);
  });

  describe('API Error Handling Tests', () => {
    it('should handle API errors gracefully under load', async () => {
      const config: LoadTestConfig = {
        name: 'API Error Handling Test',
        description: 'Test API error handling under load conditions',
        userCount: 300,
        operationsPerUser: 2
      };

      const result = await loadTester.runLoadTest(config, async (userCount, operationsPerUser) => {
        const results = [];
        const promises = [];
        
        for (let i = 0; i < userCount; i++) {
          promises.push(
            (async () => {
              const startTime = Date.now();
              try {
                // Simulate various API operations with potential errors
                const operation = i % 5;
                switch (operation) {
                  case 0:
                    // Valid operation
                    await LoadTestUtils.sleep(Math.random() * 50 + 25);
                    break;
                  case 1:
                    // Simulate timeout
                    await LoadTestUtils.sleep(Math.random() * 200 + 100);
                    break;
                  case 2:
                    // Simulate error
                    if (Math.random() < 0.1) {
                      throw new Error('Simulated API error');
                    }
                    await LoadTestUtils.sleep(Math.random() * 50 + 25);
                    break;
                  case 3:
                    // Simulate slow operation
                    await LoadTestUtils.sleep(Math.random() * 100 + 50);
                    break;
                  case 4:
                    // Simulate network error
                    if (Math.random() < 0.05) {
                      throw new Error('Network error');
                    }
                    await LoadTestUtils.sleep(Math.random() * 50 + 25);
                    break;
                }
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
      
      // Should handle errors gracefully
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate
      expect(result.stats.averageResponseTime).toBeLessThan(200); // Less than 200ms average
      
      // Should have reasonable error distribution
      expect(result.stats.errors.length).toBeLessThan(result.stats.total * 0.2); // Less than 20% errors
    }, 60000);
  });

  describe('API Memory Usage Tests', () => {
    it('should maintain reasonable memory usage under API load', async () => {
      const config: LoadTestConfig = {
        name: 'API Memory Usage Test',
        description: 'Test memory usage under heavy API load',
        userCount: 500,
        operationsPerUser: 3
      };

      const result = await loadTester.runLoadTest(config, LoadTestScenarios.stressTestAPIEndpoints);
      
      // Memory usage should be reasonable even under heavy load
      expect(result.memoryUsage.heapUsed).toBeLessThan(300 * 1024 * 1024); // Less than 300MB
      expect(result.memoryUsage.heapTotal).toBeLessThan(600 * 1024 * 1024); // Less than 600MB
      
      // Performance should still be good
      expect(result.stats.successRate).toBeGreaterThanOrEqual(80);
      expect(result.stats.averageResponseTime).toBeLessThan(1000);
    }, 90000);
  });

  describe('API Scalability Tests', () => {
    it('should scale API operations linearly', async () => {
      const configs: LoadTestConfig[] = [
        {
          name: '100 API Requests',
          description: 'Baseline test with 100 API requests',
          userCount: 100,
          operationsPerUser: 1
        },
        {
          name: '300 API Requests',
          description: 'Test with 300 API requests',
          userCount: 300,
          operationsPerUser: 1
        },
        {
          name: '500 API Requests',
          description: 'Test with 500 API requests',
          userCount: 500,
          operationsPerUser: 1
        }
      ];

      const results = await loadTester.runMultipleLoadTests(configs, LoadTestScenarios.stressTestAPIEndpoints);
      
      // Verify that performance scales reasonably
      expect(results).toHaveLength(3);
      
      // Success rate should remain high across all scales
      results.forEach(result => {
        expect(result.stats.successRate).toBeGreaterThanOrEqual(80);
      });
      
      // Response time should not increase dramatically
      const responseTimes = results.map(r => r.stats.averageResponseTime);
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      // Max response time should not be more than 2.5x the min
      expect(maxResponseTime).toBeLessThan(minResponseTime * 2.5);
    }, 120000);
  });
});
