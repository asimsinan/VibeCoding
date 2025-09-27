#!/bin/bash

# E2E Integration Tests Runner
# Runs all end-to-end integration tests for UI-API integration

echo "🚀 Starting E2E Integration Tests..."
echo "=================================="

# Set up environment
export NODE_ENV=test
export CI=true

# Change to the web directory
cd "$(dirname "$0")/../../web"

echo "📁 Working directory: $(pwd)"
echo ""

# Run E2E tests
echo "🧪 Running UI-API Integration Tests..."
npx jest ../tests/web/e2e --config ../tests/web/e2e/jest.config.js --verbose

# Capture exit code
EXIT_CODE=$?

echo ""
echo "=================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All E2E Integration Tests Passed!"
else
    echo "❌ Some E2E Integration Tests Failed!"
fi

echo "Exit code: $EXIT_CODE"
exit $EXIT_CODE
