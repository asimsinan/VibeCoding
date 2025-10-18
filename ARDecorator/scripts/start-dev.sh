#!/bin/bash

# Simple Development Script - Start both services
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 Starting AR Home Decorator...${NC}"

# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start Backend
echo -e "${BLUE}🔧 Starting Backend...${NC}"
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
sleep 3

echo ""
echo -e "${GREEN}✅ Both services started!${NC}"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "Backend:  ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"

# Wait for user to stop
wait
