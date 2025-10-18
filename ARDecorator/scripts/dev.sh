#!/bin/bash

# Development Script - Run Backend and Frontend Simultaneously
# This script starts both services in the background with proper logging

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 Starting AR Home Decorator Development Environment...${NC}"
echo ""

# Check if database exists
if [ ! -f "$PROJECT_ROOT/prisma/dev.db" ]; then
    echo -e "${YELLOW}⚠️  Database not found. Creating...${NC}"
    cd "$PROJECT_ROOT"
    export DATABASE_URL="file:./prisma/dev.db"
    npx prisma db push --skip-generate
    echo -e "${GREEN}✅ Database created${NC}"
    
    # Ask if user wants to seed
    read -p "Do you want to seed the database? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node scripts/seed.js
        echo -e "${GREEN}✅ Database seeded${NC}"
    fi
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/.logs"

# Kill any existing processes on ports 3000 and 3001
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Start Backend
echo -e "${BLUE}🔧 Starting Backend API (port 3001)...${NC}"
cd "$PROJECT_ROOT/apps/api"
export DATABASE_URL="file:$PROJECT_ROOT/prisma/dev.db"
npm run dev > "$PROJECT_ROOT/.logs/api.log" 2>&1 &
API_PID=$!
echo "$API_PID" > "$PROJECT_ROOT/.logs/api.pid"

# Wait for API to start
echo -e "${YELLOW}⏳ Waiting for API to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API is running on http://localhost:3001${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check logs: .logs/api.log${NC}"
        exit 1
    fi
    sleep 1
done

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend (port 3000)...${NC}"
cd "$PROJECT_ROOT/apps/web"
npm run dev > "$PROJECT_ROOT/.logs/web.log" 2>&1 &
WEB_PID=$!
echo "$WEB_PID" > "$PROJECT_ROOT/.logs/web.pid"

# Wait for Frontend to start
echo -e "${YELLOW}⏳ Waiting for Frontend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start. Check logs: .logs/web.log${NC}"
        kill $API_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}           🎉 Development Environment Ready! 🎉      ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📱 Application URLs:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:   ${GREEN}http://localhost:3001${NC}"
echo -e "   API Docs:  ${GREEN}http://localhost:3001/api/v1${NC}"
echo -e "   Health:    ${GREEN}http://localhost:3001/health${NC}"
echo ""
echo -e "${BLUE}🔐 Test Credentials:${NC}"
echo -e "   Admin:  ${YELLOW}admin@ardecorator.com${NC} / ${YELLOW}admin123${NC}"
echo -e "   User:   ${YELLOW}user@ardecorator.com${NC} / ${YELLOW}user123${NC}"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Backend:  ${YELLOW}.logs/api.log${NC}"
echo -e "   Frontend: ${YELLOW}.logs/web.log${NC}"
echo ""
echo -e "${BLUE}⚙️  Control:${NC}"
echo -e "   View logs:    ${YELLOW}npm run logs${NC}"
echo -e "   Stop all:     ${YELLOW}npm run stop${NC} or ${YELLOW}Ctrl+C${NC}"
echo -e "   Restart:      ${YELLOW}npm run dev${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    
    # Kill processes
    if [ -f "$PROJECT_ROOT/.logs/api.pid" ]; then
        kill $(cat "$PROJECT_ROOT/.logs/api.pid") 2>/dev/null || true
        rm "$PROJECT_ROOT/.logs/api.pid"
    fi
    
    if [ -f "$PROJECT_ROOT/.logs/web.pid" ]; then
        kill $(cat "$PROJECT_ROOT/.logs/web.pid") 2>/dev/null || true
        rm "$PROJECT_ROOT/.logs/web.pid"
    fi
    
    # Cleanup ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Keep script running and show status
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "${BLUE}Services are running in the background...${NC}"
echo ""

# Keep the script alive
while true; do
    # Check if services are still running
    if ! kill -0 $API_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend stopped unexpectedly${NC}"
        break
    fi
    
    if ! kill -0 $WEB_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend stopped unexpectedly${NC}"
        break
    fi
    
    sleep 5
done

