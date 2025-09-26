#!/usr/bin/env node
/**
 * Seed Data for Appointments Table
 * 
 * This seed file creates sample appointment data for testing
 * and development purposes.
 * 
 * Maps to TASK-006: Migration Setup
 * TDD Phase: Contract
 * Constitutional Compliance: Integration-First Testing Gate, Security Gate
 */

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('appointments').del()
    .then(() => {
      // Inserts seed entries
      return knex('appointments').insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          start_time: '2024-12-15T10:00:00Z',
          end_time: '2024-12-15T11:00:00Z',
          user_email: 'john.doe@example.com',
          user_name: 'John Doe',
          notes: 'Regular checkup appointment',
          status: 'confirmed',
          created_by: 'system',
          updated_by: 'system'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          start_time: '2024-12-15T14:00:00Z',
          end_time: '2024-12-15T15:00:00Z',
          user_email: 'jane.smith@example.com',
          user_name: 'Jane Smith',
          notes: 'Follow-up appointment',
          status: 'confirmed',
          created_by: 'system',
          updated_by: 'system'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          start_time: '2024-12-16T09:00:00Z',
          end_time: '2024-12-16T10:00:00Z',
          user_email: 'bob.wilson@example.com',
          user_name: 'Bob Wilson',
          notes: 'Initial consultation',
          status: 'confirmed',
          created_by: 'system',
          updated_by: 'system'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          start_time: '2024-12-16T11:00:00Z',
          end_time: '2024-12-16T12:00:00Z',
          user_email: 'alice.brown@example.com',
          user_name: 'Alice Brown',
          notes: 'Cancelled appointment',
          status: 'cancelled',
          created_by: 'system',
          updated_by: 'system'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          start_time: '2024-12-17T13:00:00Z',
          end_time: '2024-12-17T14:00:00Z',
          user_email: 'charlie.davis@example.com',
          user_name: 'Charlie Davis',
          notes: 'Rescheduled appointment',
          status: 'rescheduled',
          created_by: 'system',
          updated_by: 'system'
        }
      ]);
    });
};
