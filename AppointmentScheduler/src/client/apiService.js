/**
 * API Service Layer
 * 
 * Service layer that uses the API client to interact with the backend:
 * - Calendar API operations
 * - Appointment API operations
 * - Availability API operations
 * - Statistics API operations
 * - Health check operations
 * - Error handling and data transformation
 * 
 * Maps to TASK-014: API Client Setup
 * TDD Phase: Contract
 * Constitutional Compliance: API-First Gate, Progressive Enhancement Gate
 */

import { apiClient } from './apiClient.js';

class ApiService {
  constructor() {
    this.client = apiClient;
  }

  /**
   * Calendar API operations
   */
  async getCalendar(year, month, options = {}) {
    try {
      const params = {
        timezone: 'Europe/Istanbul', // Always use UTC+3 (Turkey timezone)
        duration: options.duration || 60
      };

      const response = await this.client.get(`/calendar/${year}/${month}`, { params });
      
      // Handle both response formats:
      // Format 1: Direct calendar data {year, month, days, ...}
      // Format 2: Wrapped response {success: true, data: {year, month, days, ...}}
      if (response.data.success && response.data.data) {
        return response.data.data; // Extract from wrapped response
      } else {
        return response.data; // Use direct response
      }
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch calendar');
    }
  }

  /**
   * Appointment API operations
   */
  async createAppointment(appointmentData) {
    try {
      const response = await this.client.post('/appointments', appointmentData);
      
      // Check if the response indicates success
      if (response.data.success === false) {
        throw new Error(response.data.error.message || 'Failed to create appointment');
      }
      
      // Extract appointment data from nested response structure
      const extractedData = response.data.data || response.data;
      return extractedData;
    } catch (error) {
      // Handle Axios error responses (400, 500, etc.)
      if (error.response && error.response.data) {
        if (error.response.data.success === false) {
          throw new Error(error.response.data.error.message || 'Failed to create appointment');
        }
        throw new Error(error.response.data.error?.message || error.response.data.message || 'Failed to create appointment');
      }
      
      // Handle other errors (network, etc.)
      throw this.handleApiError(error, 'Failed to create appointment');
    }
  }

  async getAppointment(id) {
    try {
      const response = await this.client.get(`/appointments/${id}`);
      return response.data.data; // Extract the appointment data from the nested data object
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch appointment');
    }
  }

  async updateAppointment(id, updateData) {
    try {
      const response = await this.client.put(`/appointments/${id}`, updateData);
      return response.data; // The appointment data is directly in response.data
    } catch (error) {
      throw this.handleApiError(error, 'Failed to update appointment');
    }
  }

  async cancelAppointment(id) {
    try {
      const response = await this.client.put(`/appointments/${id}/cancel`);
      return response.data; // The appointment is directly in response.data, not response.data.data
    } catch (error) {
      throw this.handleApiError(error, 'Failed to cancel appointment');
    }
  }

