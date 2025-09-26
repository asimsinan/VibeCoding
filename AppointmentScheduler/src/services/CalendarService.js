#!/usr/bin/env node
/**
 * Calendar Service
 * 
 * Handles calendar view generation and management:
 * - Generate monthly calendar views
 * - Display appointment information
 * - Handle time zone conversions
 * - Manage calendar data formatting
 * 
 * Maps to TASK-009: Implement Core Library
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Anti-Abstraction Gate, Traceability Gate
 */

const { 
  generateCalendarDays,
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR,
  AppointmentStatus
} = require('../models');

class CalendarService {
  constructor(appointmentRepository, timeSlotService) {
    this.appointmentRepository = appointmentRepository;
    this.timeSlotService = timeSlotService;
  }

  /**
   * Generate calendar view for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} [slotDuration=60] - Duration for time slots
   * @param {string} [timezone='Europe/Istanbul'] - Timezone
   * @returns {Promise<Object>} Calendar data
   */
  async generateCalendar(year, month, slotDuration = 60, timezone = 'Europe/Istanbul') {
    try {
      // Validate inputs
      this._validateCalendarInputs(year, month);
      
      // Generate calendar days
      const days = generateCalendarDays(year, month);
      
      // Get appointments for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      const appointments = await this.appointmentRepository.find({
        startDate,
        endDate,
        // Include both CONFIRMED and PENDING appointments to show unavailable slots
        status: ['confirmed', 'pending']
      });
      
      
      // Generate time slots for each day
      const calendarDays = await Promise.all(
        days.map(async (day) => {
          // day.date is already a Date object (converted to timezone)
          const dayDate = day.date;
          const timeSlots = await this.timeSlotService.generateTimeSlots(
            dayDate, 
            slotDuration
          );
          
          // Get appointments for this day
          const dayAppointments = appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.startTime);
            const dayDate = day.date; // day.date is already a Date object
            
            
            return appointmentDate.getFullYear() === dayDate.getFullYear() &&
                   appointmentDate.getMonth() === dayDate.getMonth() &&
                   appointmentDate.getDate() === dayDate.getDate();
          });
          
