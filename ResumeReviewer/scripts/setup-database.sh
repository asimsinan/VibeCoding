#!/bin/bash

# Database Setup Script for Resume Reviewer
# Creates PostgreSQL database and tests connection

set -e

echo "🚀 Setting up PostgreSQL database for Resume Reviewer..."

# Database configuration
DB_NAME="resume_reviewer_dev"
DB_USER="postgres"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL status..."
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "💡 On macOS with Homebrew: brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "📋 Creating database '$DB_NAME'..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || {
    echo "ℹ️  Database '$DB_NAME' already exists or creation failed"
}

# Test database connection
echo "🔍 Testing database connection..."
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

# Test with psql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1 && {
    echo "✅ Database connection successful"
} || {
    echo "❌ Database connection failed"
    exit 1
}

# Test with Node.js script
echo "🔍 Testing with Node.js connection script..."
node scripts/test-db-connection.js && {
    echo "✅ Node.js database connection successful"
} || {
    echo "❌ Node.js database connection failed"
    exit 1
}

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📊 Database Configuration:"
echo "   • Database Name: $DB_NAME"
echo "   • Host: $DB_HOST"
echo "   • Port: $DB_PORT"
echo "   • User: $DB_USER"
echo "   • Connection URL: $DATABASE_URL"
echo ""
echo "💡 Next steps:"
echo "   1. Run 'npm run db:migrate' to apply schema"
echo "   2. Run 'npm run prisma:generate' to generate client"
echo "   3. Run 'npm run db:test-connection' to verify setup"
