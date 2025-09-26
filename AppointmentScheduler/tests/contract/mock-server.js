#!/usr/bin/env node
/**
 * Mock server for contract testing
 * 
 * This mock server implements the API endpoints defined in the OpenAPI specification
 * to enable contract testing with Dredd. The server returns mock responses that
 * match the API contract schemas.
 * 
 * Maps to TASK-002: Create Contract Tests
 * TDD Phase: Contract (RED phase - tests initially fail)
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data store
const mockData = {
  appointments: [
    {
      id: 'apt_001',
      startTime: '2024-12-15T10:00:00Z',
      endTime: '2024-12-15T11:00:00Z',
      userEmail: 'existing.user@example.com',
      userName: 'Existing User',
      notes: 'Existing appointment',
      status: 'confirmed',
      createdAt: '2024-12-01T08:00:00Z',
      updatedAt: '2024-12-01T08:00:00Z'
    }
  ],
  nextId: 2
};

// Helper functions
function generateAppointmentId() {
  const id = `apt_${String(mockData.nextId++).padStart(3, '0')}`;
  return id;
}

function findAppointmentById(id) {
  return mockData.appointments.find(apt => apt.id === id);
}

function checkTimeSlotConflict(startTime, endTime, excludeId = null) {
  return mockData.appointments.filter(apt => {
    if (excludeId && apt.id === excludeId) return false;
    
    const aptStart = new Date(apt.startTime);
    const aptEnd = new Date(apt.endTime);
    const reqStart = new Date(startTime);
    const reqEnd = new Date(endTime);
    
    // Check for overlap
    return (reqStart < aptEnd && reqEnd > aptStart);
  });
}

function generateTimeSlots(date) {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    // Check if slot is already booked
    const conflict = checkTimeSlotConflict(
      `${date}T${startTime}:00Z`,
      `${date}T${endTime}:00Z`
    );
    
    slots.push({
      startTime,
      endTime,
      isAvailable: conflict.length === 0,
      appointmentId: conflict.length > 0 ? conflict[0].id : null
    });
  }
  return slots;
}

// API Routes

// GET /calendar/{year}/{month}
app.get('/api/v1/calendar/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const timezone = req.query.timezone || 'UTC';
  
  // Validate parameters
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || yearNum < 2024 || yearNum > 2030) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid year parameter',
      code: 'INVALID_YEAR'
    });
  }
  
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid month parameter',
      code: 'INVALID_MONTH'
    });
  }
  
  // Generate calendar data for the month
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const days = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayOfWeek = new Date(yearNum, monthNum - 1, day).getDay();
    const timeSlots = generateTimeSlots(date);
    const isAvailable = timeSlots.some(slot => slot.isAvailable);
    
    days.push({
      date,
      dayOfWeek,
      isAvailable,
      timeSlots
    });
  }
  
  res.json({
    year: yearNum,
    month: monthNum,
    timezone,
    days
  });
});

// POST /appointments
app.post('/api/v1/appointments', (req, res) => {
  const { startTime, endTime, userEmail, userName, notes } = req.body;
  
  // Validate required fields
  if (!startTime || !endTime || !userEmail || !userName) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Missing required fields',
      code: 'MISSING_FIELDS',
      details: {
        required: ['startTime', 'endTime', 'userEmail', 'userName']
      }
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid email format',
      code: 'INVALID_EMAIL'
    });
  }
  
  // Check for time slot conflicts
  const conflicts = checkTimeSlotConflict(startTime, endTime);
  if (conflicts.length > 0) {
    return res.status(409).json({
      error: 'CONFLICT',
      message: 'Time slot is already booked',
      code: 'SLOT_CONFLICT',
      details: {
        conflictingAppointmentId: conflicts[0].id,
        requestedTime: startTime
      }
    });
  }
  
  // Create new appointment
  const newAppointment = {
    id: generateAppointmentId(),
    startTime,
    endTime,
    userEmail,
    userName,
    notes: notes || null,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockData.appointments.push(newAppointment);
  
  res.status(201).json(newAppointment);
});

// GET /appointments/{id}
app.get('/api/v1/appointments/:id', (req, res) => {
  const { id } = req.params;
  
  // Validate ID format
  if (!/^apt_[a-zA-Z0-9]+$/.test(id)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid appointment ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  const appointment = findAppointmentById(id);
  if (!appointment) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Appointment not found',
      code: 'APPOINTMENT_NOT_FOUND'
    });
  }
  
  res.json(appointment);
});

// PUT /appointments/{id}
app.put('/api/v1/appointments/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Validate ID format
  if (!/^apt_[a-zA-Z0-9]+$/.test(id)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid appointment ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  const appointment = findAppointmentById(id);
  if (!appointment) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Appointment not found',
      code: 'APPOINTMENT_NOT_FOUND'
    });
  }
  
  // Check for conflicts if time is being updated
  if (updateData.startTime || updateData.endTime) {
    const startTime = updateData.startTime || appointment.startTime;
    const endTime = updateData.endTime || appointment.endTime;
    
    const conflicts = checkTimeSlotConflict(startTime, endTime, id);
    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'CONFLICT',
        message: 'Time slot is already booked',
        code: 'SLOT_CONFLICT',
        details: {
          conflictingAppointmentId: conflicts[0].id,
          requestedTime: startTime
        }
      });
    }
  }
  
  // Update appointment
  const updatedAppointment = {
    ...appointment,
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  const index = mockData.appointments.findIndex(apt => apt.id === id);
  mockData.appointments[index] = updatedAppointment;
  
  res.json(updatedAppointment);
});

// DELETE /appointments/{id}
app.delete('/api/v1/appointments/:id', (req, res) => {
  const { id } = req.params;
  
  // Validate ID format
  if (!/^apt_[a-zA-Z0-9]+$/.test(id)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid appointment ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  const appointment = findAppointmentById(id);
  if (!appointment) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Appointment not found',
      code: 'APPOINTMENT_NOT_FOUND'
    });
  }
  
  // Remove appointment
  mockData.appointments = mockData.appointments.filter(apt => apt.id !== id);
  
  res.status(204).send();
});

// GET /slots/availability
app.get('/api/v1/slots/availability', (req, res) => {
  const { startTime, endTime, excludeAppointmentId } = req.query;
  
  // Validate required parameters
  if (!startTime || !endTime) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Missing required parameters',
      code: 'MISSING_PARAMETERS',
      details: {
        required: ['startTime', 'endTime']
      }
    });
  }
  
  // Check for conflicts
  const conflicts = checkTimeSlotConflict(startTime, endTime, excludeAppointmentId);
  
  const response = {
    startTime,
    endTime,
    isAvailable: conflicts.length === 0,
    conflictingAppointments: conflicts.map(conflict => ({
      id: conflict.id,
      userEmail: conflict.userEmail,
      userName: conflict.userName
    }))
  };
  
  res.json(response);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    code: 'SERVER_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Mock server running on port ${PORT}`);
    console.log(`📋 API endpoints available at http://localhost:${PORT}/api/v1`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  });
}

module.exports = app;
