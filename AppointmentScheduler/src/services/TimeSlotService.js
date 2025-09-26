#!/usr/bin/env node
/**
 * Time Slot Service
 * 
 * Manages time slot generation, availability checking, and scheduling logic:
 * - Generate available time slots for calendar views
 * - Check slot availability in real-time
 * - Handle time zone conversions
 * - Manage business hours constraints
 * 
 * Maps to TASK-009: Implement Core Library
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Anti-Abstraction Gate, Traceability Gate
 */

const { 
  BUSINESS_HOURS,
  DEFAULT_APPOINTMENT_DURATION,
  MIN_APPOINTMENT_DURATION,
  MAX_APPOINTMENT_DURATION,
  AppointmentStatus
} = require('../models');

class TimeSlotService {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  /**
   * Generate time slots for a specific day
   * @param {Date} date - Date to generate slots for
   * @param {number} [duration=60] - Slot duration in minutes
   * @returns {Promise<Array>} Array of time slots
   */
  async generateTimeSlots(date, duration = DEFAULT_APPOINTMENT_DURATION) {
    try {
      // Validate duration
      if (duration < MIN_APPOINTMENT_DURATION || duration > MAX_APPOINTMENT_DURATION) {
        throw new Error(`Duration must be between ${MIN_APPOINTMENT_DURATION} and ${MAX_APPOINTMENT_DURATION} minutes`);
      }
      
      // Generate base time slots for business hours
      const baseSlots = this._generateBaseTimeSlots(date, duration);
      
      // Get existing appointments for the day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existingAppointments = await this.appointmentRepository.find({
        startDate: startOfDay,
        endDate: endOfDay,
        // Include both CONFIRMED and PENDING appointments to mark slots as unavailable
        status: ['confirmed', 'pending']
      });
      
      // Mark slots as available/unavailable based on existing appointments
      const timeSlots = await this._markSlotAvailability(baseSlots, existingAppointments);
      
