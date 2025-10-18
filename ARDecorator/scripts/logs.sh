#!/bin/bash

# View Development Logs

# Colors
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d "$PROJECT_ROOT/.logs" ]; then
    echo "No logs found. Start the dev server first with: npm run dev"
    exit 1
fi

echo -e "${BLUE}📝 Viewing development logs...${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
echo ""

# Follow both log files
tail -f "$PROJECT_ROOT/.logs/api.log" "$PROJECT_ROOT/.logs/web.log" 2>/dev/null

