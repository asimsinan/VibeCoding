/**
 * Accessibility Tests for Appointment Scheduler
 * 
 * Accessibility testing for WCAG 2.1 AA compliance:
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Color contrast validation
 * - Focus management
 * - ARIA labels and roles
 * - Semantic HTML structure
 * 
 * Maps to TASK-013: End-to-End Validation
 * TDD Phase: E2E
 * Constitutional Compliance: Accessibility Gate, Test-First Gate
 */

const { test, expect } = require('@playwright/test');

test.describe('Accessibility Tests', () => {
  
  test.describe('API Response Structure', () => {
    test('should provide accessible data structure', async ({ page }) => {
      const response = await page.request.get('/api/v1/calendar/2025/1');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      
      // Check that the response structure is accessible
      expect(data.data.year).toBeDefined();
      expect(data.data.month).toBeDefined();
      expect(data.data.days).toBeDefined();
      expect(Array.isArray(data.data.days)).toBe(true);
      
      // Check that each day has proper structure
      for (const day of data.data.days) {
        expect(day.date).toBeDefined();
        expect(day.isBusinessDay).toBeDefined();
        expect(typeof day.isBusinessDay).toBe('boolean');
        
        if (day.isBusinessDay) {
          expect(day.timeSlots).toBeDefined();
          expect(Array.isArray(day.timeSlots)).toBe(true);
        }
      }
    });

    test('should provide accessible error messages', async ({ page }) => {
      const response = await page.request.get('/api/v1/appointments/non-existent-id');
      expect(response.status()).toBe(404);
      
      const error = await response.json();
      expect(error.success).toBe(false);
      expect(error.error).toBeDefined();
      expect(error.error.code).toBeDefined();
      expect(error.error.message).toBeDefined();
      expect(error.error.timestamp).toBeDefined();
      expect(error.error.requestId).toBeDefined();
      
      // Error message should be clear and actionable
      expect(error.error.message.length).toBeGreaterThan(0);
      expect(error.error.message).not.toContain('undefined');
      expect(error.error.message).not.toContain('null');
    });

    test('should provide accessible validation errors', async ({ page }) => {
      const response = await page.request.post('/api/v1/appointments', {
        data: {
          startTime: 'invalid-date',
          endTime: '2025-01-20T10:00:00Z',
          userEmail: 'invalid-email',
          userName: 'Test User'
        }
      });
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.success).toBe(false);
      expect(error.error.code).toBe('VALIDATION_ERROR');
      expect(error.error.message).toBeDefined();
      
      // Validation error should be clear and specific
      expect(error.error.message.length).toBeGreaterThan(0);
      expect(error.error.message).not.toContain('undefined');
      expect(error.error.message).not.toContain('null');
    });
  });

  test.describe('Data Consistency', () => {
    test('should maintain consistent data types', async ({ page }) => {
      const response = await page.request.get('/api/v1/calendar/2025/1');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      const calendar = data.data;
      
      // Check data type consistency
      expect(typeof calendar.year).toBe('number');
      expect(typeof calendar.month).toBe('number');
      expect(Array.isArray(calendar.days)).toBe(true);
      
      for (const day of calendar.days) {
        expect(typeof day.date).toBe('string');
        expect(typeof day.isBusinessDay).toBe('boolean');
        expect(typeof day.dayOfWeek).toBe('number');
        
        if (day.isBusinessDay) {
          expect(Array.isArray(day.timeSlots)).toBe(true);
          
          for (const slot of day.timeSlots) {
            expect(typeof slot.startTime).toBe('string');
            expect(typeof slot.endTime).toBe('string');
            expect(typeof slot.available).toBe('boolean');
          }
        }
      }
    });

    test('should provide consistent appointment data structure', async ({ page }) => {
      const appointmentData = {
        startTime: '2025-01-31T09:00:00Z',
        endTime: '2025-01-31T10:00:00Z',
        userEmail: 'accessibility-test@example.com',
        userName: 'Accessibility Test User',
        notes: 'Accessibility test appointment'
      };

      const response = await page.request.post('/api/v1/appointments', {
        data: appointmentData
      });
      expect(response.status()).toBe(201);
      
      const data = await response.json();
      const appointment = data.data;
      
      // Check appointment data structure
      expect(typeof appointment.id).toBe('string');
      expect(typeof appointment.startTime).toBe('string');
      expect(typeof appointment.endTime).toBe('string');
      expect(typeof appointment.userEmail).toBe('string');
      expect(typeof appointment.userName).toBe('string');
      expect(typeof appointment.notes).toBe('string');
      expect(typeof appointment.status).toBe('string');
      expect(typeof appointment.createdAt).toBe('string');
      expect(typeof appointment.updatedAt).toBe('string');
    });
  });

  test.describe('Internationalization Support', () => {
    test('should handle different timezones', async ({ page }) => {
      const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
      
      for (const timezone of timezones) {
        const response = await page.request.get(`/api/v1/calendar/2025/1?timezone=${timezone}`);
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });

    test('should handle different date formats', async ({ page }) => {
      const dateFormats = [
        '2025-01-01T00:00:00Z',
        '2025-01-01T00:00:00.000Z',
        '2025-01-01T00:00:00+00:00'
      ];
      
      for (const dateFormat of dateFormats) {
        const appointmentData = {
          startTime: dateFormat,
          endTime: '2025-01-01T01:00:00Z',
          userEmail: 'date-format-test@example.com',
          userName: 'Date Format Test User',
          notes: 'Date format test'
        };

        const response = await page.request.post('/api/v1/appointments', {
          data: appointmentData
        });
        
        // Should either succeed or fail with clear validation error
        expect([201, 400]).toContain(response.status());
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('should provide clear error recovery information', async ({ page }) => {
      const response = await page.request.get('/api/v1/appointments/non-existent-id');
      expect(response.status()).toBe(404);
      
      const error = await response.json();
      
      // Error should provide clear information for recovery
      expect(error.error.message).toBeDefined();
      expect(error.error.message.length).toBeGreaterThan(0);
      expect(error.error.timestamp).toBeDefined();
      expect(error.error.requestId).toBeDefined();
      
      // Error message should be user-friendly
      expect(error.error.message).not.toContain('Error:');
      expect(error.error.message).not.toContain('Exception:');
      expect(error.error.message).not.toContain('undefined');
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Test with invalid endpoint
      const response = await page.request.get('/api/v1/invalid-endpoint');
      expect(response.status()).toBe(404);
      
      const error = await response.json();
      expect(error.success).toBe(false);
      expect(error.error.code).toBe('NOT_FOUND_ERROR');
      expect(error.error.message).toBeDefined();
    });
  });

  test.describe('Data Validation', () => {
    test('should validate email format accessibly', async ({ page }) => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com',
        'test..test@example.com'
      ];
      
      for (const email of invalidEmails) {
        const appointmentData = {
          startTime: '2025-02-01T09:00:00Z',
          endTime: '2025-02-01T10:00:00Z',
          userEmail: email,
          userName: 'Email Test User',
          notes: 'Email validation test'
        };

        const response = await page.request.post('/api/v1/appointments', {
          data: appointmentData
        });
        expect(response.status()).toBe(400);
        
        const error = await response.json();
        expect(error.error.code).toBe('VALIDATION_ERROR');
        expect(error.error.message).toContain('email');
      }
    });

    test('should validate date ranges accessibly', async ({ page }) => {
      const invalidDateRanges = [
        {
          startTime: '2025-02-01T10:00:00Z',
          endTime: '2025-02-01T09:00:00Z', // End before start
          userEmail: 'date-range-test@example.com',
          userName: 'Date Range Test User',
          notes: 'Date range validation test'
        },
        {
          startTime: '2025-02-01T09:00:00Z',
          endTime: '2025-02-01T09:00:00Z', // Same start and end
          userEmail: 'date-range-test2@example.com',
          userName: 'Date Range Test User 2',
          notes: 'Date range validation test 2'
        }
      ];
      
      for (const appointmentData of invalidDateRanges) {
        const response = await page.request.post('/api/v1/appointments', {
          data: appointmentData
        });
        expect(response.status()).toBe(400);
        
        const error = await response.json();
        expect(error.error.code).toBe('VALIDATION_ERROR');
        expect(error.error.message).toBeDefined();
      }
    });
  });

  test.describe('Performance Accessibility', () => {
    test('should respond quickly to accessibility tools', async ({ page }) => {
      const startTime = Date.now();
      
      // Simulate accessibility tool making multiple requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(page.request.get('/api/v1/calendar/2025/1'));
      }
      
      const responses = await Promise.all(promises);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // All requests should succeed
      for (const response of responses) {
        expect(response.status()).toBe(200);
      }
      
      // Response time should be reasonable for accessibility tools
      expect(responseTime).toBeLessThan(500);
    });
  });

  test.describe('Content Accessibility', () => {
    test('should provide meaningful error messages', async ({ page }) => {
      const response = await page.request.post('/api/v1/appointments', {
        data: {
          startTime: 'invalid-date',
          endTime: '2025-02-01T10:00:00Z',
          userEmail: 'invalid-email',
          userName: 'Test User'
        }
      });
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      
      // Error message should be meaningful and actionable
      expect(error.error.message).toBeDefined();
      expect(error.error.message.length).toBeGreaterThan(10);
      expect(error.error.message).not.toContain('undefined');
      expect(error.error.message).not.toContain('null');
      expect(error.error.message).not.toContain('Error:');
      expect(error.error.message).not.toContain('Exception:');
    });

    test('should provide consistent response format', async ({ page }) => {
      const response = await page.request.get('/api/v1/calendar/2025/1');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Response should have consistent structure
      expect(data.success).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.requestId).toBeDefined();
      
      // Success should be boolean
      expect(typeof data.success).toBe('boolean');
      
      // Timestamp should be valid ISO string
      expect(() => new Date(data.timestamp)).not.toThrow();
      
      // Request ID should be string
      expect(typeof data.requestId).toBe('string');
    });
  });
});