          return {
            ...day,
            timeSlots,
            appointments: dayAppointments,
            availableSlots: timeSlots.filter(slot => slot.isAvailable).length,
            totalSlots: timeSlots.length
          };
        })
      );
      
      // Calculate calendar statistics
      const stats = this._calculateCalendarStats(calendarDays, appointments);
      
      return {
        year,
        month,
        monthName: MONTHS_OF_YEAR[month - 1],
        timezone,
        days: calendarDays,
        stats,
        businessHours: this.timeSlotService.getBusinessHours(timezone)
      };
    } catch (error) {
      throw new Error(`Failed to generate calendar: ${error.message}`);
    }
  }

  /**
   * Get calendar data for a specific date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} [timezone='UTC'] - Timezone
   * @returns {Promise<Object>} Calendar data for date range
   */
  async getCalendarRange(startDate, endDate, timezone = 'Europe/Istanbul') {
    try {
      const calendars = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const calendar = await this.generateCalendar(year, month, timezone);
        calendars.push(calendar);
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      return {
        startDate,
        endDate,
        timezone,
        calendars,
        totalDays: calendars.reduce((sum, cal) => sum + cal.days.length, 0),
        totalAppointments: calendars.reduce((sum, cal) => sum + cal.stats.totalAppointments, 0)
      };
    } catch (error) {
      throw new Error(`Failed to get calendar range: ${error.message}`);
    }
  }

  /**
   * Get calendar summary for a month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {string} [timezone='UTC'] - Timezone
   * @returns {Promise<Object>} Calendar summary
   */
  async getCalendarSummary(year, month, timezone = 'Europe/Istanbul') {
    try {
      const calendar = await this.generateCalendar(year, month, timezone);
      
      return {
        year,
        month,
        monthName: calendar.monthName,
        timezone,
        totalDays: calendar.days.length,
        businessDays: calendar.days.filter(day => day.dayOfWeek >= 1 && day.dayOfWeek <= 5).length,
        totalAppointments: calendar.stats.totalAppointments,
        availableSlots: calendar.stats.totalAvailableSlots,
        utilizationRate: calendar.stats.utilizationRate,
        popularTimeSlots: calendar.stats.popularTimeSlots
      };
    } catch (error) {
      throw new Error(`Failed to get calendar summary: ${error.message}`);
    }
  }

  /**
   * Get upcoming appointments for a user
   * @param {string} userEmail - User email
   * @param {number} [limit=10] - Number of appointments to return
   * @returns {Promise<Array>} Upcoming appointments
   */
  async getUpcomingAppointments(userEmail, limit = 10) {
    try {
      const now = new Date();
      
      const appointments = await this.appointmentRepository.find({
        userEmail,
        startDate: now,
        status: AppointmentStatus.CONFIRMED,
        limit,
        sortBy: 'startTime',
        sortOrder: 'ASC'
      });
      
      return appointments;
    } catch (error) {
      throw new Error(`Failed to get upcoming appointments: ${error.message}`);
    }
  }

  /**
   * Get appointment statistics for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Appointment statistics
   */
  async getAppointmentStats(startDate, endDate) {
    try {
      const appointments = await this.appointmentRepository.find({
        startDate,
        endDate
      });
      
      const stats = {
        totalAppointments: appointments.length,
        confirmedAppointments: appointments.filter(app => app.status === AppointmentStatus.CONFIRMED).length,
        pendingAppointments: appointments.filter(app => app.status === AppointmentStatus.PENDING).length,
        cancelledAppointments: appointments.filter(app => app.status === AppointmentStatus.CANCELLED).length,
        averageDuration: this._calculateAverageDuration(appointments),
        popularHours: this._getPopularHours(appointments),
        dailyStats: this._getDailyStats(appointments, startDate, endDate)
      };
      
      return stats;
    } catch (error) {
      throw new Error(`Failed to get appointment stats: ${error.message}`);
    }
  }

  /**
   * Validate calendar inputs
   * @private
   */
  _validateCalendarInputs(year, month) {
    if (!Number.isInteger(year) || year < 2020 || year > 2030) {
      throw new Error('Year must be between 2020 and 2030');
    }
    
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
  }

  /**
   * Calculate calendar statistics
   * @private
   */
  _calculateCalendarStats(calendarDays, appointments) {
    const totalAppointments = appointments.length;
    const totalAvailableSlots = calendarDays.reduce((sum, day) => sum + day.availableSlots, 0);
    const totalSlots = calendarDays.reduce((sum, day) => sum + day.totalSlots, 0);
    const utilizationRate = totalSlots > 0 ? (totalSlots - totalAvailableSlots) / totalSlots : 0;
    
    // Get popular time slots
    const hourCounts = {};
    appointments.forEach(appointment => {
      const hour = appointment.startTime.getHours(); // Use getHours instead of getUTCHours
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const popularTimeSlots = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        timeSlot: `${hour}:00 - ${parseInt(hour) + 1}:00`
      }));
    
    return {
      totalAppointments,
      totalAvailableSlots,
      totalSlots,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      popularTimeSlots
    };
  }

  /**
   * Calculate average appointment duration
   * @private
   */
  _calculateAverageDuration(appointments) {
    if (appointments.length === 0) return 0;
    
    const totalDuration = appointments.reduce((sum, appointment) => {
      return sum + (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60);
    }, 0);
    
    return Math.round(totalDuration / appointments.length);
  }

  /**
   * Get popular hours
   * @private
   */
  _getPopularHours(appointments) {
    const hourCounts = {};
    appointments.forEach(appointment => {
      const hour = appointment.startTime.getHours(); // Use getHours instead of getUTCHours
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        percentage: Math.round((count / appointments.length) * 100)
      }));
  }

  /**
   * Get daily statistics
   * @private
   */
  _getDailyStats(appointments, startDate, endDate) {
    const dailyStats = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(appointment => {
        const appointmentDate = appointment.startTime.toISOString().split('T')[0];
        return appointmentDate === dateKey;
      });
      
      dailyStats[dateKey] = {
        date: new Date(currentDate),
        appointments: dayAppointments.length,
        confirmed: dayAppointments.filter(app => app.status === AppointmentStatus.CONFIRMED).length,
        pending: dayAppointments.filter(app => app.status === AppointmentStatus.PENDING).length,
        cancelled: dayAppointments.filter(app => app.status === AppointmentStatus.CANCELLED).length
      };
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dailyStats;
  }
}

module.exports = CalendarService;
