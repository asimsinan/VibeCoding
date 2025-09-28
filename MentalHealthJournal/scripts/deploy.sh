#!/bin/bash

# MoodTracker Deployment Script
# This script helps deploy the app to Vercel

echo "🚀 MoodTracker Deployment Script"
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "Please install it with: npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel."
    echo "Please run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI is ready"

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up your PostgreSQL database"
    echo "2. Add environment variables in Vercel dashboard"
    echo "3. Run: npm run db:init-prod (to initialize database)"
    echo "4. Test your deployed app"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
