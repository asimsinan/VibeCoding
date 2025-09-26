# 🚀 Deployment Guide - Vercel + PostgreSQL

This guide will help you deploy the Appointment Scheduler to Vercel with a PostgreSQL database.

## 📋 Prerequisites

- [Vercel account](https://vercel.com)
- [GitHub account](https://github.com)
- [Neon Database](https://neon.tech) (recommended) or [Supabase](https://supabase.com) for PostgreSQL

## 🗄️ Database Setup

### Option 1: Neon Database (Recommended)

1. **Create a Neon account** at [neon.tech](https://neon.tech)
2. **Create a new project** called "appointment-scheduler"
3. **Copy the connection string** (it will look like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`)

### Option 2: Supabase

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project** called "appointment-scheduler"
3. **Go to Settings > Database** and copy the connection string

## 🚀 Deploy to Vercel

### Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `public` (for static files)
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NODE_ENV=production
PORT=8080
DEFAULT_TIMEZONE=Europe/Istanbul
BUSINESS_START_HOUR=9
BUSINESS_END_HOUR=16
APPOINTMENT_DURATION_MINUTES=60
```

### Step 4: Deploy and Run Migrations

1. **Deploy the project** (Vercel will automatically build and deploy)
2. **Run database migrations** using Vercel CLI:
   ```bash
   npm install -g vercel
   vercel login
   vercel env pull .env.local
   npm run db:migrate
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `8080` |
| `DEFAULT_TIMEZONE` | Default timezone | `Europe/Istanbul` |
| `BUSINESS_START_HOUR` | Business start hour | `9` |
| `BUSINESS_END_HOUR` | Business end hour | `16` |
| `APPOINTMENT_DURATION_MINUTES` | Default appointment duration | `60` |

### Vercel Configuration

The `vercel.json` file configures:
- **API routes** to point to your Node.js server
- **Static files** to be served from the `public` directory
- **Build settings** for production

## 🧪 Testing Your Deployment

1. **Visit your Vercel URL** (e.g., `https://your-app.vercel.app`)
2. **Check the health endpoint**: `https://your-app.vercel.app/api/v1/health`
3. **Test the calendar**: `https://your-app.vercel.app/api/v1/calendar/2025/1`

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your `DATABASE_URL` environment variable
   - Ensure your database allows connections from Vercel IPs
   - Verify SSL settings

2. **Build Failed**
   - Check that all dependencies are in `package.json`
   - Ensure build command is correct
   - Check for any syntax errors

3. **API Routes Not Working**
   - Verify `vercel.json` configuration
   - Check that routes are properly defined
   - Ensure environment variables are set

### Debug Commands

```bash
# Check Vercel logs
vercel logs

# Check environment variables
vercel env ls

# Test locally with production env
vercel dev
```

## 📊 Monitoring

- **Vercel Analytics**: Monitor performance and usage
- **Database Monitoring**: Use your database provider's dashboard
- **Error Tracking**: Consider adding Sentry or similar

## 🔄 Updates

To update your deployment:

1. **Push changes to GitHub**
2. **Vercel automatically redeploys**
3. **Run migrations if needed**: `vercel env pull && npm run db:migrate`

## 🎉 Success!

Your appointment scheduler should now be live at your Vercel URL! 

- **Frontend**: `https://your-app.vercel.app`
- **API**: `https://your-app.vercel.app/api/v1/`
- **Health Check**: `https://your-app.vercel.app/api/v1/health`
