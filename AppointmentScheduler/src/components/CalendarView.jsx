/**
 * Calendar View Component
 * 
 * React component for displaying calendar with API integration:
 * - Calendar view with API data
 * - Time slot selection with availability checking
 * - Loading states and error handling
 * - Responsive design for mobile and desktop
 * - Keyboard navigation support
 * - Screen reader accessibility
 * - Progressive enhancement (works without JavaScript)
 * 
 * Maps to TASK-015: UI-API Connection Implementation
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Responsive Design Gate
 */

import React from 'react';
import { useCalendar } from '../client/hooks/useApi';

function CalendarView({ year, month, onTimeSlotSelect, selectedTimeSlot, options = {}, onRefetchReady }) {
  const { calendar, loading, error, refetch } = useCalendar(year, month, options);
  
  // Expose refetch function to parent component
  React.useEffect(() => {
    if (onRefetchReady && refetch) {
      onRefetchReady(refetch);
    }
  }, [onRefetchReady, refetch]);

  if (loading && !calendar) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm" role="status" aria-live="polite">
        <div className="loading-spinner mb-4" aria-hidden="true"></div>
        <span className="text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading calendar</h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button onClick={refetch} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No calendar data available</p>
      </div>
    );
  }


  const handleTimeSlotClick = (timeSlot) => {
    if (timeSlot.available && onTimeSlotSelect) {
      // The timeSlot already contains local times from the transformCalendarResponse
      // Just pass it through to the parent component
      onTimeSlotSelect(timeSlot);
    }
  };

  const handleKeyDown = (event, timeSlot) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTimeSlotClick(timeSlot);
    }
  };


  return (
      <div className="w-full" role="main" aria-label={`Calendar for ${calendar.year}/${calendar.month}`}>
        <header className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Calendar - {calendar.year}/{calendar.month ? calendar.month.toString().padStart(2, '0') : '01'}
        </h2>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600" aria-hidden="true">
            <div className="loading-spinner w-4 h-4"></div>
            <span>Updating...</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4" role="grid" aria-label="Calendar grid">
        {calendar.days.map((day, index) => {
          // day.date is now a Date object, not a number
          const dayDate = day.date instanceof Date ? day.date : new Date(calendar.year, calendar.month - 1, day.date);
          // Use server-provided isPastDate flag
          const isPastDate = day.isPastDate || false;
          
          // Extract day number from the date object
          const dayNumber = dayDate.getDate();
          
          return (
            <div
              key={dayNumber}
              className={`card p-2 sm:p-3 lg:p-4 ${
                day.isBusinessDay 
                  ? isPastDate 
                    ? 'bg-gray-100 border-gray-300 opacity-60' 
                    : 'bg-white border-gray-200 hover:shadow-md transition-shadow'
                  : 'bg-gray-50 border-gray-200'
              }`}
              role="gridcell"
              aria-label={`${dayNumber} - ${day.isBusinessDay ? 'Business day' : 'Non-business day'}${isPastDate ? ' (Past date - not bookable)' : ''}`}
            >
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <span className="text-sm sm:text-lg font-semibold text-gray-800">{dayNumber}</span>
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">{getDayOfWeekName(day.dayOfWeek)}</span>
              </div>
              
              {isPastDate ? (
                <div className="text-center py-2 sm:py-4" role="status" aria-live="polite">
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">Past Date</span>
                  <div className="text-xs text-gray-400 mt-1 hidden sm:block">Not Bookable</div>
                </div>
              ) : day.isBusinessDay ? (
                <div className="space-y-1 sm:space-y-2" role="group" aria-label={`Time slots for ${dayNumber}`}>
                  {day.timeSlots.map((timeSlot, slotIndex) => (
                    <button
                      key={`${dayNumber}-${slotIndex}`}
                      className={`w-full p-1 sm:p-2 rounded text-xs sm:text-sm font-medium transition-all duration-200 ${
                        timeSlot.available 
                          ? selectedTimeSlot && selectedTimeSlot.startTime.getTime() === timeSlot.startTime.getTime()
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={() => handleTimeSlotClick(timeSlot)}
                      onKeyDown={(e) => handleKeyDown(e, timeSlot)}
                      disabled={!timeSlot.available}
                      aria-label={`${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)} ${
                        timeSlot.available ? 'Available' : 'Unavailable'
                      }`}
                      tabIndex={timeSlot.available ? 0 : -1}
                    >
                      <div className="flex justify-between items-center">
                        <span className="truncate">{formatTime(timeSlot.startTime)}</span>
                        <span aria-hidden="true" className="hidden sm:inline">
                          {timeSlot.available ? '✓' : '✗'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 sm:py-4" role="status" aria-live="polite">
                  <span className="text-xs sm:text-sm text-gray-500">Non-Business Day</span>
                </div>
              )}
            </div>
            );
          })}
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg" role="region" aria-label="Calendar legend">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">Legend</h3>
        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded" aria-hidden="true"></span>
            <span className="text-xs sm:text-sm text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 border border-gray-300 rounded" aria-hidden="true"></span>
            <span className="text-xs sm:text-sm text-gray-700">Unavailable</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-3 h-3 sm:w-4 sm:h-4 bg-primary-600 border border-primary-700 rounded" aria-hidden="true"></span>
            <span className="text-xs sm:text-sm text-gray-700">Selected</span>
          </div>
        </div>
      </div>
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
 * Get day of week name
 */
function getDayOfWeekName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}

export default CalendarView;
