#!/bin/bash

# Database Setup Script for Marketplace Application
# This script sets up the PostgreSQL database for development

set -e

echo "🚀 Setting up database for marketplace application..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if Prisma CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Node.js/npx is not installed. Please install Node.js first."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found. Please create one with DATABASE_URL."
    echo "   Example: DATABASE_URL=\"postgresql://username:password@localhost:5432/marketplace\""
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in environment variables."
    echo "   Please set DATABASE_URL in your .env file."
    exit 1
fi

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')
DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')

echo "📊 Database configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Test database connection
echo "🔍 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "   Please check your DATABASE_URL and ensure PostgreSQL is running."
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed the database
echo "🌱 Seeding database with sample data..."
npx prisma db seed

echo "✅ Database setup completed successfully!"
echo ""
echo "🎉 Your marketplace database is ready!"
echo "   You can now start the development server with: npm run dev"
echo ""
echo "📚 Useful commands:"
echo "   npx prisma studio    - Open Prisma Studio"
echo "   npx prisma migrate dev - Create new migration"
echo "   npx prisma db push   - Push schema changes"
echo "   npx prisma db seed   - Reseed database"
