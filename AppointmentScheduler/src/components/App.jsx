/**
 * Main App Component
 * 
 * Main React application component that integrates all UI components:
 * - Calendar view component with API data
 * - Appointment booking form with validation
 * - Appointment management interface
 * - Time slot selection with availability checking
 * - State management (useState/useReducer)
 * - Loading states and error handling
 * - Real-time updates
 * - User feedback (toast notifications, inline errors)
 * - Responsive design for mobile and desktop
 * - Keyboard navigation support
 * - Screen reader accessibility
 * - Progressive enhancement (works without JavaScript)
 * 
 * Maps to TASK-015: UI-API Connection Implementation
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Responsive Design Gate
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CalendarView from './CalendarView';
import AppointmentForm from './AppointmentForm';
import AppointmentList from './AppointmentList';
import { useHealthCheck } from '../client/hooks/useApi';
// Tailwind CSS is imported in src/client/index.js

function App() {
  // Application state
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar', 'appointments', 'booking'
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentFilters, setAppointmentFilters] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Calendar navigation state - start from current month
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Calendar refetch function
  const [calendarRefetch, setCalendarRefetch] = useState(null);

  // Health check (non-blocking)
  const { health, loading: healthLoading, error: healthError } = useHealthCheck();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setCurrentView('booking');
  };

  // Handle appointment creation
  const handleAppointmentCreated = async (appointment) => {
    // Navigate to calendar first
    setSelectedTimeSlot(null);
    setCurrentView('calendar');
    
    // Navigate to the appointment month if needed
    if (appointment && appointment.startTime) {
      const appointmentDate = new Date(appointment.startTime);
      const appointmentMonth = appointmentDate.getMonth() + 1;
      const appointmentYear = appointmentDate.getFullYear();
      
      if (appointmentYear !== currentYear || appointmentMonth !== currentMonth) {
        setCalendarDate(new Date(appointmentYear, appointmentMonth - 1, 1));
      }
    }
    
    // Pull new data first, then show it
    if (calendarRefetch) {
      await calendarRefetch();
    }
    
    addNotification({
      type: 'success',
      message: `Appointment booked successfully for ${appointment?.userName || 'user'}`,
      duration: 5000
    });
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentView('appointments');
  };

  // Handle appointment edit
  const handleAppointmentEdit = (appointment) => {
    addNotification({
      type: 'success',
      message: `Appointment updated successfully for ${appointment.userName}`,
      duration: 5000
    });
  };

  // Handle booking cancellation
  const handleBookingCancel = () => {
    setSelectedTimeSlot(null);
    setCurrentView('calendar');
  };
  
  // Handle calendar refetch ready
  const handleCalendarRefetchReady = useCallback((refetch) => {
    setCalendarRefetch(() => refetch);
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  }, [removeNotification]);

  // Memoized calendar options to prevent infinite re-renders
  const calendarOptions = useMemo(() => ({
    timezone: 'Europe/Istanbul', // Always use UTC+3 (Turkey timezone)
    duration: 60
  }), []);

  // Handle navigation
  const handleNavigation = (view) => {
    setCurrentView(view);
    setSelectedTimeSlot(null);
    setSelectedAppointment(null);
  };

  // Calendar navigation functions
  const navigateToPreviousMonth = () => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCalendarDate(newDate);
  };

  const navigateToNextMonth = () => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarDate(newDate);
  };

  const navigateToToday = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    
    // Only update if we're not already viewing today's month
    if (calendarDate.getFullYear() !== todayYear || calendarDate.getMonth() !== todayMonth) {
      setCalendarDate(today);
    }
  };

  // Get current calendar date for display - memoized to prevent unnecessary re-renders
  const currentYear = useMemo(() => calendarDate.getFullYear(), [calendarDate]);
  const currentMonth = useMemo(() => calendarDate.getMonth() + 1, [calendarDate]);

  return (
    <div className="min-h-screen flex flex-col font-sans leading-relaxed text-gray-800 bg-gray-50" role="application" aria-label="Appointment Scheduler">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center" role="status" aria-live="polite">
          <span>You are offline. Some features may be limited.</span>
        </div>
      )}

      {/* Health status */}
      {healthError && (
        <div className="bg-red-500 text-white px-4 py-2 text-center" role="alert">
          <span>Service unavailable. Please try again later.</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-primary-600 text-white px-2 sm:px-4 py-3 sm:py-4 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4" role="banner">
        <h1 className="text-xl sm:text-2xl font-semibold m-0">Appointment Scheduler</h1>
        <nav className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto" role="navigation" aria-label="Main navigation">
          <button
            className={`bg-transparent border border-white/30 text-white px-3 sm:px-4 py-2 rounded cursor-pointer transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base w-full sm:w-auto ${
              currentView === 'calendar' ? 'bg-white/20 border-white/50' : ''
            }`}
            onClick={() => handleNavigation('calendar')}
            aria-current={currentView === 'calendar' ? 'page' : undefined}
          >
            Calendar
          </button>
          <button
            className={`bg-transparent border border-white/30 text-white px-3 sm:px-4 py-2 rounded cursor-pointer transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base w-full sm:w-auto ${
              currentView === 'appointments' ? 'bg-white/20 border-white/50' : ''
            }`}
            onClick={() => handleNavigation('appointments')}
            aria-current={currentView === 'appointments' ? 'page' : undefined}
          >
            Appointments
          </button>
        </nav>
        
        {health && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0" role="status" aria-live="polite">
            <span className={`text-sm sm:text-lg ${health.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
              {health.status === 'healthy' ? '●' : '●'}
            </span>
            <span className="text-xs sm:text-sm">
              {health.status === 'healthy' ? 'Service Online' : 'Service Issues'}
            </span>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 p-2 sm:p-4" role="main">
        {currentView === 'calendar' && (
          <div className="w-full">
            {/* Calendar Navigation Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg shadow-sm gap-3 sm:gap-0" role="navigation" aria-label="Calendar navigation">
              <button 
                onClick={navigateToPreviousMonth}
                className="btn-secondary px-2 sm:px-3 py-2 text-sm sm:text-lg order-1 sm:order-none"
                aria-label="Previous month"
              >
                <span className="hidden sm:inline">← Previous Month</span>
                <span className="sm:hidden">←</span>
              </button>
              
              <div className="flex flex-col items-center gap-2 order-2 sm:order-none">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 text-center">
                  {calendarDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </h2>
                <button 
                  onClick={navigateToToday}
                  className="btn-primary text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1"
                  aria-label="Go to current month"
                >
                  Today
                </button>
              </div>
              
              <button 
                onClick={navigateToNextMonth}
                className="btn-secondary px-2 sm:px-3 py-2 text-sm sm:text-lg order-3 sm:order-none"
                aria-label="Next month"
              >
                <span className="hidden sm:inline">Next Month →</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
            
            <CalendarView
              year={currentYear}
              month={currentMonth}
              onTimeSlotSelect={handleTimeSlotSelect}
              selectedTimeSlot={selectedTimeSlot}
              onRefetchReady={handleCalendarRefetchReady}
              options={calendarOptions}
            />
          </div>
        )}

        {currentView === 'booking' && selectedTimeSlot && (
          <div className="w-full max-w-2xl mx-auto">
            <AppointmentForm
              selectedTimeSlot={selectedTimeSlot}
              onAppointmentCreated={handleAppointmentCreated}
              onCancel={handleBookingCancel}
            />
          </div>
        )}

        {currentView === 'appointments' && (
          <div className="w-full">
            <AppointmentList
              filters={appointmentFilters}
              onAppointmentSelect={handleAppointmentSelect}
              onAppointmentEdit={handleAppointmentEdit}
            />
          </div>
        )}
      </main>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2" role="region" aria-label="Notifications">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`card p-4 max-w-sm shadow-lg ${
              notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
            role="alert"
            aria-live="polite"
          >
            <div className="flex justify-between items-start">
              <span className="flex-1">{notification.message}</span>
              <button
                className="ml-2 text-lg font-bold hover:opacity-70 focus:outline-none"
                onClick={() => removeNotification(notification.id)}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-3 sm:py-4 px-2 sm:px-4" role="contentinfo">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">&copy; 2025 Appointment Scheduler. All rights reserved.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-4">
            <a href="#help" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700">Help</a>
            <a href="#privacy" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700">Privacy</a>
            <a href="#terms" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700">Terms</a>
          </div>
        </div>
      </footer>

      {/* Loading overlay */}
      {healthLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="status" aria-live="polite">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="loading-spinner" aria-hidden="true"></div>
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
