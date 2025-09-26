#!/usr/bin/env node
/**
 * Appointment Repository
 * 
 * Data access layer for appointment management:
 * - Database operations for appointments
 * - Query building and optimization
 * - Data transformation and validation
 * - Connection management
 * 
 * Maps to TASK-009: Implement Core Library
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Anti-Abstraction Gate, Traceability Gate
 */

const { 
  AppointmentStatus
} = require('../models');

class AppointmentRepository {
  constructor(databaseConnection) {
    this.db = databaseConnection;
  }

  /**
   * Transform appointment to database row
   * @private
   */
  _transformAppointmentToDbRow(appointment) {
    return {
      id: appointment.id,
      start_time: appointment.startTime,
      end_time: appointment.endTime,
      user_email: appointment.userEmail,
      user_name: appointment.userName,
      notes: appointment.notes || '',
      status: appointment.status,
      created_at: appointment.createdAt,
      updated_at: appointment.updatedAt
    };
  }

  /**
   * Transform database row to appointment
   * @private
   */
  _transformDbRowToAppointment(row) {
    return {
      id: row.id,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      userEmail: row.user_email,
      userName: row.user_name,
      notes: row.notes || '',
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Create a new appointment
   * @param {Object} appointment - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async create(appointment) {
    try {
      const dbRow = this._transformAppointmentToDbRow(appointment);
      
      // Ensure status has a default value
      if (!dbRow.status) {
        dbRow.status = 'pending';
      }
      
      console.log('🔍 Creating appointment with data:', {
        id: dbRow.id,
        status: dbRow.status,
        userEmail: dbRow.user_email,
        startTime: dbRow.start_time
      });
      
      const query = `
        INSERT INTO appointments (
          id, start_time, end_time, user_email, user_name, 
          notes, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        dbRow.id,
        dbRow.start_time,
        dbRow.end_time,
        dbRow.user_email,
        dbRow.user_name,
        dbRow.notes,
        dbRow.status,
        dbRow.created_at,
        dbRow.updated_at
      ];
      
      const result = await this.db.query(query, values);
      const createdRow = result.rows[0];
      
      return this._transformDbRowToAppointment(createdRow);
    } catch (error) {
      console.error('❌ Database error details:', error);
      throw new Error(`Failed to create appointment: ${error.message}`);
    }
  }

  /**
   * Find appointment by ID
   * @param {string} id - Appointment ID
   * @returns {Promise<Object|null>} Appointment or null
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM appointments WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this._transformDbRowToAppointment(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to find appointment by ID: ${error.message}`);
    }
  }

  /**
   * Find appointments with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of appointments
   */
  async find(filters = {}) {
    try {
      const { query, values } = this._buildFindQuery(filters);
      const result = await this.db.query(query, values);
      
      return result.rows.map(row => this._transformDbRowToAppointment(row));
    } catch (error) {
      console.error('❌ AppointmentRepository.find error:', error);
      throw new Error(`Failed to find appointments: ${error.message}`);
    }
  }

  /**
   * Update an appointment
   * @param {string} id - Appointment ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated appointment
   */
  async update(id, updateData) {
    try {
      const dbRow = this._transformAppointmentToDbRow(updateData);
      
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      
      // Build dynamic SET clause
      const updateFields = [
        'start_time', 'end_time', 'user_email', 'user_name', 
        'notes', 'status', 'updated_at'
      ];
      
      for (const field of updateFields) {
        if (dbRow[field] !== undefined) {
          setClause.push(`${field} = $${paramIndex}`);
          values.push(dbRow[field]);
          paramIndex++;
        }
      }
      
      if (setClause.length === 0) {
        throw new Error('No fields to update');
      }
      
      values.push(id); // Add ID parameter
      
      const query = `
        UPDATE appointments 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await this.db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error(`Appointment with ID ${id} not found`);
      }
      
      return this._transformDbRowToAppointment(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }
  }

  /**
   * Delete an appointment
   * @param {string} id - Appointment ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM appointments WHERE id = $1 RETURNING id';
      const result = await this.db.query(query, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  /**
   * Count appointments with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Count of appointments
   */
  async count(filters = {}) {
    try {
      const { query, values } = this._buildCountQuery(filters);
      const result = await this.db.query(query, values);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to count appointments: ${error.message}`);
    }
  }

