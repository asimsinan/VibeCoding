/**
 * Appointment Form Component
 * 
 * React component for appointment booking with API integration:
 * - Appointment booking form with validation
 * - Loading states and error handling
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

import React, { useState, useEffect } from 'react';
import { useAppointments } from '../client/hooks/useApi';

function AppointmentForm({ selectedTimeSlot, onAppointmentCreated, onCancel }) {
  const { createAppointment, loading, error, refetch, appointments } = useAppointments();
  
  const [formData, setFormData] = useState({
    userEmail: '',
    userName: '',
    notes: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Update form data when selected time slot changes
  useEffect(() => {
    if (selectedTimeSlot) {
      setFormData(prev => ({
        ...prev,
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime
      }));
    }
  }, [selectedTimeSlot]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.userEmail.trim()) {
      errors.userEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      errors.userEmail = 'Please enter a valid email address';
    }

    if (!formData.userName.trim()) {
      errors.userName = 'Name is required';
    } else if (formData.userName.trim().length < 2) {
      errors.userName = 'Name must be at least 2 characters';
    }

    if (!selectedTimeSlot) {
      errors.timeSlot = 'Please select a time slot';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // The selectedTimeSlot contains UTC+3 times from the server
      // We send them as-is to the server since they're already in UTC+3
      const appointmentData = {
        startTime: selectedTimeSlot.startTime.toISOString(), // Convert Date to ISO string
        endTime: selectedTimeSlot.endTime.toISOString(), // Convert Date to ISO string
        userEmail: formData.userEmail.trim(),
        userName: formData.userName.trim(),
        notes: formData.notes.trim()
      };

      // Client-side conflict detection
      await refetch(); // Refresh appointments list
      
      // Check if any existing appointment overlaps with the new time slot
      const conflictingAppointments = appointments.filter(appointment => {
        const existingStart = new Date(appointment.startTime);
        const existingEnd = new Date(appointment.endTime);
        const newStart = new Date(appointmentData.startTime);
        const newEnd = new Date(appointmentData.endTime);
        
        // Check for overlap
        return (newStart < existingEnd && newEnd > existingStart);
      });
      
      if (conflictingAppointments.length > 0) {
        setSubmitError('This time slot is already booked. Please select a different time.');
        return;
      }

      const newAppointment = await createAppointment(appointmentData);
      
      // Reset form
      setFormData({
        userEmail: '',
        userName: '',
        notes: ''
      });
      
      // Notify parent component
      if (onAppointmentCreated) {
        onAppointmentCreated(newAppointment);
      }
      
    } catch (err) {
      setSubmitError(err.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (!selectedTimeSlot) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center" role="status">
        <p className="text-gray-600">Please select a time slot to book an appointment</p>
      </div>
    );
  }
  return (
    <form 
      className="card p-4 sm:p-6 max-w-2xl mx-auto" 
      onSubmit={handleSubmit}
      role="form"
      aria-label="Appointment booking form"
    >
      <header className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">Book Appointment</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4" role="status" aria-live="polite">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-blue-800">Selected Time:</span>
            <span className="text-base sm:text-lg font-semibold text-blue-900">
              {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
            </span>
          </div>
        </div>
      </header>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6" role="alert">
          <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-sm sm:text-base text-red-600">{submitError}</p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="userEmail"
            name="userEmail"
            value={formData.userEmail}
            onChange={handleInputChange}
            className={`input-field ${validationErrors.userEmail ? 'border-red-500 focus:ring-red-500' : ''}`}
            aria-describedby={validationErrors.userEmail ? 'userEmail-error' : undefined}
            aria-invalid={!!validationErrors.userEmail}
            required
            autoComplete="email"
          />
          {validationErrors.userEmail && (
            <div id="userEmail-error" className="mt-1 text-sm text-red-600" role="alert">
              {validationErrors.userEmail}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="userName"
            name="userName"
            value={formData.userName}
            onChange={handleInputChange}
            className={`input-field ${validationErrors.userName ? 'border-red-500 focus:ring-red-500' : ''}`}
            aria-describedby={validationErrors.userName ? 'userName-error' : undefined}
            aria-invalid={!!validationErrors.userName}
            required
            autoComplete="name"
          />
          {validationErrors.userName && (
            <div id="userName-error" className="mt-1 text-sm text-red-600" role="alert">
              {validationErrors.userName}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="input-field resize-none"
            rows="3"
            placeholder="Any additional notes or requirements..."
            aria-describedby="notes-help"
          />
          <div id="notes-help" className="mt-1 text-xs text-gray-500">
            Optional: Add any special requirements or notes for your appointment
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-6 sm:mt-8">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-secondary w-full sm:w-auto order-2 sm:order-1"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary w-full sm:w-auto order-1 sm:order-2"
          disabled={isSubmitting || !selectedTimeSlot}
          aria-describedby={isSubmitting ? 'submitting-status' : undefined}
        >
          {isSubmitting ? 'Booking...' : 'Book Appointment'}
        </button>
        {isSubmitting && (
          <div id="submitting-status" className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 order-3 w-full sm:w-auto" aria-live="polite">
            <div className="loading-spinner w-3 h-3 sm:w-4 sm:h-4"></div>
            <span>Creating appointment...</span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg" role="region" aria-label="Form help">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Booking Information</h3>
        <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>All fields marked with * are required</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>You will receive a confirmation email after booking</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>You can cancel or reschedule your appointment up to 24 hours in advance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Please arrive 5 minutes before your scheduled time</span>
          </li>
        </ul>
      </div>
    </form>
  );
}

/**
 * Format time for display
 */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default AppointmentForm;
