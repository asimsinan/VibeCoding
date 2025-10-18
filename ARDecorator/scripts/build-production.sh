#!/bin/bash

# Production Build Script for AR Home Decorator
# This script builds both frontend and backend for production deployment

set -e

echo "🚀 Starting production build..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci

# 2. Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
npx prisma generate

# 3. Build backend
echo -e "${BLUE}🏗️  Building backend...${NC}"
cd apps/api
npm run build
cd ../..

# 4. Build frontend
echo -e "${BLUE}🎨 Building frontend...${NC}"
cd apps/web
npm run build
cd ../..

# 5. Run production checks
echo -e "${BLUE}✅ Running production checks...${NC}"

# Check if dist folders exist
if [ ! -d "apps/api/dist" ]; then
    echo "❌ Backend build failed - dist folder not found"
    exit 1
fi

if [ ! -d "apps/web/dist" ]; then
    echo "❌ Frontend build failed - dist folder not found"
    exit 1
fi

echo -e "${GREEN}✅ Production build completed successfully!${NC}"
echo ""
echo "📂 Build Output:"
echo "  - Backend: apps/api/dist"
echo "  - Frontend: apps/web/dist"
echo ""
echo "🚀 Ready for deployment!"

