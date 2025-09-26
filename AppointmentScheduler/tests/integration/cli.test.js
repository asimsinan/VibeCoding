#!/usr/bin/env node
/**
 * CLI Integration Tests
 * 
 * Integration tests for the CLI interface:
 * - Command execution and output validation
 * - JSON mode functionality
 * - Error handling and user feedback
 * - Performance and usability tests
 * 
 * Maps to TASK-011: Library Integration Tests
 * TDD Phase: Integration
 * Constitutional Compliance: CLI Interface Gate, Integration-First Testing Gate
 */

const { spawn } = require('child_process');
const path = require('path');

describe('CLI Integration Tests', () => {
  const cliPath = path.join(__dirname, '../../src/cli/index.js');
  
  // Helper function to run CLI commands
  const runCLI = (args = [], options = {}) => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  };

  describe('CLI Help and Version', () => {
    test('should display help information', async () => {
      const result = await runCLI(['--help']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('appointment-core');
      expect(result.stdout).toContain('Appointment scheduling and management CLI');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('calendar');
      expect(result.stdout).toContain('book');
      expect(result.stdout).toContain('list');
    });

    test('should display version information', async () => {
      const result = await runCLI(['--version']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    });
  });

  describe('Health Command', () => {
    test('should check system health', async () => {
      const result = await runCLI(['health']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('System Health');
      expect(result.stdout).toContain('Status:');
    });

    test('should output health in JSON format', async () => {
      const result = await runCLI(['health', '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('healthy');
      expect(output).toHaveProperty('database');
      expect(output).toHaveProperty('services');
    });
  });

  describe('Calendar Command', () => {
    test('should generate calendar for valid month', async () => {
      const result = await runCLI(['calendar', '2025', '1']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Calendar: January 2025');
      expect(result.stdout).toContain('Timezone: UTC');
      expect(result.stdout).toContain('Business Hours:');
    });

    test('should generate calendar in JSON format', async () => {
      const result = await runCLI(['calendar', '2025', '1', '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('year', 2025);
      expect(output).toHaveProperty('month', 1);
      expect(output).toHaveProperty('monthName', 'January');
      expect(output).toHaveProperty('timezone', 'UTC');
      expect(output).toHaveProperty('days');
      expect(output).toHaveProperty('stats');
    });

    test('should handle invalid month', async () => {
      const result = await runCLI(['calendar', '2025', '13']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });

    test('should handle invalid year', async () => {
      const result = await runCLI(['calendar', '1999', '1']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });

    test('should support timezone option', async () => {
      const result = await runCLI(['calendar', '2025', '1', '--timezone', 'America/New_York']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Timezone: America/New_York');
    });

    test('should support duration option', async () => {
      const result = await runCLI(['calendar', '2025', '1', '--duration', '30']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Calendar: January 2025');
    });
  });

  describe('Book Command', () => {
    test('should book appointment with valid data', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const result = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointment booked successfully');
      expect(result.stdout).toContain('Appointment Details');
    });

    test('should book appointment in JSON format', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const result = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User', '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('id');
      expect(output).toHaveProperty('startTime');
      expect(output).toHaveProperty('endTime');
      expect(output).toHaveProperty('userEmail', 'test@example.com');
      expect(output).toHaveProperty('userName', 'Test User');
      expect(output).toHaveProperty('status');
    });

    test('should handle invalid time format', async () => {
      const result = await runCLI(['book', 'invalid-time', 'invalid-time', 'test@example.com', 'Test User']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });

    test('should handle invalid email', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const result = await runCLI(['book', startTime, endTime, 'invalid-email', 'Test User']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });

    test('should support notes option', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const result = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User', '--notes', 'Test appointment']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointment booked successfully');
    });
  });

  describe('List Command', () => {
    test('should list appointments', async () => {
      const result = await runCLI(['list']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointments');
    });

    test('should list appointments in JSON format', async () => {
      const result = await runCLI(['list', '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(Array.isArray(output)).toBe(true);
    });

    test('should filter by status', async () => {
      const result = await runCLI(['list', '--status', 'confirmed']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointments');
    });

    test('should filter by email', async () => {
      const result = await runCLI(['list', '--email', 'test@example.com']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointments');
    });

    test('should limit results', async () => {
      const result = await runCLI(['list', '--limit', '5']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointments');
    });
  });

  describe('Get Command', () => {
    test('should get appointment by ID', async () => {
      // First create an appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const bookResult = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User', '--json']);
      const appointment = JSON.parse(bookResult.stdout);
      
      // Then get the appointment
      const result = await runCLI(['get', appointment.id]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointment Details');
      expect(result.stdout).toContain(appointment.id);
    });

    test('should get appointment in JSON format', async () => {
      // First create an appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const bookResult = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User', '--json']);
      const appointment = JSON.parse(bookResult.stdout);
      
      // Then get the appointment
      const result = await runCLI(['get', appointment.id, '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('id', appointment.id);
      expect(output).toHaveProperty('startTime');
      expect(output).toHaveProperty('endTime');
      expect(output).toHaveProperty('userEmail');
      expect(output).toHaveProperty('userName');
    });

    test('should handle non-existent appointment', async () => {
      const result = await runCLI(['get', 'non-existent-id']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });
  });

  describe('Update Command', () => {
    test('should update appointment', async () => {
      // First create an appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const bookResult = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User', '--json']);
      const appointment = JSON.parse(bookResult.stdout);
      
      // Then update the appointment
      const result = await runCLI(['update', appointment.id, '--status', 'confirmed']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointment updated successfully');
    });

    test('should update appointment in JSON format', async () => {
      // First create an appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const bookResult = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User', '--json']);
      const appointment = JSON.parse(bookResult.stdout);
      
      // Then update the appointment
      const result = await runCLI(['update', appointment.id, '--status', 'confirmed', '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('id', appointment.id);
      expect(output).toHaveProperty('status', 'confirmed');
    });
  });

  describe('Cancel Command', () => {
    test('should cancel appointment', async () => {
      // First create an appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const bookResult = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User', '--json']);
      const appointment = JSON.parse(bookResult.stdout);
      
      // Then cancel the appointment
      const result = await runCLI(['cancel', appointment.id]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointment cancelled successfully');
    });

    test('should cancel appointment in JSON format', async () => {
      // First create an appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const bookResult = await runCLI(['book', startTime, endTime, 'test@example.com', 'Test User', '--json']);
      const appointment = JSON.parse(bookResult.stdout);
      
      // Then cancel the appointment
      const result = await runCLI(['cancel', appointment.id, '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('id', appointment.id);
      expect(output).toHaveProperty('status', 'cancelled');
    });
  });

  describe('Availability Command', () => {
    test('should check availability', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const result = await runCLI(['availability', startTime, endTime]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Availability Check');
      expect(result.stdout).toContain('Available:');
    });

    test('should check availability in JSON format', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(10, 0, 0, 0);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      const result = await runCLI(['availability', startTime, endTime, '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('isAvailable');
      expect(output).toHaveProperty('conflictingAppointments');
      expect(output).toHaveProperty('availableSlots');
    });

    test('should handle invalid time range', async () => {
      const result = await runCLI(['availability', 'invalid-time', 'invalid-time']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });
  });

  describe('Stats Command', () => {
    test('should get appointment statistics', async () => {
      const result = await runCLI(['stats']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointment Statistics');
    });

    test('should get statistics in JSON format', async () => {
      const result = await runCLI(['stats', '--json']);
      
      expect(result.code).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('totalAppointments');
      expect(output).toHaveProperty('confirmedAppointments');
      expect(output).toHaveProperty('pendingAppointments');
      expect(output).toHaveProperty('cancelledAppointments');
    });

    test('should filter statistics by date range', async () => {
      const result = await runCLI(['stats', '--start-date', '2025-01-01', '--end-date', '2025-01-31']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Appointment Statistics');
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown command', async () => {
      const result = await runCLI(['unknown-command']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });

    test('should handle missing required arguments', async () => {
      const result = await runCLI(['book']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });

    test('should handle invalid options', async () => {
      const result = await runCLI(['calendar', '2025', '1', '--invalid-option']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error:');
    });
  });

  describe('Performance Tests', () => {
    test('should execute commands within reasonable time', async () => {
      const start = Date.now();
      const result = await runCLI(['health']);
      const duration = Date.now() - start;
      
      expect(result.code).toBe(0);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle multiple commands efficiently', async () => {
      const commands = [
        ['health'],
        ['calendar', '2025', '1'],
        ['stats']
      ];
      
      const start = Date.now();
      
      for (const command of commands) {
        const result = await runCLI(command);
        expect(result.code).toBe(0);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000); // Should complete all commands within 10 seconds
    });
  });
});
