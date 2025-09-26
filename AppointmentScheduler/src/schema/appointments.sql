-- AppointmentScheduler Database Schema
-- 
-- This file contains the PostgreSQL schema for the appointments table
-- with proper constraints, indexes, and triggers for conflict prevention.
-- 
-- Maps to TASK-005: Schema Design
-- TDD Phase: Contract
-- Constitutional Compliance: Anti-Abstraction Gate, Performance Gate

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create appointments table with conflict prevention
CREATE TABLE IF NOT EXISTS appointments (
    -- Primary key using UUID for unique identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Appointment timing with timezone support
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- User information
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    
    -- Optional notes
    notes TEXT,
    
    -- Appointment status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Constraints for data integrity
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rescheduled')),
    CONSTRAINT valid_email CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_user_name CHECK (LENGTH(user_name) >= 1 AND LENGTH(user_name) <= 100),
    CONSTRAINT valid_notes CHECK (notes IS NULL OR LENGTH(notes) <= 500)
);

-- Performance indexes for common queries
-- Index for time-based queries (calendar view, availability checks)
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_end_time ON appointments(end_time);

-- Composite index for time range queries (most common)
CREATE INDEX IF NOT EXISTS idx_appointments_time_range ON appointments(start_time, end_time);

-- Index for user-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_email ON appointments(user_email);

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Composite index for user and status queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_status ON appointments(user_email, status);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_updated_at ON appointments(updated_at);

-- Unique constraint to prevent double-booking conflicts
-- This index ensures no two confirmed or pending appointments can overlap
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_conflict 
ON appointments(start_time, end_time) 
WHERE status IN ('confirmed', 'pending');

-- Partial index for active appointments only
CREATE INDEX IF NOT EXISTS idx_appointments_active 
ON appointments(start_time, end_time, user_email) 
WHERE status IN ('confirmed', 'pending');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER IF NOT EXISTS update_appointments_updated_at 
BEFORE UPDATE ON appointments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate appointment conflicts
CREATE OR REPLACE FUNCTION validate_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping appointments with confirmed or pending status
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE id != NEW.id 
        AND status IN ('confirmed', 'pending')
        AND (
            (NEW.start_time < end_time AND NEW.end_time > start_time)
        )
    ) THEN
        RAISE EXCEPTION 'Appointment conflicts with existing appointment';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to validate conflicts before insert/update
CREATE TRIGGER IF NOT EXISTS validate_appointment_conflict_trigger
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION validate_appointment_conflict();

-- Function to generate appointment ID with prefix
CREATE OR REPLACE FUNCTION generate_appointment_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    -- Get the next counter value
    SELECT COALESCE(MAX(CAST(SUBSTRING(id::TEXT FROM 5) AS INTEGER)), 0) + 1
    INTO counter
    FROM appointments
    WHERE id::TEXT LIKE 'apt_%';
    
    -- Generate new ID with format: apt_XXXXX
    new_id := 'apt_' || LPAD(counter::TEXT, 5, '0');
    
    RETURN new_id;
END;
$$ language 'plpgsql';

-- View for appointment availability checking
CREATE OR REPLACE VIEW appointment_availability AS
SELECT 
    start_time,
    end_time,
    CASE 
        WHEN COUNT(*) = 0 THEN true
        ELSE false
    END as is_available
FROM (
    SELECT 
        generate_series(
            date_trunc('hour', NOW()),
            date_trunc('hour', NOW()) + interval '1 month',
            interval '1 hour'
        ) as start_time,
        generate_series(
            date_trunc('hour', NOW()) + interval '1 hour',
            date_trunc('hour', NOW()) + interval '1 month' + interval '1 hour',
            interval '1 hour'
        ) as end_time
) time_slots
LEFT JOIN appointments ON (
    appointments.status = 'confirmed'
    AND appointments.start_time < time_slots.end_time
    AND appointments.end_time > time_slots.start_time
)
GROUP BY start_time, end_time
ORDER BY start_time;

-- Function to check slot availability
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
            WHERE status IN ('confirmed', 'pending')
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
    WHERE status IN ('confirmed', 'pending')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND (p_start_time < end_time AND p_end_time > start_time);
END;
$$ language 'plpgsql';

-- Function to get calendar data for a specific month
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
                AND status IN ('confirmed', 'pending')
            ) as is_available,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'startTime', TO_CHAR(time_slot, 'HH24:MI'),
                        'endTime', TO_CHAR(time_slot + INTERVAL '1 hour', 'HH24:MI'),
                        'isAvailable', NOT EXISTS (
                            SELECT 1 FROM appointments 
                            WHERE status IN ('confirmed', 'pending')
                            AND DATE(start_time AT TIME ZONE p_timezone) = current_date
                            AND time_slot::TIME >= start_time::TIME
                            AND time_slot::TIME < end_time::TIME
                        ),
                        'appointmentId', (
                            SELECT id FROM appointments 
                            WHERE status IN ('confirmed', 'pending')
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
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT EXECUTE ON FUNCTION check_slot_availability(TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_calendar_data(INTEGER, INTEGER, TEXT) TO PUBLIC;

-- Add comments for documentation
COMMENT ON TABLE appointments IS 'Stores appointment data with conflict prevention';
COMMENT ON COLUMN appointments.id IS 'Unique identifier for the appointment';
COMMENT ON COLUMN appointments.start_time IS 'Appointment start time with timezone';
COMMENT ON COLUMN appointments.end_time IS 'Appointment end time with timezone';
COMMENT ON COLUMN appointments.user_email IS 'User email address';
COMMENT ON COLUMN appointments.user_name IS 'User full name';
COMMENT ON COLUMN appointments.status IS 'Appointment status: pending, confirmed, cancelled, rescheduled';
COMMENT ON COLUMN appointments.created_at IS 'Timestamp when appointment was created';
COMMENT ON COLUMN appointments.updated_at IS 'Timestamp when appointment was last updated';

COMMENT ON INDEX idx_appointments_no_conflict IS 'Prevents double-booking by ensuring no overlapping confirmed or pending appointments';
COMMENT ON INDEX idx_appointments_time_range IS 'Optimizes time-based queries for calendar and availability checks';
COMMENT ON INDEX idx_appointments_user_email IS 'Optimizes user-based appointment queries';
COMMENT ON INDEX idx_appointments_status IS 'Optimizes status-based appointment queries';
