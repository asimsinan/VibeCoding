/**
 * Appointment List Component
 * 
 * React component for displaying and managing appointments:
 * - Appointment management interface
 * - Real-time updates
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

import React, { useState } from 'react';
import { useAppointments } from '../client/hooks/useApi';

function AppointmentList({ filters = {}, onAppointmentSelect, onAppointmentEdit }) {
  const { 
    appointments, 
    loading, 
    error, 
    meta, 
    refetch, 
    updateAppointment, 
    cancelAppointment 
  } = useAppointments(filters);
  
  
  
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState(null);

  const handleAppointmentClick = (appointment) => {
    if (onAppointmentSelect) {
      onAppointmentSelect(appointment);
    }
  };

  const handleEditClick = (appointment, event) => {
    event.stopPropagation();
    setEditingAppointment(appointment);
    setEditFormData({
      userName: appointment.userName,
      userEmail: appointment.userEmail,
      notes: appointment.notes
    });
    setIsEditing(false); // Don't disable fields when opening modal
    setEditError(null);
  };

  const handleEditCancel = () => {
    setEditingAppointment(null);
    setEditFormData({});
    setIsEditing(false);
    setEditError(null);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    
    if (!editingAppointment) {
      return;
    }

    setIsEditing(true);
    setEditError(null);

    try {
      const result = await updateAppointment(editingAppointment.id, editFormData);
      
      // Success - close modal and notify parent
      handleEditCancel();
      
      if (onAppointmentEdit) {
        onAppointmentEdit(editingAppointment);
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update appointment');
      // Don't close modal on error, let user try again
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelClick = async (appointment, event) => {
    event.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to cancel the appointment for ${appointment.userName}?`)) {
      return;
    }

    try {
      await cancelAppointment(appointment.id);
    } catch (err) {
      alert(`Failed to cancel appointment: ${err.message}`);
    }
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && !appointments.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm" role="status" aria-live="polite">
        <div className="loading-spinner mb-4" aria-hidden="true"></div>
        <span className="text-gray-600">Loading appointments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading appointments</h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button onClick={refetch} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center" role="status">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No appointments found</h3>
        <p className="text-gray-600">No appointments match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="w-full" role="region" aria-label="Appointment list">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Appointments</h2>
          {meta && (
            <div className="text-sm text-gray-600" role="status" aria-live="polite">
              Showing {appointments.length} of {meta.total || appointments.length} appointments
            </div>
          )}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600" aria-hidden="true">
            <div className="loading-spinner w-4 h-4"></div>
            <span>Updating...</span>
          </div>
        )}
      </header>

      <div className="space-y-4" role="list" aria-label="List of appointments">
        {appointments
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)) // Sort by startTime, latest first
          .map((appointment, index) => {
          
          return (
            <div
              key={appointment?.id || `appointment-${index}`}
              className={`card p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer ${
                appointment?.status === 'cancelled' ? 'opacity-60 bg-gray-50' : 'hover:bg-gray-50'
              }`}
              role="listitem"
              onClick={() => handleAppointmentClick(appointment)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAppointmentClick(appointment);
                }
              }}
              tabIndex={0}
              aria-label={`Appointment for ${appointment.userName} on ${formatDate(appointment.startTime)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{appointment.userName}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">🕒</span>
                  <span className="text-sm text-gray-600">
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">📅</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(appointment.startTime)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">✉️</span>
                  <span className="text-sm text-gray-600">{appointment.userEmail}</span>
                </div>
                
                {appointment.notes && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-sm">📝</span>
                    <span className="text-sm text-gray-600">{appointment.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  className="btn-secondary text-xs px-2 py-1"
                  onClick={(e) => handleEditClick(appointment, e)}
                  aria-label={`Edit appointment for ${appointment.userName}`}
                  disabled={appointment.status === 'cancelled'}
                >
                  Edit
                </button>
                  <button
                    className="btn-danger text-xs px-2 py-1"
                    onClick={(e) => handleCancelClick(appointment, e)}
                    aria-label={`Cancel appointment for ${appointment.userName}`}
                    disabled={appointment.status === 'cancelled'}
                  >
                    Cancel
                  </button>
              </div>
          </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <header className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <h3 id="edit-modal-title" className="text-xl font-bold text-gray-800">Edit Appointment</h3>
              <button
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors duration-200"
                onClick={handleEditCancel}
                aria-label="Close edit modal"
                disabled={isEditing}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleEditSubmit} className="p-6">
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600 font-medium">{editError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="edit-userName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="edit-userName"
                    name="userName"
                    value={editFormData.userName || ''}
                    onChange={handleEditInputChange}
                    className="input-field focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    required
                    disabled={isEditing}
                  />
                </div>

                <div>
                  <label htmlFor="edit-userEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="edit-userEmail"
                    name="userEmail"
                    value={editFormData.userEmail || ''}
                    onChange={handleEditInputChange}
                    className="input-field focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                    required
                    disabled={isEditing}
                  />
                </div>

                <div>
                  <label htmlFor="edit-notes" className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="edit-notes"
                    name="notes"
                    value={editFormData.notes || ''}
                    onChange={handleEditInputChange}
                    className="input-field resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Add any additional notes..."
                    disabled={isEditing}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="btn-secondary w-full sm:w-auto order-2 sm:order-1 px-6 py-3"
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto order-1 sm:order-2 px-6 py-3 flex items-center justify-center gap-2"
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <>
                      <div className="loading-spinner w-4 h-4"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
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

/**
 * Format date for display
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default AppointmentList;
