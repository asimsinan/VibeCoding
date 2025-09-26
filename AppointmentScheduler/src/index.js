#!/usr/bin/env node
/**
 * Appointment Core Library
 * 
 * Main entry point for the appointment-core library:
 * - Service initialization and dependency injection
 * - Public API exposure
 * - Configuration management
 * - Error handling and logging
 * 
 * Maps to TASK-009: Implement Core Library
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Anti-Abstraction Gate, Traceability Gate
 */

const AppointmentService = require('./services/AppointmentService');
const TimeSlotService = require('./services/TimeSlotService');
const CalendarService = require('./services/CalendarService');
const ConflictService = require('./services/ConflictService');
const AppointmentRepository = require('./repositories/AppointmentRepository');
const DatabaseConnection = require('./repositories/DatabaseConnection');

// Re-export models for external use
const models = require('./models');

class AppointmentCore {
  constructor(config = {}) {
    this.config = this._mergeConfig(config);
    this.databaseConnection = null;
    this.appointmentRepository = null;
    this.services = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the appointment core library
   * @param {Object} config - Configuration options
   * @returns {Promise<void>}
   */
  async initialize(config = {}) {
    try {
      this.config = this._mergeConfig(config);
      
      // Initialize database connection
      this.databaseConnection = new DatabaseConnection(this.config.database);
      await this.databaseConnection.connect();
      
      // Initialize repository
      this.appointmentRepository = new AppointmentRepository(this.databaseConnection);
      
      // Initialize services
      this.conflictService = new ConflictService(this.appointmentRepository);
      this.timeSlotService = new TimeSlotService(this.appointmentRepository);
      this.appointmentService = new AppointmentService(this.appointmentRepository, this.conflictService);
      this.calendarService = new CalendarService(this.appointmentRepository, this.timeSlotService);
      
      // Store services for easy access
      this.services = {
        appointment: this.appointmentService,
        timeSlot: this.timeSlotService,
        calendar: this.calendarService,
        conflict: this.conflictService
      };
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize appointment core: ${error.message}`);
    }
  }

  /**
   * Get appointment service
   * @returns {AppointmentService} Appointment service instance
   */
  getAppointmentService() {
    this._ensureInitialized();
    return this.appointmentService;
  }

  /**
   * Get time slot service
   * @returns {TimeSlotService} Time slot service instance
   */
  getTimeSlotService() {
    this._ensureInitialized();
    return this.timeSlotService;
  }

  /**
   * Get calendar service
   * @returns {CalendarService} Calendar service instance
   */
  getCalendarService() {
    this._ensureInitialized();
    return this.calendarService;
  }

  /**
   * Get conflict service
   * @returns {ConflictService} Conflict service instance
   */
  getConflictService() {
    this._ensureInitialized();
    return this.conflictService;
  }

  /**
   * Get appointment repository
   * @returns {AppointmentRepository} Appointment repository instance
   */
  getAppointmentRepository() {
    this._ensureInitialized();
    return this.appointmentRepository;
  }

  /**
   * Get database connection
   * @returns {DatabaseConnection} Database connection instance
   */
  getDatabaseConnection() {
    this._ensureInitialized();
    return this.databaseConnection;
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return {
          healthy: false,
          error: 'Library not initialized'
        };
      }

      const dbHealth = await this.databaseConnection.healthCheck();
      
      return {
        healthy: dbHealth.healthy,
        database: dbHealth,
        services: Object.keys(this.services),
        initialized: this.isInitialized
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Close all connections and cleanup
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.databaseConnection) {
        await this.databaseConnection.close();
      }
      
      this.isInitialized = false;
      this.services = {};
      this.appointmentRepository = null;
      this.databaseConnection = null;
    } catch (error) {
      throw new Error(`Failed to close appointment core: ${error.message}`);
    }
  }

  /**
   * Get library version
   * @returns {string} Library version
   */
  getVersion() {
    return require('../package.json').version;
  }

  /**
   * Get library information
   * @returns {Object} Library information
   */
  getInfo() {
    return {
      name: 'appointment-core',
      version: this.getVersion(),
      description: 'Core library for appointment scheduling and management',
      initialized: this.isInitialized,
      services: this.isInitialized ? Object.keys(this.services) : []
    };
  }

  /**
   * Merge configuration with defaults
   * @private
   */
  _mergeConfig(config) {
    const defaults = {
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'appointment_scheduler',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        maxConnections: 20,
        minConnections: 5,
        idleTimeout: 30000,
        connectionTimeout: 10000,
        ssl: false
      },
      logging: {
        enabled: true,
        level: 'info'
      },
      performance: {
        slowQueryThreshold: 1000,
        maxRetries: 3
      }
    };

    return this._deepMerge(defaults, config);
  }

  /**
   * Deep merge objects
   * @private
   */
  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Ensure library is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Appointment core library is not initialized. Call initialize() first.');
    }
  }
}

// Create singleton instance
const appointmentCore = new AppointmentCore();

// Export both class and singleton instance
module.exports = {
  AppointmentCore,
  appointmentCore,
  models,
  
  // Convenience methods for singleton
  async initialize(config) {
    return await appointmentCore.initialize(config);
  },
  
  getAppointmentService() {
    return appointmentCore.getAppointmentService();
  },
  
  getTimeSlotService() {
    return appointmentCore.getTimeSlotService();
  },
  
  getCalendarService() {
    return appointmentCore.getCalendarService();
  },
  
  getConflictService() {
    return appointmentCore.getConflictService();
  },
  
  async healthCheck() {
    return await appointmentCore.healthCheck();
  },
  
  async close() {
    return await appointmentCore.close();
  },
  
  getVersion() {
    return appointmentCore.getVersion();
  },
  
  getInfo() {
    return appointmentCore.getInfo();
  }
};
