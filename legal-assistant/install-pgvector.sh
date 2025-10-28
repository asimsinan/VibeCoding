#!/bin/bash
# Install pgvector for PostgreSQL 17

echo "🔧 Installing pgvector for PostgreSQL 17..."

# Find PostgreSQL 17 version
PG_VERSION="17"
PG_CONFIG="/opt/homebrew/opt/postgresql@17/bin/pg_config"
# If that doesn't work, try:
# PG_CONFIG="/opt/homebrew/Cellar/postgresql@17/17.6/bin/pg_config"

# Clone pgvector if not exists
if [ ! -d "pgvector" ]; then
    echo "📥 Cloning pgvector repository..."
    git clone https://github.com/pgvector/pgvector.git
fi

cd pgvector

# Build and install
echo "🔨 Building pgvector..."
make clean
make PG_CONFIG="$PG_CONFIG"

echo "📦 Installing pgvector (requires password)..."
sudo make install PG_CONFIG="$PG_CONFIG"

echo "✅ pgvector installed! Now run:"
echo "   psql postgresql://postgres:postgres@localhost:5432/legal_assistant -c 'CREATE EXTENSION vector;'"

