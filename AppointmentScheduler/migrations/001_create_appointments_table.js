#!/usr/bin/env node
/**
 * Initial Migration: Create Appointments Table
 * 
 * This migration creates the appointments table with all necessary
 * constraints, indexes, and triggers for conflict prevention.
 * 
 * Maps to TASK-006: Migration Setup
 * TDD Phase: Contract
 * Constitutional Compliance: Integration-First Testing Gate, Security Gate
 */

exports.up = function(knex) {
  return knex.schema.createTable('appointments', function(table) {
    // Primary key using UUID
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Appointment timing with timezone support
    table.timestamp('start_time', { useTz: true }).notNullable();
    table.timestamp('end_time', { useTz: true }).notNullable();
    
    // User information
    table.string('user_email', 255).notNullable();
    table.string('user_name', 255).notNullable();
    
    // Optional notes
    table.text('notes');
    
    // Appointment status
    table.string('status', 50).notNullable().defaultTo('confirmed');
    
    // Audit fields
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.string('created_by', 255);
    table.string('updated_by', 255);
    
    // Add constraints
    table.check('end_time > start_time', [], 'valid_time_range');
    table.check("status IN ('confirmed', 'cancelled', 'rescheduled')", [], 'valid_status');
    table.check("user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'", [], 'valid_email');
    table.check('LENGTH(user_name) >= 1 AND LENGTH(user_name) <= 100', [], 'valid_user_name');
    table.check('notes IS NULL OR LENGTH(notes) <= 500', [], 'valid_notes');
  })
  .then(() => {
    // Create indexes for performance
    return Promise.all([
      knex.schema.raw('CREATE INDEX idx_appointments_start_time ON appointments(start_time)'),
      knex.schema.raw('CREATE INDEX idx_appointments_end_time ON appointments(end_time)'),
      knex.schema.raw('CREATE INDEX idx_appointments_time_range ON appointments(start_time, end_time)'),
      knex.schema.raw('CREATE INDEX idx_appointments_user_email ON appointments(user_email)'),
      knex.schema.raw('CREATE INDEX idx_appointments_status ON appointments(status)'),
      knex.schema.raw('CREATE INDEX idx_appointments_user_status ON appointments(user_email, status)'),
      knex.schema.raw('CREATE INDEX idx_appointments_created_at ON appointments(created_at)'),
      knex.schema.raw('CREATE INDEX idx_appointments_updated_at ON appointments(updated_at)')
    ]);
  })
  .then(() => {
    // Create unique constraint to prevent double-booking
    return knex.schema.raw(`
      CREATE UNIQUE INDEX idx_appointments_no_conflict 
      ON appointments(start_time, end_time) 
      WHERE status = 'confirmed'
    `);
  })
  .then(() => {
    // Create partial index for active appointments
    return knex.schema.raw(`
      CREATE INDEX idx_appointments_active 
      ON appointments(start_time, end_time, user_email) 
      WHERE status = 'confirmed'
    `);
  })
  .then(() => {
    // Create function to update updated_at timestamp
    return knex.schema.raw(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
  })
  .then(() => {
    // Create trigger to automatically update updated_at
    return knex.schema.raw(`
      CREATE TRIGGER update_appointments_updated_at 
      BEFORE UPDATE ON appointments 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  })
  .then(() => {
    // Create function to validate appointment conflicts
    return knex.schema.raw(`
      CREATE OR REPLACE FUNCTION validate_appointment_conflict()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Check for overlapping appointments with confirmed status
          IF EXISTS (
              SELECT 1 FROM appointments 
              WHERE id != NEW.id 
              AND status = 'confirmed'
              AND (
                  (NEW.start_time < end_time AND NEW.end_time > start_time)
              )
          ) THEN
              RAISE EXCEPTION 'Appointment conflicts with existing confirmed appointment';
          END IF;
          
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
  })
  .then(() => {
    // Create trigger to validate conflicts
    return knex.schema.raw(`
      CREATE TRIGGER validate_appointment_conflict_trigger
      BEFORE INSERT OR UPDATE ON appointments
      FOR EACH ROW EXECUTE FUNCTION validate_appointment_conflict()
    `);
  })
  .then(() => {
    // Create function to check slot availability
    return knex.schema.raw(`
      CREATE OR REPLACE FUNCTION check_slot_availability(
          p_start_time TIMESTAMPTZ,
          p_end_time TIMESTAMPTZ,
          p_exclude_appointment_id UUID DEFAULT NULL
      )
      RETURNS TABLE(
          is_available BOOLEAN,
          conflicting_appointments JSONB
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              NOT EXISTS (
                  SELECT 1 FROM appointments 
                  WHERE status = 'confirmed'
                  AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
                  AND (p_start_time < end_time AND p_end_time > start_time)
              ) as is_available,
              COALESCE(
                  jsonb_agg(
                      jsonb_build_object(
                          'id', id,
                          'userEmail', user_email,
                          'userName', user_name,
                          'startTime', start_time,
                          'endTime', end_time
                      )
                  ) FILTER (WHERE id IS NOT NULL),
                  '[]'::jsonb
              ) as conflicting_appointments
          FROM appointments 
          WHERE status = 'confirmed'
          AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
          AND (p_start_time < end_time AND p_end_time > start_time);
      END;
      $$ language 'plpgsql'
    `);
  })
  .then(() => {
    // Create function to get calendar data
    return knex.schema.raw(`
      CREATE OR REPLACE FUNCTION get_calendar_data(
          p_year INTEGER,
          p_month INTEGER,
          p_timezone TEXT DEFAULT 'UTC'
      )
      RETURNS TABLE(
          date DATE,
          day_of_week INTEGER,
          is_available BOOLEAN,
          time_slots JSONB
      ) AS $$
      DECLARE
          start_date DATE;
          end_date DATE;
          current_date DATE;
      BEGIN
          -- Calculate start and end dates for the month
          start_date := DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01');
          end_date := (start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
          
          -- Generate calendar data for each day in the month
          FOR current_date IN SELECT generate_series(start_date, end_date, INTERVAL '1 day')::DATE
          LOOP
              RETURN QUERY
              SELECT 
                  current_date as date,
                  EXTRACT(DOW FROM current_date)::INTEGER as day_of_week,
                  EXISTS (
                      SELECT 1 FROM appointments 
                      WHERE DATE(start_time AT TIME ZONE p_timezone) = current_date
                      AND status = 'confirmed'
                  ) as is_available,
                  COALESCE(
                      jsonb_agg(
                          jsonb_build_object(
                              'startTime', TO_CHAR(time_slot, 'HH24:MI'),
                              'endTime', TO_CHAR(time_slot + INTERVAL '1 hour', 'HH24:MI'),
                              'isAvailable', NOT EXISTS (
                                  SELECT 1 FROM appointments 
                                  WHERE status = 'confirmed'
                                  AND DATE(start_time AT TIME ZONE p_timezone) = current_date
                                  AND time_slot::TIME >= start_time::TIME
                                  AND time_slot::TIME < end_time::TIME
                              ),
                              'appointmentId', (
                                  SELECT id FROM appointments 
                                  WHERE status = 'confirmed'
                                  AND DATE(start_time AT TIME ZONE p_timezone) = current_date
                                  AND time_slot::TIME >= start_time::TIME
                                  AND time_slot::TIME < end_time::TIME
                                  LIMIT 1
                              )
                          )
                      ) FILTER (WHERE time_slot IS NOT NULL),
                      '[]'::jsonb
                  ) as time_slots
              FROM (
                  SELECT generate_series(
                      current_date + TIME '09:00',
                      current_date + TIME '17:00',
                      INTERVAL '1 hour'
                  ) as time_slot
              ) slots;
          END LOOP;
      END;
      $$ language 'plpgsql'
    `);
  })
  .then(() => {
    // Grant necessary permissions
    return knex.schema.raw(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO PUBLIC;
      GRANT USAGE ON SCHEMA public TO PUBLIC;
      GRANT EXECUTE ON FUNCTION check_slot_availability(TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO PUBLIC;
      GRANT EXECUTE ON FUNCTION get_calendar_data(INTEGER, INTEGER, TEXT) TO PUBLIC
    `);
  });
};

exports.down = function(knex) {
  return knex.schema
    .raw('DROP TRIGGER IF EXISTS validate_appointment_conflict_trigger ON appointments')
    .raw('DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments')
    .raw('DROP FUNCTION IF EXISTS validate_appointment_conflict()')
    .raw('DROP FUNCTION IF EXISTS update_updated_at_column()')
    .raw('DROP FUNCTION IF EXISTS check_slot_availability(TIMESTAMPTZ, TIMESTAMPTZ, UUID)')
    .raw('DROP FUNCTION IF EXISTS get_calendar_data(INTEGER, INTEGER, TEXT)')
    .raw('DROP INDEX IF EXISTS idx_appointments_no_conflict')
    .raw('DROP INDEX IF EXISTS idx_appointments_active')
    .raw('DROP INDEX IF EXISTS idx_appointments_updated_at')
    .raw('DROP INDEX IF EXISTS idx_appointments_created_at')
    .raw('DROP INDEX IF EXISTS idx_appointments_user_status')
    .raw('DROP INDEX IF EXISTS idx_appointments_status')
    .raw('DROP INDEX IF EXISTS idx_appointments_user_email')
    .raw('DROP INDEX IF EXISTS idx_appointments_time_range')
    .raw('DROP INDEX IF EXISTS idx_appointments_end_time')
    .raw('DROP INDEX IF EXISTS idx_appointments_start_time')
    .dropTable('appointments');
};