      return timeSlots;
    } catch (error) {
      throw new Error(`Failed to generate time slots: ${error.message}`);
    }
  }

  /**
   * Check availability for a specific time range
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {string} [excludeAppointmentId] - Appointment ID to exclude from conflict check
   * @returns {Promise<Object>} Availability result
   */
  async checkAvailability(startTime, endTime, excludeAppointmentId = null) {
    try {
      // Validate time range
      if (startTime >= endTime) {
        throw new Error('Start time must be before end time');
      }
      
      // Check for conflicts
      const conflicts = await this._findConflictingAppointments(
        startTime, 
        endTime, 
        excludeAppointmentId
      );
      
      const isAvailable = conflicts.length === 0;
      
      return {
        isAvailable,
        conflictingAppointments: conflicts.map(app => app.id),
        availableSlots: isAvailable ? [{
          startTime,
          endTime,
          duration: (endTime.getTime() - startTime.getTime()) / (1000 * 60)
        }] : []
      };
    } catch (error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  /**
   * Get available slots for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} [duration=60] - Slot duration in minutes
   * @returns {Promise<Array>} Available time slots
   */
  async getAvailableSlots(startDate, endDate, duration = DEFAULT_APPOINTMENT_DURATION) {
    try {
      const availableSlots = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const daySlots = await this.generateTimeSlots(currentDate, duration);
        const availableDaySlots = daySlots.filter(slot => slot.isAvailable);
        availableSlots.push(...availableDaySlots);
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return availableSlots;
    } catch (error) {
      throw new Error(`Failed to get available slots: ${error.message}`);
    }
  }

  /**
   * Generate base time slots for business hours
   * @private
   */
  _generateBaseTimeSlots(date, duration) {
    const slots = [];
    const startHour = 9;  // 9:00 AM
    const endHour = 16;   // 4:00 PM (16:00)
    const now = new Date(); // Current date and time
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    
    // Check if the entire date is in the past
    const isPastDate = date < today;
    
    // Create slots from 9:00 AM to 4:00 PM
    for (let hour = startHour; hour < endHour; hour++) {
      const slotsPerHour = Math.floor(60 / duration);
      
      for (let slotIndex = 0; slotIndex < slotsPerHour; slotIndex++) {
        const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, slotIndex * duration, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);
        
        // Skip if slot goes beyond 4:00 PM
        if (slotEnd.getHours() > endHour) {
          continue;
        }
        
        // Check if this slot is in the past (either past date or past time today)
        const isPastSlot = isPastDate || slotStart <= now;
        
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          duration: duration,
          isAvailable: !isPastSlot // Available only if not in the past
        });
      }
    }
    
    return slots;
  }

  /**
   * Mark slot availability based on existing appointments
   * @private
   */
  async _markSlotAvailability(slots, existingAppointments) {
    return slots.map(slot => {
      const hasConflict = existingAppointments.some(appointment => {
        return this._slotsOverlap(slot, {
          startTime: appointment.startTime,
          endTime: appointment.endTime
        });
      });
      
      return {
        ...slot,
        isAvailable: slot.isAvailable && !hasConflict // Preserve past date logic AND check conflicts
      };
    });
  }

  /**
   * Check if two time slots overlap
   * @private
   */
  _slotsOverlap(slot1, slot2) {
    // Ensure we're comparing Date objects
    const start1 = new Date(slot1.startTime);
    const end1 = new Date(slot1.endTime);
    const start2 = new Date(slot2.startTime);
    const end2 = new Date(slot2.endTime);
    
    // Check if slots overlap using the standard overlap formula
    // Two time ranges overlap if: start1 < end2 AND end1 > start2
    const overlaps = start1 < end2 && end1 > start2;
    
    return overlaps;
  }

  /**
   * Find conflicting appointments for a time range
   * @private
   */
  async _findConflictingAppointments(startTime, endTime, excludeAppointmentId) {
    const filters = {
      startDate: startTime,
      endDate: endTime,
      // Check for both CONFIRMED and PENDING appointments to prevent conflicts
      status: ['confirmed', 'pending']
    };
    
    if (excludeAppointmentId) {
      filters.excludeId = excludeAppointmentId;
    }
    
    const appointments = await this.appointmentRepository.find(filters);
    
    // Filter for actual conflicts
    return appointments.filter(appointment => {
      return this._slotsOverlap(
        { startTime, endTime },
        { startTime: appointment.startTime, endTime: appointment.endTime }
      );
    });
  }

  /**
   * Convert time slots to different timezone
   * @param {Array} slots - Time slots
   * @param {string} targetTimezone - Target timezone
   * @returns {Array} Converted time slots
   */
  convertTimeSlotsToTimezone(slots, targetTimezone) {
    return slots.map(slot => {
      const startTime = new Date(slot.startTime.toLocaleString('en-US', { timeZone: targetTimezone }));
      const endTime = new Date(slot.endTime.toLocaleString('en-US', { timeZone: targetTimezone }));
      
      return {
        ...slot,
        startTime,
        endTime
      };
    });
  }

  /**
   * Get business hours for a specific timezone
   * @param {string} timezone - Timezone
   * @returns {Object} Business hours in the timezone
   */
  getBusinessHours(timezone = 'Europe/Istanbul') {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    // Convert UTC business hours to local timezone
    const localStart = new Date();
    localStart.setUTCHours(BUSINESS_HOURS.START, 0, 0, 0);
    const localStartHour = new Date(localStart.toLocaleString('en-US', { timeZone: timezone })).getHours();
    
    const localEnd = new Date();
    localEnd.setUTCHours(BUSINESS_HOURS.END, 0, 0, 0);
    const localEndHour = new Date(localEnd.toLocaleString('en-US', { timeZone: timezone })).getHours();
    
    return {
      start: localStartHour,
      end: localEndHour,
      timezone: timezone
    };
  }
}

module.exports = TimeSlotService;
