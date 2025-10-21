#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🚀 Setting up PostgreSQL database for Resume Reviewer..."

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL status..."
if pg_isready -q; then
  echo "✅ PostgreSQL is running"
else
  echo "❌ PostgreSQL is not running. Please start it and try again."
  exit 1
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "⚠️ .env.local file not found. Assuming default PostgreSQL settings."
  export DATABASE_URL="postgresql://postgres:password@localhost:5432/resume_reviewer_dev?schema=public"
fi

# Extract database connection details
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

echo "📋 Database Configuration:"
echo "   • Host: $DB_HOST"
echo "   • Port: $DB_PORT"
echo "   • User: $DB_USER"
echo "   • Database: $DB_NAME"

echo "📋 Creating database '$DB_NAME'..."
# Check if database exists, if not, create it
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -wq "$DB_NAME"; then
    echo "✅ Database '$DB_NAME' already exists."
else
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo "✅ Database '$DB_NAME' created successfully."
fi

echo "✨ Database setup complete."
echo ""
echo "🔧 Next steps:"
echo "   1. Run 'npx prisma migrate deploy' to apply schema"
echo "   2. Run 'npx prisma generate' to generate client"
echo "   3. Test connection with 'npm run db:test-connection'"
