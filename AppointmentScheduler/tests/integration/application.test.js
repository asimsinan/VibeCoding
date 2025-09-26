/**
 * Integration Tests for Application Layer
 * 
 * Tests the Express.js application layer integration with core libraries:
 * - Express.js server setup with proper middleware
 * - API routes implementation connecting to core libraries
 * - Middleware configuration (CORS, helmet, morgan, error handling)
 * - Error handling middleware with consistent error responses
 * - Health check endpoints for monitoring
 * - Request validation using Joi schemas
 * - Response formatting and status codes
 * 
 * Maps to TASK-012: Application Layer
 * TDD Phase: Integration
 * Constitutional Compliance: Library-First Gate, API-First Gate, Integration-First Testing Gate
 */

const request = require('supertest');
const AppointmentServer = require('../../src/app');
const { appointmentCore } = require('../../src/index');

describe('Application Layer Integration Tests', () => {
  let server;
  let app;

  beforeAll(async () => {
    // Initialize the appointment core
    await appointmentCore.initialize();
    
    // Create server instance
    server = new AppointmentServer();
    await server.initialize();
    app = server.app;
  });

  afterAll(async () => {
    // Clean up
    await appointmentCore.close();
  });

  describe('Health Check Endpoints', () => {
    test('should return healthy status from /health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.services).toBeDefined();
      expect(response.body.database).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });

    test('should return healthy status from /api/v1/health', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.services).toBeDefined();
      expect(response.body.database).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });
  });

  describe('Calendar Endpoints', () => {
    test('should return calendar for valid year and month', async () => {
      const response = await request(app)
        .get('/api/v1/calendar/2025/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.year).toBe(2025);
      expect(response.body.data.month).toBe(1);
      expect(response.body.data.days).toBeDefined();
      expect(Array.isArray(response.body.data.days)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });

    test('should return calendar with custom timezone and duration', async () => {
      const response = await request(app)
        .get('/api/v1/calendar/2025/1?timezone=America/New_York&duration=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.year).toBe(2025);
      expect(response.body.data.month).toBe(1);
    });

    test('should reject invalid year', async () => {
      const response = await request(app)
        .get('/api/v1/calendar/1999/1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Year must be between 2020 and 2030');
    });

    test('should reject invalid month', async () => {
      const response = await request(app)
        .get('/api/v1/calendar/2025/13')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Month must be between 1 and 12');
    });

    test('should reject invalid duration', async () => {
      const response = await request(app)
        .get('/api/v1/calendar/2025/1?duration=5')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Duration must be between 15 and 480 minutes');
    });
  });

  describe('Appointment Endpoints', () => {
    test('should create a new appointment', async () => {
      const appointmentData = {
        startTime: '2025-02-01T09:00:00Z',
        endTime: '2025-02-01T10:00:00Z',
        userEmail: 'integration-test@example.com',
        userName: 'Integration Test User',
        notes: 'Integration test appointment'
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.userEmail).toBe(appointmentData.userEmail);
      expect(response.body.data.userName).toBe(appointmentData.userName);
      expect(response.body.data.status).toBe('confirmed');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });

    test('should retrieve appointment by ID', async () => {
      // First create an appointment
      const appointmentData = {
        startTime: '2025-02-02T09:00:00Z',
        endTime: '2025-02-02T10:00:00Z',
        userEmail: 'integration-retrieve@example.com',
        userName: 'Integration Retrieve User',
        notes: 'Integration retrieve test'
      };

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData)
        .expect(201);

      const appointmentId = createResponse.body.data.id;

      // Now retrieve the appointment
      const getResponse = await request(app)
        .get(`/api/v1/appointments/${appointmentId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(appointmentId);
      expect(getResponse.body.data.userEmail).toBe(appointmentData.userEmail);
    });

    test('should update appointment', async () => {
      // First create an appointment
      const appointmentData = {
        startTime: '2025-02-03T09:00:00Z',
        endTime: '2025-02-03T10:00:00Z',
        userEmail: 'integration-update@example.com',
        userName: 'Integration Update User',
        notes: 'Integration update test'
      };

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData)
        .expect(201);

      const appointmentId = createResponse.body.data.id;

      // Update the appointment
      const updateData = {
        userName: 'Integration Updated User',
        notes: 'Integration updated test'
      };

      const updateResponse = await request(app)
        .put(`/api/v1/appointments/${appointmentId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.userName).toBe(updateData.userName);
      expect(updateResponse.body.data.notes).toBe(updateData.notes);
    });

    test('should cancel appointment', async () => {
      // First create an appointment
      const appointmentData = {
        startTime: '2025-02-04T09:00:00Z',
        endTime: '2025-02-04T10:00:00Z',
        userEmail: 'integration-cancel@example.com',
        userName: 'Integration Cancel User',
        notes: 'Integration cancel test'
      };

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData)
        .expect(201);

      const appointmentId = createResponse.body.data.id;

      // Cancel the appointment
      const cancelResponse = await request(app)
        .delete(`/api/v1/appointments/${appointmentId}`)
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.data.status).toBe('cancelled');
    });

    test('should list appointments with filters', async () => {
      const response = await request(app)
        .get('/api/v1/appointments?status=confirmed&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.limit).toBe(5);
    });

    test('should reject appointment with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/appointments')
        .send({
          startTime: '2025-02-05T09:00:00Z',
          // Missing endTime, userEmail, userName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Missing required fields');
    });

    test('should reject appointment with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/appointments')
        .send({
          startTime: '2025-02-05T09:00:00Z',
          endTime: '2025-02-05T10:00:00Z',
          userEmail: 'invalid-email',
          userName: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid email format');
    });

    test('should reject appointment with invalid date format', async () => {
      const response = await request(app)
        .post('/api/v1/appointments')
        .send({
          startTime: 'invalid-date',
          endTime: '2025-02-05T10:00:00Z',
          userEmail: 'test@example.com',
          userName: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid date format');
    });

    test('should reject appointment outside business hours', async () => {
      const response = await request(app)
        .post('/api/v1/appointments')
        .send({
          startTime: '2025-02-05T02:00:00Z', // 2 AM UTC
          endTime: '2025-02-05T03:00:00Z',
          userEmail: 'test@example.com',
          userName: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('business hours');
    });

    test('should reject conflicting appointments', async () => {
      // First create an appointment
      const appointmentData = {
        startTime: '2025-02-06T09:00:00Z',
        endTime: '2025-02-06T10:00:00Z',
        userEmail: 'integration-conflict@example.com',
        userName: 'Integration Conflict User',
        notes: 'Integration conflict test'
      };

      await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData)
        .expect(201);

      // Try to create a conflicting appointment
      const conflictData = {
        startTime: '2025-02-06T09:30:00Z',
        endTime: '2025-02-06T10:30:00Z',
        userEmail: 'integration-conflict2@example.com',
        userName: 'Integration Conflict User 2',
        notes: 'Integration conflict test 2'
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .send(conflictData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT_ERROR');
      expect(response.body.error.message).toContain('conflicts with existing appointments');
    });

    test('should return 404 for non-existent appointment', async () => {
      const response = await request(app)
        .get('/api/v1/appointments/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('Availability Endpoints', () => {
    test('should check availability for time slot', async () => {
      const response = await request(app)
        .get('/api/v1/slots/availability?startTime=2025-02-07T09:00:00Z&endTime=2025-02-07T10:00:00Z')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.available).toBeDefined();
      expect(typeof response.body.data.available).toBe('boolean');
    });

    test('should reject availability check with missing parameters', async () => {
      const response = await request(app)
        .get('/api/v1/slots/availability?startTime=2025-02-07T09:00:00Z')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('startTime and endTime are required');
    });

    test('should reject availability check with invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/slots/availability?startTime=invalid-date&endTime=2025-02-07T10:00:00Z')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid date format');
    });
  });

  describe('Statistics Endpoints', () => {
    test('should get appointment statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stats?startDate=2025-02-01&endDate=2025-02-28')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalAppointments).toBeDefined();
      expect(response.body.data.confirmedAppointments).toBeDefined();
      expect(response.body.data.cancelledAppointments).toBeDefined();
      expect(response.body.data.dailyStats).toBeDefined();
      expect(Array.isArray(response.body.data.dailyStats)).toBe(true);
    });

    test('should get statistics for current month by default', async () => {
      const response = await request(app)
        .get('/api/v1/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalAppointments).toBeDefined();
    });

    test('should reject statistics with invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/stats?startDate=invalid-date&endDate=2025-02-28')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid date format');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/v1/undefined-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
      expect(response.body.error.message).toContain('Route');
      expect(response.body.error.message).toContain('not found');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/appointments')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should include request ID in all responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.requestId).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body.requestId).toBe(response.headers['x-request-id']);
    });
  });

  describe('Middleware Configuration', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/v1/appointments')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});
