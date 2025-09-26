#!/usr/bin/env node
/**
 * Conflict Service
 * 
 * Handles conflict detection and prevention for appointments:
 * - Real-time conflict checking
 * - Overlapping appointment detection
 * - Resource availability validation
 * - Automatic conflict resolution
 * 
 * Maps to TASK-009: Implement Core Library
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Anti-Abstraction Gate, Traceability Gate
 */

const { 
  AppointmentStatus,
  validateAppointmentConflicts
} = require('../models');

class ConflictService {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  /**
   * Check for conflicts in a time range
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {string} [excludeAppointmentId] - Appointment ID to exclude from conflict check
   * @returns {Promise<Object>} Conflict check result
   */
  async checkConflicts(startTime, endTime, excludeAppointmentId = null) {
    try {
      // Validate time range
      if (startTime >= endTime) {
        throw new Error('Start time must be before end time');
      }
      
      // Get existing appointments in the time range
      const existingAppointments = await this._getAppointmentsInRange(
        startTime, 
        endTime, 
        excludeAppointmentId
      );
      
      // Check for conflicts
      const conflicts = existingAppointments.filter(appointment => {
        return this._appointmentsOverlap(
          { startTime, endTime },
          { startTime: appointment.startTime, endTime: appointment.endTime }
        );
      });
      
      const hasConflict = conflicts.length > 0;
      
      return {
        hasConflict,
        conflictingAppointments: conflicts.map(app => app.id),
        conflictDetails: conflicts.map(app => ({
          id: app.id,
          startTime: app.startTime,
          endTime: app.endTime,
          userEmail: app.userEmail,
          userName: app.userName,
          status: app.status
        }))
      };
    } catch (error) {
      throw new Error(`Failed to check conflicts: ${error.message}`);
    }
  }

  /**
   * Validate appointment conflicts using business rules
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {Array} existingAppointments - Existing appointments
   * @param {string} [excludeAppointmentId] - Appointment ID to exclude
   * @returns {Object} Validation result
   */
  validateAppointmentConflicts(startTime, endTime, existingAppointments, excludeAppointmentId = null) {
    try {
      // Filter out excluded appointment
      const filteredAppointments = excludeAppointmentId 
        ? existingAppointments.filter(app => app.id !== excludeAppointmentId)
        : existingAppointments;
      
      // Use the validation utility
      return validateAppointmentConflicts(startTime, endTime, filteredAppointments, excludeAppointmentId);
    } catch (error) {
      throw new Error(`Failed to validate appointment conflicts: ${error.message}`);
    }
  }

  /**
   * Get conflicting appointments for a time range
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {string} [excludeAppointmentId] - Appointment ID to exclude
   * @returns {Promise<Array>} Conflicting appointments
   */
  async getConflictingAppointments(startTime, endTime, excludeAppointmentId = null) {
    try {
      const conflictResult = await this.checkConflicts(startTime, endTime, excludeAppointmentId);
      
      if (!conflictResult.hasConflict) {
        return [];
      }
      
      // Get full appointment details for conflicts
      const conflictingAppointments = await Promise.all(
        conflictResult.conflictingAppointments.map(id => 
          this.appointmentRepository.findById(id)
        )
      );
      
      return conflictingAppointments.filter(app => app !== null);
    } catch (error) {
      throw new Error(`Failed to get conflicting appointments: ${error.message}`);
    }
  }

  /**
   * Suggest alternative time slots
   * @param {Date} preferredStartTime - Preferred start time
   * @param {Date} preferredEndTime - Preferred end time
   * @param {number} [duration=60] - Appointment duration in minutes
   * @param {number} [maxSuggestions=5] - Maximum number of suggestions
   * @returns {Promise<Array>} Alternative time slot suggestions
   */
  async suggestAlternativeSlots(preferredStartTime, preferredEndTime, duration = 60, maxSuggestions = 5) {
    try {
      const suggestions = [];
      const durationMs = duration * 60 * 1000;
      
      // Check slots before preferred time
      for (let i = 1; i <= 3; i++) {
        const slotStart = new Date(preferredStartTime.getTime() - (i * durationMs));
        const slotEnd = new Date(slotStart.getTime() + durationMs);
        
        // Skip if before business hours
        if (slotStart.getUTCHours() < 9) continue;
        
        const conflicts = await this.checkConflicts(slotStart, slotEnd);
        if (!conflicts.hasConflict) {
          suggestions.push({
            startTime: slotStart,
            endTime: slotEnd,
            type: 'before',
            offset: -i * duration
          });
        }
        
        if (suggestions.length >= maxSuggestions) break;
      }
      
      // Check slots after preferred time
      for (let i = 1; i <= 3; i++) {
        const slotStart = new Date(preferredStartTime.getTime() + (i * durationMs));
        const slotEnd = new Date(slotStart.getTime() + durationMs);
        
        // Skip if after business hours
        if (slotEnd.getUTCHours() > 17) continue;
        
        const conflicts = await this.checkConflicts(slotStart, slotEnd);
        if (!conflicts.hasConflict) {
          suggestions.push({
            startTime: slotStart,
            endTime: slotEnd,
            type: 'after',
            offset: i * duration
          });
        }
        
        if (suggestions.length >= maxSuggestions) break;
      }
      
      // Sort by proximity to preferred time
      suggestions.sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));
      