  async listAppointments(filters = {}) {
    try {
      const params = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.userEmail) params.userEmail = filters.userEmail;
      if (filters.limit) params.limit = filters.limit;
      if (filters.offset) params.offset = filters.offset;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await this.client.get('/appointments', { params });
      
      // Handle both response formats:
      // Format 1: Direct appointments array response.data = [...]
      // Format 2: Wrapped response {success: true, data: [...], meta: {...}}
      if (response.data.success && response.data.data) {
        return {
          appointments: response.data.data, // Extract from wrapped response
          meta: response.data.meta || response.meta // Meta data from wrapped response
        };
      } else {
        return {
          appointments: response.data, // Use direct response
          meta: response.meta // Meta data from response
        };
      }
    } catch (error) {
      throw this.handleApiError(error, 'Failed to list appointments');
    }
  }

  /**
   * Availability API operations
   */
  async checkAvailability(startTime, endTime, excludeId = null) {
    try {
      const params = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      if (excludeId) {
        params.excludeId = excludeId;
      }

      const response = await this.client.get('/slots/availability', { params });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to check availability');
    }
  }

  /**
   * Statistics API operations
   */
  async getStatistics(startDate = null, endDate = null) {
    try {
      const params = {};
      
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await this.client.get('/stats', { params });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch statistics');
    }
  }

  /**
   * Health check operations
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to check health');
    }
  }

  /**
   * Authentication operations
   */
  async login(credentials) {
    try {
      const response = await this.client.post('/auth/login', credentials);
      
      // Set auth tokens
      if (response.data.token) {
        this.client.setAuthToken(response.data.token, response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to login');
    }
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
      this.client.clearAuth();
      return { success: true };
    } catch (error) {
      // Clear auth even if logout fails
      this.client.clearAuth();
      throw this.handleApiError(error, 'Failed to logout');
    }
  }

  /**
   * Handle API errors and transform them
   */
  handleApiError(error, defaultMessage) {
    if (error.type === 'API_ERROR') {
      return {
        type: 'API_ERROR',
        message: error.message || defaultMessage,
        code: error.code,
        status: error.status,
        details: error.details,
        requestId: error.requestId,
        timestamp: error.timestamp
      };
    } else if (error.type === 'NETWORK_ERROR') {
      return {
        type: 'NETWORK_ERROR',
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
        details: error.details,
        timestamp: error.timestamp
      };
    } else {
      return {
        type: 'CLIENT_ERROR',
        message: error.message || defaultMessage,
        code: 'CLIENT_ERROR',
        details: error.details,
        timestamp: error.timestamp
      };
    }
  }

  /**
   * Validate appointment data
   */
  validateAppointmentData(data) {
    const errors = [];

    if (!data.startTime) {
      errors.push('Start time is required');
    } else if (isNaN(new Date(data.startTime).getTime())) {
      errors.push('Invalid start time format');
    }

    if (!data.endTime) {
      errors.push('End time is required');
    } else if (isNaN(new Date(data.endTime).getTime())) {
      errors.push('Invalid end time format');
    }

    if (!data.userEmail) {
      errors.push('User email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userEmail)) {
      errors.push('Invalid email format');
    }

    if (!data.userName) {
      errors.push('User name is required');
    } else if (data.userName.trim().length < 2) {
      errors.push('User name must be at least 2 characters');
    }

    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      
      if (start >= end) {
        errors.push('End time must be after start time');
      }
      
      const duration = (end - start) / (1000 * 60); // minutes
      if (duration < 15) {
        errors.push('Appointment duration must be at least 15 minutes');
      }
      if (duration > 480) {
        errors.push('Appointment duration must be at most 480 minutes');
      }
    }

    return errors;
  }

  /**
   * Transform appointment data for API
   */
  transformAppointmentForApi(appointment) {
    return {
      startTime: appointment.startTime instanceof Date 
        ? appointment.startTime.toISOString() 
        : appointment.startTime,
      endTime: appointment.endTime instanceof Date 
        ? appointment.endTime.toISOString() 
        : appointment.endTime,
      userEmail: appointment.userEmail?.trim(),
      userName: appointment.userName?.trim(),
      notes: appointment.notes?.trim() || ''
    };
  }

  /**
   * Transform API response to appointment
   */
  transformApiResponseToAppointment(apiResponse) {
    if (!apiResponse) {
      throw new Error('No API response received');
    }
    
    // Handle nested response structure
    const appointment = apiResponse.data || apiResponse;
    
    if (!appointment) {
      throw new Error('No appointment data in API response');
    }
    
    return {
      id: appointment.id,
      startTime: new Date(appointment.startTime),
      endTime: new Date(appointment.endTime),
      userEmail: appointment.userEmail,
      userName: appointment.userName,
      notes: appointment.notes,
      status: appointment.status,
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.updatedAt)
    };
  }

  /**
   * Transform calendar API response
   */
  transformCalendarResponse(apiResponse) {
    
    const transformed = {
      year: apiResponse.year,
      month: apiResponse.month,
      days: apiResponse.days.map(day => {
        // Determine if it's a business day (Monday=1 to Friday=5)
        // Sunday=0, Saturday=6 are not business days
        const isBusinessDay = day.dayOfWeek >= 1 && day.dayOfWeek <= 5;
        
        const transformedDay = {
          date: new Date(day.date), // Convert string to Date object
          dayOfWeek: day.dayOfWeek,
          isBusinessDay: isBusinessDay,
          timeSlots: day.timeSlots?.map(slot => ({
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
            available: slot.isAvailable,
            appointmentId: slot.appointmentId
          })) || [],
          appointments: day.appointments || [],
          availableSlots: day.availableSlots || 0,
          totalSlots: day.totalSlots || 0
        };
        
        return transformedDay;
      })
    };
    
    return transformed;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token, refreshToken = null) {
    this.client.setAuthToken(token, refreshToken);
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    this.client.clearAuth();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.client.authToken;
  }
}

// Create singleton instance
const apiService = new ApiService();

export { ApiService, apiService };
