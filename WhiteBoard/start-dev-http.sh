#!/bin/bash

# Force HTTP mode for Safari compatibility
export HTTPS=false
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Start Next.js development server
cd /Users/asimsinanyuksel/Desktop/WhiteBoard
npm run dev
