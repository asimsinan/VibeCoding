#!/bin/bash

# Complete Development Script - Start all services (API, Web)
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 Starting AR Home Decorator (All Services)...${NC}"

# Kill existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start Backend API
echo -e "${BLUE}🔧 Starting Backend API...${NC}"
cd "$PROJECT_ROOT/apps/api"
export DATABASE_URL="file:$PROJECT_ROOT/prisma/dev.db"
npm run dev &
API_PID=$!

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend...${NC}"
cd "$PROJECT_ROOT/apps/web"
npm run dev &
WEB_PID=$!

# Wait a moment for services to start
sleep 5

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo -e "Frontend:    ${GREEN}http://localhost:3000${NC}"
echo -e "Backend API: ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping all services...${NC}"
    kill $API_PID 2>/dev/null || true
    kill $WEB_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
