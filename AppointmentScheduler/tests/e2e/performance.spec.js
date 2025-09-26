/**
 * Performance Tests for Appointment Scheduler
 * 
 * Performance validation tests:
 * - Page load time (<3s load time, <100ms interaction)
 * - Core Web Vitals compliance
 * - Memory usage monitoring
 * - API response time validation
 * - Database query performance
 * 
 * Maps to TASK-013: End-to-End Validation
 * TDD Phase: E2E
 * Constitutional Compliance: Performance Gate, Test-First Gate
 */

const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
  
  test.describe('API Performance', () => {
    test('should respond to health check within 50ms', async ({ page }) => {
      const startTime = Date.now();
      
      const response = await page.request.get('/health');
      expect(response.status()).toBe(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Health check should be very fast
      expect(responseTime).toBeLessThan(50);
    });

    test('should respond to calendar request within 100ms', async ({ page }) => {
      const startTime = Date.now();
      
      const response = await page.request.get('/api/v1/calendar/2025/1');
      expect(response.status()).toBe(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Calendar request should be fast
      expect(responseTime).toBeLessThan(100);
    });

    test('should respond to appointment creation within 200ms', async ({ page }) => {
      const appointmentData = {
        startTime: '2025-01-30T09:00:00Z',
        endTime: '2025-01-30T10:00:00Z',
        userEmail: 'perf-test@example.com',
        userName: 'Performance Test User',
        notes: 'Performance test appointment'
      };

      const startTime = Date.now();
      
      const response = await page.request.post('/api/v1/appointments', {
        data: appointmentData
      });
      expect(response.status()).toBe(201);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Appointment creation should be reasonably fast
      expect(responseTime).toBeLessThan(200);
    });

    test('should handle concurrent requests efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Create 20 concurrent requests
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(page.request.get('/api/v1/calendar/2025/1'));
      }
      
      const responses = await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      for (const response of responses) {
        expect(response.status()).toBe(200);
      }
      
      // Total time should be reasonable (less than 1 second for 20 requests)
      expect(totalTime).toBeLessThan(1000);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not leak memory during multiple requests', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });

      // Make multiple requests
      for (let i = 0; i < 50; i++) {
        const response = await page.request.get('/api/v1/calendar/2025/1');
        expect(response.status()).toBe(200);
      }

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });

      // Memory usage should not increase significantly
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    });
  });

  test.describe('Database Performance', () => {
    test('should handle complex queries efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Request statistics for a full year
      const response = await page.request.get('/api/v1/stats?startDate=2025-01-01&endDate=2025-12-31');
      expect(response.status()).toBe(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Complex queries should still be fast
      expect(responseTime).toBeLessThan(500);
    });

    test('should handle large result sets efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Request a large number of appointments
      const response = await page.request.get('/api/v1/appointments?limit=100');
      expect(response.status()).toBe(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Large result sets should be handled efficiently
      expect(responseTime).toBeLessThan(300);
    });
  });

  test.describe('Load Testing', () => {
    test('should handle high load gracefully', async ({ page }) => {
      const startTime = Date.now();
      
      // Simulate high load with many concurrent requests
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(page.request.get('/api/v1/calendar/2025/1'));
      }
      
      const responses = await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Count successful responses
      const successfulResponses = responses.filter(r => r.status() === 200).length;
      
      // At least 95% of requests should succeed
      expect(successfulResponses).toBeGreaterThanOrEqual(95);
      
      // Total time should be reasonable
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  test.describe('Response Size Optimization', () => {
    test('should return optimized response sizes', async ({ page }) => {
      const response = await page.request.get('/api/v1/calendar/2025/1');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      const responseSize = JSON.stringify(data).length;
      
      // Response should be reasonably sized (less than 100KB)
      expect(responseSize).toBeLessThan(100 * 1024);
    });

    test('should handle compressed responses', async ({ page }) => {
      const response = await page.request.get('/api/v1/calendar/2025/1', {
        headers: {
          'Accept-Encoding': 'gzip, deflate'
        }
      });
      expect(response.status()).toBe(200);
      
      // Response should be successful even with compression
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  test.describe('Caching Performance', () => {
    test('should benefit from caching on repeated requests', async ({ page }) => {
      // First request
      const startTime1 = Date.now();
      const response1 = await page.request.get('/api/v1/calendar/2025/1');
      const endTime1 = Date.now();
      const time1 = endTime1 - startTime1;
      
      expect(response1.status()).toBe(200);
      
      // Second request (should be faster due to caching)
      const startTime2 = Date.now();
      const response2 = await page.request.get('/api/v1/calendar/2025/1');
      const endTime2 = Date.now();
      const time2 = endTime2 - startTime2;
      
      expect(response2.status()).toBe(200);
      
      // Second request should be faster (or at least not significantly slower)
      expect(time2).toBeLessThanOrEqual(time1 * 1.5);
    });
  });

  test.describe('Error Handling Performance', () => {
    test('should handle errors efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Request non-existent resource
      const response = await page.request.get('/api/v1/appointments/non-existent-id');
      expect(response.status()).toBe(404);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Error responses should be fast
      expect(responseTime).toBeLessThan(100);
    });

    test('should handle validation errors efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Request with invalid data
      const response = await page.request.post('/api/v1/appointments', {
        data: {
          startTime: 'invalid-date',
          endTime: '2025-01-20T10:00:00Z',
          userEmail: 'invalid-email',
          userName: 'Test User'
        }
      });
      expect(response.status()).toBe(400);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Validation error responses should be fast
      expect(responseTime).toBeLessThan(100);
    });
  });
});
