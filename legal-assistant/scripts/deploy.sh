#!/bin/bash

# Turkish Legal Assistant Deployment Script

set -e

echo "🚀 Starting deployment process..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found. Creating from .env.example..."
    cp .env.example .env.production
    echo "✅ Please update .env.production with your production values"
    exit 1
fi

# Build Docker image
echo "📦 Building Docker image..."
docker build -t legal-assistant:latest .

# Start services with Docker Compose
echo "🚀 Starting services with Docker Compose..."
docker-compose down || true  # Stop existing containers
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
docker-compose exec -T postgres pg_isready -U legaladmin || {
    echo "❌ PostgreSQL is not ready"
    exit 1
}

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy || {
    echo "⚠️  Migration failed. Please check the logs."
}

# Check if application is running
echo "🔍 Checking application status..."
sleep 5

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Open http://localhost:3000 in your browser"
else
    echo "❌ Application is not responding. Please check the logs:"
    echo "   docker-compose logs app"
    exit 1
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Services:"
echo "   - Application: http://localhost:3000"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
