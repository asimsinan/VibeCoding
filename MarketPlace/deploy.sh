#!/bin/bash

# Marketplace Vercel Deployment Script

echo "🚀 Starting Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel first:"
    vercel login
fi

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Run database migration: npx prisma migrate deploy"
echo "3. Seed database (optional): npx prisma db seed"
echo "4. Test your application"
echo ""
echo "🔗 Check your deployment at: https://your-app-name.vercel.app"
