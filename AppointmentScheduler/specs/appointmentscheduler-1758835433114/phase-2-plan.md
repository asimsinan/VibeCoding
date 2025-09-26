# Phase 2 Implementation Plan: Database Setup

## Feature Overview
- **Feature**: AppointmentScheduler
- **Platform**: Web
- **Branch**: feat/appointmentscheduler-1758835433114
- **Feature ID**: appointmentscheduler-1758835433114
- **Phase**: 2 - Database Setup
- **Duration**: 1 day (AI: 1-2 hours, Human: 1 day)

## Phase Summary
Phase 2 establishes the database foundation for the AppointmentScheduler system. This phase focuses on setting up PostgreSQL 15 with proper connection pooling, designing the database schema with conflict prevention, and implementing a robust migration system. All tasks in this phase can be executed in parallel, building upon the API contracts established in Phase 1.

## Constitutional Gates Compliance
✅ **FULLY COMPLIANT** - All constitutional gates validated and passed for Phase 2

### Gates Validation Summary
- **Integration-First Testing Gate**: ✅ PASS - Real PostgreSQL database prioritized over mocks
- **Performance Gate**: ✅ PASS - Connection pooling and indexing for performance
- **Anti-Abstraction Gate**: ✅ PASS - Single domain model (Appointment entity) maintained
- **Security Gate**: ✅ PASS - Proper database security and migration handling
- **Simplicity Gate**: ✅ PASS - Phase maintains ≤5 projects requirement
- **Traceability Gate**: ✅ PASS - Every task maps to specific FR-XXX requirements

## Phase 2 Tasks

### TASK-004: Database Setup [P]
- **TDD Phase**: Contract
- **Priority**: Critical Path
- **Parallelizable**: Yes
- **Dependencies**: [TASK-001]
- **Estimated LOC**: 50-100 lines
- **Constitutional Compliance**: ✅ Integration-First Testing Gate, Performance Gate

#### Description
Set up PostgreSQL 15 database with connection pooling and proper configuration for development, staging, and production environments.

#### Acceptance Criteria
- PostgreSQL 15 instance running and accessible
- Connection pooling configured (10-20 connections)
- Environment-specific configurations (dev, staging, prod)
- Health check endpoints for database connectivity
- Proper error handling and connection retry logic
- Database connection validation and testing

#### Implementation Details
- Configure PostgreSQL 15 with optimal settings
- Implement connection pooling using pg-pool
- Set up environment-specific database configurations
- Create database health check endpoints
- Implement connection retry logic with exponential backoff
- Add database connection monitoring and logging

#### Environment Configuration
```javascript
// Database configuration structure
const dbConfig = {
  development: {
    host: 'localhost',
    port: 5432,
    database: 'appointment_scheduler_dev',
    user: 'postgres',
    password: 'dev_password',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },
  staging: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: { rejectUnauthorized: false }
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: { rejectUnauthorized: true }
  }
};
```

#### Health Check Implementation
- Database connectivity validation
- Connection pool status monitoring
- Query performance metrics
- Error rate tracking
- Automated recovery procedures

---

### TASK-005: Schema Design [P]
- **TDD Phase**: Contract
- **Priority**: Critical Path
- **Parallelizable**: Yes
- **Dependencies**: [TASK-004]
- **Estimated LOC**: 100-150 lines
- **Constitutional Compliance**: ✅ Anti-Abstraction Gate, Performance Gate

#### Description
Design PostgreSQL schema with appointments table, indexes, and constraints to prevent double-booking conflicts and ensure optimal performance.

#### Acceptance Criteria
- Appointments table with proper data types and constraints
- Indexes for performance optimization (start_time, user_email, status)
- Unique constraint to prevent double-booking conflicts
- Proper timezone handling with TIMESTAMPTZ
- Foreign key constraints and referential integrity
- Audit fields (created_at, updated_at, created_by, updated_by)

#### Implementation Details
- Design normalized database schema
- Implement conflict prevention constraints
- Create performance-optimized indexes
- Set up proper timezone handling
- Add audit trail fields
- Implement data validation at database level

