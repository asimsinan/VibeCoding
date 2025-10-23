-- Initialize PostgreSQL database for crowdfunding platform
-- This script runs when the PostgreSQL container starts

-- Create development database
CREATE DATABASE crowdfunding_dev;
CREATE DATABASE crowdfunding_prod;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE crowdfunding_dev TO postgres;
GRANT ALL PRIVILEGES ON DATABASE crowdfunding_prod TO postgres;

-- Create extensions that might be needed
\c crowdfunding_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c crowdfunding_prod;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Crowdfunding platform databases initialized successfully!';
END $$;
