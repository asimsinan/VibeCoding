/**
 * React Hooks for API Data Fetching
 * 
 * Custom hooks for API data fetching with state management:
 * - useApi hook for general API calls
 * - useCalendar hook for calendar data
 * - useAppointments hook for appointment data
 * - useAvailability hook for availability checking
 * - Error handling and loading states
 * - Caching and optimization
 * 
 * Maps to TASK-014: API Client Setup
 * TDD Phase: Contract
 * Constitutional Compliance: API-First Gate, Progressive Enhancement Gate
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../apiService';

/**
 * Generic API hook
 */
function useApi(apiCall, dependencies = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const result = await apiCall(...args);
      
      if (!mountedRef.current) return;
      
      setData(result.data || result);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      setError(err);
      setData(null);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-execute if dependencies change
  useEffect(() => {
    if (options.autoExecute !== false) {
      execute();
    }
  }, [execute, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute
  };
}

/**
 * Calendar hook
 */
function useCalendar(year, month, options = {}) {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchCalendarRef = useRef(null);

  const fetchCalendar = useCallback(async (isRefetch = false) => {
    if (!year || !month) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getCalendar(year, month, { ...options, refetch: isRefetch });
      
      const transformedData = apiService.transformCalendarResponse(result);
      setCalendarData(transformedData);
    } catch (err) {
      setError(err);
      setCalendarData(null);
    } finally {
      setLoading(false);
    }
  }, [year, month, options]);

  // Store the latest fetchCalendar function in a ref
  fetchCalendarRef.current = fetchCalendar;

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // Create a stable refetch function that doesn't change
  const refetch = useCallback(async () => {
    if (fetchCalendarRef.current) {
      await fetchCalendarRef.current(true);
    }
  }, []);

  return {
    calendar: calendarData,
    loading,
    error,
    refetch
  };
}

/**
 * Appointments hook
 */
function useAppointments(filters = {}) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  
  // Set default limit to show all appointments (or a reasonable high number)
  const defaultFilters = {
    limit: 100, // Show up to 100 appointments by default
    offset: 0,
    ...filters
  };

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.listAppointments(defaultFilters);
      
      const transformedAppointments = result.appointments.map(appointment => 
        apiService.transformApiResponseToAppointment(appointment)
      );
      
      setAppointments(transformedAppointments);
      setMeta(result.meta);
    } catch (err) {
      setError(err);
      setAppointments([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [defaultFilters.status, defaultFilters.userEmail, defaultFilters.limit, defaultFilters.offset]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = useCallback(async (appointmentData) => {
    try {
      const errors = apiService.validateAppointmentData(appointmentData);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const transformedData = apiService.transformAppointmentForApi(appointmentData);
      const result = await apiService.createAppointment(transformedData);
      
      const newAppointment = apiService.transformApiResponseToAppointment(result);
      setAppointments(prev => [newAppointment, ...prev]);
      
      return newAppointment;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const updateAppointment = useCallback(async (id, updateData) => {
    try {
      const result = await apiService.updateAppointment(id, updateData);
      
      const updatedAppointment = apiService.transformApiResponseToAppointment(result);
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? updatedAppointment : appointment
        )
      );
      
      return updatedAppointment;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const cancelAppointment = useCallback(async (id) => {
    try {
      const result = await apiService.cancelAppointment(id);
      
      // Update the appointment status in the local state
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id 
            ? { ...appointment, status: 'cancelled' }
            : appointment
        )
      );
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const deleteAppointment = useCallback(async (id) => {
    try {
      await apiService.deleteAppointment(id);
      
      setAppointments(prev => 
        prev.filter(appointment => appointment.id !== id)
      );
      
      return true;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  return {
    appointments,
    loading,
    error,
    meta,
    refetch: fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment
  };
}

/**
 * Availability hook
 */
function useAvailability(startTime, endTime, excludeId = null) {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkAvailability = useCallback(async () => {
    if (!startTime || !endTime) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.checkAvailability(startTime, endTime, excludeId);
      setAvailability(result);
    } catch (err) {
      setError(err);
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime, excludeId]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    availability,
    loading,
    error,
    refetch: checkAvailability
  };
}

/**
 * Statistics hook
 */
function useStatistics(startDate = null, endDate = null) {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getStatistics(startDate, endDate);
      setStatistics(result);
    } catch (err) {
      setError(err);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
}

/**
 * Health check hook
 */
function useHealthCheck() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.checkHealth();
      setHealth(result);
    } catch (err) {
      setError(err);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Delay initial health check to not block app initialization
    const timeoutId = setTimeout(() => {
      checkHealth();
    }, 1000);
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [checkHealth]);

  return {
    health,
    loading,
    error,
    refetch: checkHealth
  };
}

/**
 * Authentication hook
 */
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.login(credentials);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await apiService.logout();
      setUser(null);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = useCallback(() => {
    return apiService.isAuthenticated();
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated
  };
}

export {
  useApi,
  useCalendar,
  useAppointments,
  useAvailability,
  useStatistics,
  useHealthCheck,
  useAuth
};