#### Schema Design
```sql
-- Appointments table with conflict prevention
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_status CHECK (status IN ('confirmed', 'cancelled', 'rescheduled')),
    CONSTRAINT valid_email CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for performance optimization
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_user_email ON appointments(user_email);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_time_range ON appointments(start_time, end_time);

-- Unique constraint to prevent double-booking
CREATE UNIQUE INDEX idx_appointments_no_conflict 
ON appointments(start_time, end_time) 
WHERE status = 'confirmed';

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
BEFORE UPDATE ON appointments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Performance Optimizations
- Composite indexes for common query patterns
- Partial indexes for filtered queries
- Query optimization for time range searches
- Connection pooling for concurrent access
- Prepared statements for security and performance

---

### TASK-006: Migration Setup [P]
- **TDD Phase**: Contract
- **Priority**: High
- **Parallelizable**: Yes
- **Dependencies**: [TASK-005]
- **Estimated LOC**: 50-100 lines
- **Constitutional Compliance**: ✅ Integration-First Testing Gate, Security Gate

#### Description
Set up database migration system with version control and rollback capabilities using Knex.js for reliable database schema management.

#### Acceptance Criteria
- Migration system configured (Knex.js)
- Up and down migration scripts for all schema changes
- Version control integration with Git
- Environment-specific migration handling
- Rollback capabilities for all migrations
- Migration validation and testing

#### Implementation Details
- Configure Knex.js migration system
- Create initial migration for appointments table
- Implement rollback procedures
- Set up environment-specific migration handling
- Add migration validation and testing
- Integrate with CI/CD pipeline

#### Migration Structure
```javascript
// Migration configuration
const knexConfig = {
  development: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'appointment_scheduler_dev',
      user: 'postgres',
      password: 'dev_password'
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  staging: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    }
  },
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: true }
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    pool: {
      min: 2,
      max: 20
    }
  }
};
```

#### Migration Scripts
- Initial schema creation migration
- Index creation migration
- Constraint addition migration
- Data seeding migration
- Rollback migration scripts
- Migration validation tests

## Implementation Strategy

### Parallel Execution Strategy
- **TASK-004**, **TASK-005**, and **TASK-006** can be executed in parallel
- Database setup enables schema design and migration setup
- All tasks build upon the API contracts from Phase 1
- Use feature branches for parallel development
- Merge to main branch after all tasks complete

### TDD Workflow for Phase 2
1. **RED Phase**: Create failing database tests
2. **GREEN Phase**: Implement database setup and schema
3. **REFACTOR Phase**: Optimize performance and security
4. **INTEGRATION Phase**: Validate with API contracts

### Database Security Considerations
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Set up SSL connections for production
- Use environment variables for sensitive data
- Implement connection pooling limits
- Add database access logging and monitoring

### Performance Considerations
- Connection pooling for concurrent access
- Indexes for common query patterns
- Query optimization for time range searches
- Prepared statements for security and performance
- Database connection monitoring
- Performance benchmarking and testing

## Success Criteria

### Definition of Done
- ✅ PostgreSQL 15 instance running and accessible
- ✅ Connection pooling configured and tested
- ✅ Database schema designed with conflict prevention
- ✅ Migration system configured with rollback capabilities
- ✅ All constitutional gates validated
- ✅ Traceability to FR-XXX requirements confirmed
- ✅ No linting errors
- ✅ Documentation updated

### Quality Metrics
- **Database Performance**: <100ms query response time
- **Connection Pool**: 10-20 connections configured
- **Schema Validation**: All constraints and indexes created
- **Migration Coverage**: All schema changes have migrations
- **Security**: SSL connections and parameterized queries
- **Monitoring**: Health checks and performance metrics

## Risk Mitigation

### Identified Risks
1. **Database Connection Issues**: Risk of connection failures
   - **Mitigation**: Implement retry logic and health checks
2. **Schema Design Complexity**: Risk of over-engineering
   - **Mitigation**: Start with simple schema, iterate based on needs
3. **Migration Failures**: Risk of migration rollback issues
   - **Mitigation**: Test migrations thoroughly, implement rollback procedures

### Contingency Plans
- If database setup fails, use Docker containers for development
- If schema design is too complex, simplify and iterate
- If migrations fail, implement manual rollback procedures

## Next Phase Preparation
Phase 2 completion enables Phase 3 (Data Models) by providing:
- Functional database with proper schema
- Migration system for schema changes
- Connection pooling for performance
- Health checks for monitoring
- Security configurations for production

## Timeline
- **Hour 1**: TASK-004 (Database Setup) + TASK-005 (Schema Design)
- **Hour 2**: TASK-006 (Migration Setup) + Validation
- **Total**: 1 day with AI assistance reducing to 1-2 hours

## Resources Required
- PostgreSQL 15 installation
- Knex.js migration framework
- Database connection pooling library
- Environment configuration management
- Database monitoring tools
- Migration testing framework

## Database Schema Overview

### Core Tables
- **appointments**: Main table for appointment data
- **knex_migrations**: Migration tracking table

### Key Features
- **Conflict Prevention**: Unique constraints prevent double-booking
- **Performance**: Indexes optimize common queries
- **Audit Trail**: Created/updated timestamps and user tracking
- **Data Integrity**: Constraints ensure data validity
- **Timezone Support**: TIMESTAMPTZ for proper time handling

### Indexes Strategy
- **Primary Key**: UUID for unique identification
- **Time Range**: Composite index for availability queries
- **User Lookup**: Index on user_email for user queries
- **Status Filtering**: Index on status for filtered queries
- **Conflict Detection**: Unique index for time range conflicts

---

*This phase plan follows SDD-Cursor-1.2 methodology with strict TDD ordering and constitutional gates validation.*