      return suggestions.slice(0, maxSuggestions);
    } catch (error) {
      throw new Error(`Failed to suggest alternative slots: ${error.message}`);
    }
  }

  /**
   * Check for resource conflicts (e.g., room, equipment)
   * @param {string} resourceId - Resource identifier
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {string} [excludeAppointmentId] - Appointment ID to exclude
   * @returns {Promise<Object>} Resource conflict result
   */
  async checkResourceConflicts(resourceId, startTime, endTime, excludeAppointmentId = null) {
    try {
      // For now, we assume single resource (the appointment system itself)
      // In a multi-resource system, this would check specific resource availability
      
      const conflicts = await this.checkConflicts(startTime, endTime, excludeAppointmentId);
      
      return {
        resourceId,
        hasConflict: conflicts.hasConflict,
        conflictingAppointments: conflicts.conflictingAppointments,
        available: !conflicts.hasConflict
      };
    } catch (error) {
      throw new Error(`Failed to check resource conflicts: ${error.message}`);
    }
  }

  /**
   * Get conflict statistics for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Conflict statistics
   */
  async getConflictStats(startDate, endDate) {
    try {
      const appointments = await this.appointmentRepository.find({
        startDate,
        endDate,
        status: AppointmentStatus.CONFIRMED
      });
      
      let totalConflicts = 0;
      let resolvedConflicts = 0;
      const conflictTypes = {
        overlapping: 0,
        resource: 0,
        scheduling: 0
      };
      
      // Check each appointment for conflicts
      for (const appointment of appointments) {
        const conflicts = await this.checkConflicts(
          appointment.startTime, 
          appointment.endTime, 
          appointment.id
        );
        
        if (conflicts.hasConflict) {
          totalConflicts++;
          conflictTypes.overlapping += conflicts.conflictingAppointments.length;
        }
      }
      
      return {
        totalAppointments: appointments.length,
        totalConflicts,
        resolvedConflicts,
        conflictRate: appointments.length > 0 ? totalConflicts / appointments.length : 0,
        conflictTypes,
        averageConflictsPerAppointment: totalConflicts > 0 ? conflictTypes.overlapping / totalConflicts : 0
      };
    } catch (error) {
      throw new Error(`Failed to get conflict stats: ${error.message}`);
    }
  }

  /**
   * Get appointments in a time range
   * @private
   */
  async _getAppointmentsInRange(startTime, endTime, excludeAppointmentId = null) {
    const filters = {
      startDate: startTime,
      endDate: endTime,
      // Check for both CONFIRMED and PENDING appointments to prevent conflicts
      status: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]
    };
    
    if (excludeAppointmentId) {
      filters.excludeId = excludeAppointmentId;
    }
    
    return await this.appointmentRepository.find(filters);
  }

  /**
   * Check if two appointments overlap
   * @private
   */
  _appointmentsOverlap(appointment1, appointment2) {
    return appointment1.startTime < appointment2.endTime && 
           appointment1.endTime > appointment2.startTime;
  }

  /**
   * Calculate overlap duration between two appointments
   * @param {Object} appointment1 - First appointment
   * @param {Object} appointment2 - Second appointment
   * @returns {number} Overlap duration in minutes
   */
  calculateOverlapDuration(appointment1, appointment2) {
    const overlapStart = new Date(Math.max(appointment1.startTime.getTime(), appointment2.startTime.getTime()));
    const overlapEnd = new Date(Math.min(appointment1.endTime.getTime(), appointment2.endTime.getTime()));
    
    if (overlapStart >= overlapEnd) {
      return 0;
    }
    
    return (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
  }

  /**
   * Get conflict resolution suggestions
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Array>} Conflict resolution suggestions
   */
  async getConflictResolutionSuggestions(appointmentId) {
    try {
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found`);
      }
      
      const conflicts = await this.getConflictingAppointments(
        appointment.startTime, 
        appointment.endTime, 
        appointmentId
      );
      
      if (conflicts.length === 0) {
        return [];
      }
      
      const suggestions = [];
      
      // Suggest rescheduling
      const alternativeSlots = await this.suggestAlternativeSlots(
        appointment.startTime,
        appointment.endTime,
        (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60)
      );
      
      suggestions.push({
        type: 'reschedule',
        description: 'Reschedule to an available time slot',
        alternatives: alternativeSlots
      });
      
      // Suggest cancellation
      suggestions.push({
        type: 'cancel',
        description: 'Cancel the appointment to resolve conflict',
        impact: 'Appointment will be cancelled'
      });
      
      return suggestions;
    } catch (error) {
      throw new Error(`Failed to get conflict resolution suggestions: ${error.message}`);
    }
  }
}

module.exports = ConflictService;