  /**
   * Get appointments in a time range
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {string} [excludeId] - Appointment ID to exclude
   * @returns {Promise<Array>} Appointments in range
   */
  async findInTimeRange(startTime, endTime, excludeId = null) {
    try {
      let query = `
        SELECT * FROM appointments 
        WHERE start_time < $2 AND end_time > $1
        AND status = $3
      `;
      
      const values = [startTime, endTime, AppointmentStatus.CONFIRMED];
      
      if (excludeId) {
        query += ' AND id != $4';
        values.push(excludeId);
      }
      
      query += ' ORDER BY start_time ASC';
      
      const result = await this.db.query(query, values);
      
      return result.rows.map(row => this._transformDbRowToAppointment(row));
    } catch (error) {
      throw new Error(`Failed to find appointments in time range: ${error.message}`);
    }
  }

  /**
   * Get appointments by user email
   * @param {string} userEmail - User email
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} User appointments
   */
  async findByUserEmail(userEmail, options = {}) {
    try {
      const filters = {
        userEmail,
        ...options
      };
      
      return await this.find(filters);
    } catch (error) {
      throw new Error(`Failed to find appointments by user email: ${error.message}`);
    }
  }

  /**
   * Get appointment statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Appointment statistics
   */
  async getStats(filters = {}) {
    try {
      const baseQuery = this._buildBaseQuery(filters);
      
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes
        FROM appointments 
        ${baseQuery.whereClause}
      `;
      
      const result = await this.db.query(query, baseQuery.values);
      const stats = result.rows[0];
      
      return {
        total: parseInt(stats.total),
        confirmed: parseInt(stats.confirmed),
        pending: parseInt(stats.pending),
        cancelled: parseInt(stats.cancelled),
        averageDurationMinutes: parseFloat(stats.avg_duration_minutes) || 0
      };
    } catch (error) {
      throw new Error(`Failed to get appointment stats: ${error.message}`);
    }
  }

  /**
   * Build find query with filters
   * @private
   */
  _buildFindQuery(filters) {
    const baseQuery = this._buildBaseQuery(filters);
    
    let query = `SELECT * FROM appointments ${baseQuery.whereClause}`;
    
    // Add ordering
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder || 'ASC';
      query += ` ORDER BY ${filters.sortBy} ${sortOrder}`;
    } else {
      query += ' ORDER BY start_time ASC';
    }
    
    // Add limit and offset
    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
    }
    
    if (filters.offset) {
      query += ` OFFSET ${filters.offset}`;
    }
    
    return { query, values: baseQuery.values };
  }

  /**
   * Build count query with filters
   * @private
   */
  _buildCountQuery(filters) {
    const baseQuery = this._buildBaseQuery(filters);
    const query = `SELECT COUNT(*) FROM appointments ${baseQuery.whereClause}`;
    
    return { query, values: baseQuery.values };
  }

  /**
   * Build base query with filters
   * @private
   */
  _buildBaseQuery(filters) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    
    // Status filter - support both single status and array of statuses
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        // Multiple statuses: status IN ('confirmed', 'pending')
        const placeholders = filters.status.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`status IN (${placeholders})`);
        values.push(...filters.status);
      } else {
        // Single status: status = 'confirmed'
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }
    }
    
    // User email filter
    if (filters.userEmail) {
      conditions.push(`user_email = $${paramIndex}`);
      values.push(filters.userEmail);
      paramIndex++;
    }
    
    // Date range filters
    if (filters.startDate) {
      conditions.push(`start_time >= $${paramIndex}`);
      values.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters.endDate) {
      conditions.push(`end_time <= $${paramIndex}`);
      values.push(filters.endDate);
      paramIndex++;
    }
    
    // Exclude ID filter
    if (filters.excludeId) {
      conditions.push(`id != $${paramIndex}`);
      values.push(filters.excludeId);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    return { whereClause, values };
  }

  /**
   * Execute raw query
   * @param {string} query - SQL query
   * @param {Array} values - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async rawQuery(query, values = []) {
    try {
      return await this.db.query(query, values);
    } catch (error) {
      throw new Error(`Failed to execute raw query: ${error.message}`);
    }
  }

  /**
   * Begin transaction
   * @returns {Promise<Object>} Transaction object
   */
  async beginTransaction() {
    try {
      return await this.db.beginTransaction();
    } catch (error) {
      throw new Error(`Failed to begin transaction: ${error.message}`);
    }
  }

  /**
   * Commit transaction
   * @param {Object} transaction - Transaction object
   */
  async commitTransaction(transaction) {
    try {
      await this.db.commitTransaction(transaction);
    } catch (error) {
      throw new Error(`Failed to commit transaction: ${error.message}`);
    }
  }

  /**
   * Rollback transaction
   * @param {Object} transaction - Transaction object
   */
  async rollbackTransaction(transaction) {
    try {
      await this.db.rollbackTransaction(transaction);
    } catch (error) {
      throw new Error(`Failed to rollback transaction: ${error.message}`);
    }
  }
}

module.exports = AppointmentRepository;
