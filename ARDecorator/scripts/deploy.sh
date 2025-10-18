#!/bin/bash

# AR Designer Vercel Deployment Script
echo "🚀 Starting AR Designer deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo "📦 Building the application..."
npm run build:production

echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🔗 Your app should be available at the provided URL"
echo "📝 Don't forget to:"
echo "   1. Set up your custom domain in Vercel dashboard"
echo "   2. Configure environment variables"
echo "   3. Set up your production database"
echo "   4. Update VITE_API_URL to use your custom domain"