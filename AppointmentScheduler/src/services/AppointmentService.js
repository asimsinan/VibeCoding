#!/usr/bin/env node
/**
 * Appointment Service
 * 
 * Core business logic for appointment management including:
 * - Appointment booking and validation
 * - Conflict detection and prevention
 * - Status management and updates
 * - Business rule enforcement
 * 
 * Maps to TASK-009: Implement Core Library
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Anti-Abstraction Gate, Traceability Gate
 */

const { v4: uuidv4 } = require('uuid');
const { 
  AppointmentStatus,
  validateBusinessHours,
  validateAppointmentDuration,
  sanitizeEmail,
  sanitizeUserName,
  sanitizeNotes
} = require('../models');

class AppointmentService {
  constructor(appointmentRepository, conflictService) {
    this.appointmentRepository = appointmentRepository;
    this.conflictService = conflictService;
  }

  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment data
   * @param {Date} appointmentData.startTime - Start time
   * @param {Date} appointmentData.endTime - End time
   * @param {string} appointmentData.userEmail - User email
   * @param {string} appointmentData.userName - User name
   * @param {string} [appointmentData.notes] - Optional notes
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointment(appointmentData) {
    try {
      // Validate and sanitize input data
      const sanitizedData = this._sanitizeAppointmentData(appointmentData);
      
      // Validate business rules
      await this._validateAppointmentCreation(sanitizedData);
      
      // Check for conflicts
      const conflicts = await this.conflictService.checkConflicts(
        sanitizedData.startTime,
        sanitizedData.endTime
      );
      
      if (conflicts.hasConflict) {
        throw new Error(`Appointment conflicts with existing appointments: ${conflicts.conflictingAppointments.join(', ')}`);
      }
      
      // Create appointment
      const appointment = {
        id: uuidv4(),
        startTime: sanitizedData.startTime,
        endTime: sanitizedData.endTime,
        userEmail: sanitizedData.userEmail,
        userName: sanitizedData.userName,
        notes: sanitizedData.notes || '',
        status: AppointmentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to database
      const savedAppointment = await this.appointmentRepository.create(appointment);
      
      return savedAppointment;
    } catch (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }
  }

  /**
   * Update an existing appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointment(appointmentId, updateData) {
    try {
      // Get existing appointment
      const existingAppointment = await this.appointmentRepository.findById(appointmentId);
      if (!existingAppointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found`);
      }
      
      // Validate update data
      const sanitizedData = this._sanitizeUpdateData(updateData);
      
      // Check for conflicts if time is being updated
      if (sanitizedData.startTime || sanitizedData.endTime) {
        const startTime = sanitizedData.startTime || existingAppointment.startTime;
        const endTime = sanitizedData.endTime || existingAppointment.endTime;
        
        const conflicts = await this.conflictService.checkConflicts(
          startTime,
          endTime,
          appointmentId // Exclude current appointment from conflict check
        );
        
        if (conflicts.hasConflict) {
          throw new Error(`Updated appointment conflicts with existing appointments: ${conflicts.conflictingAppointments.join(', ')}`);
        }
      }
      
      // Update appointment
      const updatedAppointment = {
        ...existingAppointment,
        ...sanitizedData,
        updatedAt: new Date()
      };
      
      const savedAppointment = await this.appointmentRepository.update(appointmentId, updatedAppointment);
      
      return savedAppointment;
    } catch (error) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }
  }

  /**
   * Cancel an appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} Cancelled appointment
   */
  async cancelAppointment(appointmentId) {
    try {
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found`);
      }
      
      if (appointment.status === AppointmentStatus.CANCELLED) {
        throw new Error('Appointment is already cancelled');
      }
      
      const updatedAppointment = await this.updateAppointment(appointmentId, {
        status: AppointmentStatus.CANCELLED
      });
      
      return updatedAppointment;
    } catch (error) {
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }
  }

  /**
   * Get appointment by ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} Appointment
   */
  async getAppointment(appointmentId) {
    try {
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found`);
      }
      
      return appointment;
    } catch (error) {
      throw new Error(`Failed to get appointment: ${error.message}`);
    }
  }

  /**
   * List appointments with optional filtering
   * @param {Object} filters - Filter options
   * @param {string} [filters.status] - Appointment status filter
   * @param {string} [filters.userEmail] - User email filter
   * @param {Date} [filters.startDate] - Start date filter
   * @param {Date} [filters.endDate] - End date filter
   * @returns {Promise<Array>} List of appointments
   */
  async listAppointments(filters = {}) {
    try {
      const appointments = await this.appointmentRepository.find(filters);
      return appointments;
    } catch (error) {
      throw new Error(`Failed to list appointments: ${error.message}`);
    }
  }

  /**
   * Sanitize appointment data
   * @private
   */
  _sanitizeAppointmentData(data) {
    return {
      startTime: data.startTime,
      endTime: data.endTime,
      userEmail: sanitizeEmail(data.userEmail),
      userName: sanitizeUserName(data.userName),
      notes: data.notes ? sanitizeNotes(data.notes) : ''
    };
  }

  /**
   * Sanitize update data
   * @private
   */
  _sanitizeUpdateData(data) {
    const sanitized = {};
    
    if (data.startTime) sanitized.startTime = data.startTime;
    if (data.endTime) sanitized.endTime = data.endTime;
    if (data.userEmail) sanitized.userEmail = sanitizeEmail(data.userEmail);
    if (data.userName) sanitized.userName = sanitizeUserName(data.userName);
    if (data.notes !== undefined) sanitized.notes = sanitizeNotes(data.notes);
    if (data.status) sanitized.status = data.status;
    
    return sanitized;
  }

  /**
   * Validate appointment creation
   * @private
   */
  async _validateAppointmentCreation(data) {
    // Validate duration
    const durationResult = validateAppointmentDuration(data.startTime, data.endTime);
    if (!durationResult.isValid) {
      throw new Error(durationResult.error);
    }
  }
}

module.exports = AppointmentService;
