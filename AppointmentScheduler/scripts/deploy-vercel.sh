#!/bin/bash

# Vercel deployment script for existing PostgreSQL setup
echo "🚀 Deploying to Vercel with existing PostgreSQL..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Run database migrations using your existing DATABASE_URL
if [ ! -z "$DATABASE_URL" ]; then
    echo "🗄️ Running database migrations on Vercel PostgreSQL..."
    npm run db:migrate
else
    echo "⚠️ DATABASE_URL not set, skipping migrations"
    echo "Please set DATABASE_URL in your Vercel environment variables"
fi

echo "🎉 Deployment preparation complete!"
echo ""
echo "Your Vercel PostgreSQL connection:"
echo "DATABASE_URL: $DATABASE_URL"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Deploy to Vercel (your DATABASE_URL is already configured)"
echo "3. Your app will be live at: https://your-app.vercel.app"
