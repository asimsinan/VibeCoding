#!/usr/bin/env node
/**
 * Express.js Application Server
 * 
 * Main application layer integrating all libraries with Express.js API:
 * - Express.js server setup with proper middleware
 * - API routes implementation connecting to core libraries
 * - Middleware configuration (CORS, helmet, morgan, error handling)
 * - Error handling middleware with consistent error responses
 * - Health check endpoints for monitoring
 * - Environment configuration management
 * - Request validation using Joi schemas
 * - Response formatting and status codes
 * 
 * Maps to TASK-012: Application Layer
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, API-First Gate, Traceability Gate
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { appointmentCore } = require('./index');
const { ErrorCode, errorUtils } = require('./models');
const EnvironmentConfig = require('./config/environment');

class AppointmentServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.isInitialized = false;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id']
    }));

    // Request logging
    this.app.use(morgan('combined', {
      skip: (req, res) => req.url === '/health' && res.statusCode === 200
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });

    // API versioning
    this.app.use('/api/v1', (req, res, next) => {
      req.apiVersion = 'v1';
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', this.handleHealthCheck.bind(this));
    this.app.get('/api/v1/health', this.handleHealthCheck.bind(this));

    // Calendar endpoints
    this.app.get('/api/v1/calendar/:year/:month', this.handleGetCalendar.bind(this));
    this.app.get('/api/v1/calendar', this.handleGetCalendarQuery.bind(this));

    // Appointment endpoints
    this.app.post('/api/v1/appointments', this.handleCreateAppointment.bind(this));
    this.app.get('/api/v1/appointments/:id', this.handleGetAppointment.bind(this));
    this.app.put('/api/v1/appointments/:id', this.handleUpdateAppointment.bind(this));
    this.app.put('/api/v1/appointments/:id/cancel', this.handleCancelAppointment.bind(this));
    this.app.delete('/api/v1/appointments/:id', this.handleDeleteAppointment.bind(this));
    this.app.get('/api/v1/appointments', this.handleListAppointments.bind(this));

    // Availability endpoints
    this.app.get('/api/v1/slots/availability', this.handleCheckAvailability.bind(this));

    // Statistics endpoints
    this.app.get('/api/v1/stats', this.handleGetStats.bind(this));

    // 404 handler for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json(this.createErrorResponse(
        ErrorCode.NOT_FOUND_ERROR,
        `Route ${req.method} ${req.originalUrl} not found`,
        req.requestId
      ));
    });
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error(`[${req.requestId}] Error:`, error);

      // Handle specific error types
      if (error.name === 'ValidationError') {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Validation failed',
          req.requestId,
          error.details || [error.message]
        ));
      }

      if (error.name === 'ConflictError') {
        return res.status(409).json(this.createErrorResponse(
          ErrorCode.CONFLICT_ERROR,
          error.message || 'Conflict occurred',
          req.requestId
        ));
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json(this.createErrorResponse(
          ErrorCode.NOT_FOUND_ERROR,
          error.message || 'Resource not found',
          req.requestId
        ));
      }

      // Handle database errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json(this.createErrorResponse(
          ErrorCode.DATABASE_ERROR,
          'Database connection failed',
          req.requestId
        ));
      }

      // Default error handler
      res.status(500).json(this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'An internal error occurred',
        req.requestId
      ));
    });
  }

  /**
   * Handle health check
   */
  async handleHealthCheck(req, res) {
    try {
      const health = await appointmentCore.healthCheck();
      
      if (health.healthy) {
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: appointmentCore.getVersion(),
          services: health.services,
          database: health.database,
          requestId: req.requestId
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: health.error,
          requestId: req.requestId
        });
      }
    } catch (error) {
      res.status(503).json(this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Health check failed',
        req.requestId
      ));
    }
  }

  /**
   * Handle get calendar
   */
  async handleGetCalendar(req, res) {
    try {
      const { year, month } = req.params;
      const { timezone = 'Europe/Istanbul', duration = '60' } = req.query;

      // Validate parameters
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const durationNum = parseInt(duration);

      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Year must be between 2020 and 2030',
          req.requestId
        ));
      }

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Month must be between 1 and 12',
          req.requestId
        ));
      }

      if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Duration must be between 15 and 480 minutes',
          req.requestId
        ));
      }

      const calendarService = appointmentCore.getCalendarService();
      const calendar = await calendarService.generateCalendar(yearNum, monthNum, durationNum, timezone);

      res.status(200).json({
        success: true,
        data: calendar,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json(this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate calendar',
        req.requestId
      ));
    }
  }

  /**
   * Handle get calendar with query parameters
   */
  async handleGetCalendarQuery(req, res) {
    try {
      const { year, month, timezone = 'Europe/Istanbul', duration = '60' } = req.query;

      // Validate parameters
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const durationNum = parseInt(duration);

      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Year must be between 2020 and 2030',
          req.requestId
        ));
      }

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Month must be between 1 and 12',
          req.requestId
        ));
      }

      if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Duration must be between 15 and 480 minutes',
          req.requestId
        ));
      }

      const calendarService = appointmentCore.getCalendarService();
      const calendar = await calendarService.generateCalendar(yearNum, monthNum, durationNum, timezone);

      res.status(200).json({
        success: true,
        data: calendar,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json(this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate calendar',
        req.requestId
      ));
    }
  }

  /**
   * Handle create appointment
   */
  async handleCreateAppointment(req, res) {
    try {
      const { startTime, endTime, userEmail, userName, notes } = req.body;

      // Validate required fields
      if (!startTime || !endTime || !userEmail || !userName) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Missing required fields: startTime, endTime, userEmail, userName',
          req.requestId
        ));
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Invalid email format',
          req.requestId
        ));
      }

      // Parse dates
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Invalid date format',
          req.requestId
        ));
      }

      const appointmentService = appointmentCore.getAppointmentService();
      const appointment = await appointmentService.createAppointment({
        startTime: start,
        endTime: end,
        userEmail,
        userName,
        notes: notes || ''
      });

      res.status(201).json({
        success: true,
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      console.error('❌ Error in handleCreateAppointment:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      if (error.message.includes('conflicts with existing appointments')) {
        res.status(409).json(this.createErrorResponse(
          ErrorCode.CONFLICT_ERROR,
          error.message,
          req.requestId
        ));
      } else if (error.message.includes('business hours')) {
        res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          error.message,
          req.requestId
        ));
      } else {
        res.status(500).json(this.createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          `Failed to create appointment: ${error.message}`,
          req.requestId
        ));
      }
    }
  }

  /**
   * Handle get appointment
   */
  async handleGetAppointment(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Appointment ID is required',
          req.requestId
        ));
      }

      const appointmentService = appointmentCore.getAppointmentService();
      const appointment = await appointmentService.getAppointment(id);

      res.status(200).json({
        success: true,
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        res.status(404).json(this.createErrorResponse(
          ErrorCode.NOT_FOUND_ERROR,
          error.message,
          req.requestId
        ));
      } else {
        res.status(500).json(this.createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Failed to get appointment',
          req.requestId
        ));
      }
    }
  }

  /**
   * Handle update appointment
   */
  async handleUpdateAppointment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Appointment ID is required',
          req.requestId
        ));
      }

      // Validate email if provided
      if (updateData.userEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.userEmail)) {
          return res.status(400).json(this.createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Invalid email format',
            req.requestId
          ));
        }
      }

      // Parse dates if provided
      if (updateData.startTime) {
        updateData.startTime = new Date(updateData.startTime);
        if (isNaN(updateData.startTime.getTime())) {
          return res.status(400).json(this.createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Invalid startTime format',
            req.requestId
          ));
        }
      }

      if (updateData.endTime) {
        updateData.endTime = new Date(updateData.endTime);
        if (isNaN(updateData.endTime.getTime())) {
          return res.status(400).json(this.createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Invalid endTime format',
            req.requestId
          ));
        }
      }

      const appointmentService = appointmentCore.getAppointmentService();
      const appointment = await appointmentService.updateAppointment(id, updateData);

      res.status(200).json({
        success: true,
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        res.status(404).json(this.createErrorResponse(
          ErrorCode.NOT_FOUND_ERROR,
          error.message,
          req.requestId
        ));
      } else if (error.message.includes('conflicts with existing appointments')) {
        res.status(409).json(this.createErrorResponse(
          ErrorCode.CONFLICT_ERROR,
          error.message,
          req.requestId
        ));
      } else {
        res.status(500).json(this.createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Failed to update appointment',
          req.requestId
        ));
      }
    }
  }

  /**
   * Handle cancel appointment
   */
  async handleCancelAppointment(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Appointment ID is required',
          req.requestId
        ));
      }

      const appointmentService = appointmentCore.getAppointmentService();
      const appointment = await appointmentService.cancelAppointment(id);

      res.status(200).json({
        success: true,
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        res.status(404).json(this.createErrorResponse(
          ErrorCode.NOT_FOUND_ERROR,
          'Appointment not found',
          req.requestId
        ));
      } else {
        res.status(500).json(this.createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Failed to cancel appointment',
          req.requestId
        ));
      }
    }
  }

  /**
   * Handle delete appointment
   */
  async handleDeleteAppointment(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Appointment ID is required',
          req.requestId
        ));
      }

      // For now, we don't support hard deletion of appointments
      // Use the cancel endpoint instead to mark appointments as cancelled
      return res.status(405).json(this.createErrorResponse(
        ErrorCode.METHOD_NOT_ALLOWED,
        'Appointment deletion is not supported. Use the cancel endpoint to mark appointments as cancelled.',
        req.requestId
      ));
    } catch (error) {
      res.status(500).json(this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Failed to process delete request',
        req.requestId
      ));
    }
  }

  /**
   * Handle list appointments
   */
  async handleListAppointments(req, res) {
    try {
      const { status, userEmail, limit = '10', offset = '0' } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (userEmail) filters.userEmail = userEmail;
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const appointmentService = appointmentCore.getAppointmentService();
      const appointments = await appointmentService.listAppointments(filters);

      res.status(200).json({
        success: true,
        data: appointments,
        meta: {
          count: appointments.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json(this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Failed to list appointments',
        req.requestId
      ));
    }
  }

  /**
   * Handle check availability
   */
  async handleCheckAvailability(req, res) {
    try {
      const { startTime, endTime, excludeId } = req.query;

      if (!startTime || !endTime) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'startTime and endTime are required',
          req.requestId
        ));
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json(this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Invalid date format',
          req.requestId
        ));
      }

      const timeSlotService = appointmentCore.getTimeSlotService();
      const availability = await timeSlotService.checkAvailability(start, end, excludeId);

      res.status(200).json({
        success: true,
        data: availability,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json(this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Failed to check availability',
        req.requestId
      ));
    }
  }

  /**
   * Handle get stats
   */
  async handleGetStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      let start, end;
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json(this.createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Invalid date format',
            req.requestId
          ));
        }
      } else {
        // Default to current month
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const calendarService = appointmentCore.getCalendarService();
      const stats = await calendarService.getAppointmentStats(start, end);

      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json(this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get statistics',
        req.requestId
      ));
    }
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(code, message, requestId, details = null) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId
      }
    };
  }

  /**
   * Initialize the server
   */
  async initialize() {
    try {
      // Load environment configuration
      const envConfig = new EnvironmentConfig();
      const config = envConfig.getConfig();
      
      await appointmentCore.initialize(config);
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize appointment core:', error.message);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(this.port, () => {
      });

      // Graceful shutdown
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));

      return this.server;
    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      throw error;
    }
  }

  /**
   * Shutdown the server gracefully
   */
  async shutdown() {
    
    if (this.server) {
      this.server.close(() => {
      });
    }

    try {
      await appointmentCore.close();
    } catch (error) {
      console.error('❌ Error closing appointment core:', error.message);
    }

    process.exit(0);
  }
}

// Vercel compatibility
if (require.main === module) {
  const server = new AppointmentServer();
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

// Export the Express app for Vercel
module.exports = AppointmentServer;
module.exports.app = new AppointmentServer().app;
