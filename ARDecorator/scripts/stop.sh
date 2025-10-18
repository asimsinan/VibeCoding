#!/bin/bash

# Stop Development Services

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${YELLOW}🛑 Stopping all services...${NC}"

# Kill processes from PID files
if [ -f "$PROJECT_ROOT/.logs/api.pid" ]; then
    kill $(cat "$PROJECT_ROOT/.logs/api.pid") 2>/dev/null || true
    rm "$PROJECT_ROOT/.logs/api.pid"
    echo -e "${GREEN}✅ Backend stopped${NC}"
fi

if [ -f "$PROJECT_ROOT/.logs/web.pid" ]; then
    kill $(cat "$PROJECT_ROOT/.logs/web.pid") 2>/dev/null || true
    rm "$PROJECT_ROOT/.logs/web.pid"
    echo -e "${GREEN}✅ Frontend stopped${NC}"
fi

# Cleanup ports (force kill if necessary)
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✅ Port 3000 freed${NC}" || true
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✅ Port 3001 freed${NC}" || true

echo -e "${GREEN}✅ All services stopped${NC}"

