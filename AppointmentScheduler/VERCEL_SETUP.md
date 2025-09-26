# 🚀 Vercel Deployment with Existing PostgreSQL

You already have PostgreSQL set up on Vercel! Here's how to deploy your appointment scheduler.

## ✅ Your Current Setup

- **PostgreSQL**: Already configured on Vercel
- **Database URL**: `postgres://01cc8d726fcb6b136a3b1fc073cf16d2b25815eff6b6e99b9f4c069af685ec38:sk_Rbih6yz0swKefeVjdBnde@db.prisma.io:5432/postgres?sslmode=require`
- **Prisma**: Available for advanced database operations

## 🚀 Quick Deployment

### Step 1: Deploy to Vercel

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Vercel with PostgreSQL"
   git push origin main
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure**:
   - Framework: **Other**
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Install Command: `npm install`

### Step 2: Set Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

```bash
DATABASE_URL=postgres://01cc8d726fcb6b136a3b1fc073cf16d2b25815eff6b6e99b9f4c069af685ec38:sk_Rbih6yz0swKefeVjdBnde@db.prisma.io:5432/postgres?sslmode=require
NODE_ENV=production
PORT=8080
DEFAULT_TIMEZONE=Europe/Istanbul
BUSINESS_START_HOUR=9
BUSINESS_END_HOUR=16
APPOINTMENT_DURATION_MINUTES=60
```

### Step 3: Deploy and Setup Database

1. **Click "Deploy"** in Vercel
2. **Wait for deployment to complete**
3. **Run database migrations**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Pull environment variables
   vercel env pull .env.local
   
   # Run migrations
   npm run db:migrate
   ```

## 🎉 Your App is Live!

- **Frontend**: `https://your-app.vercel.app`
- **API**: `https://your-app.vercel.app/api/v1/`
- **Health Check**: `https://your-app.vercel.app/api/v1/health`

## 🧪 Test Your Deployment

1. **Visit your app**: `https://your-app.vercel.app`
2. **Check health**: `https://your-app.vercel.app/api/v1/health`
3. **Test calendar**: `https://your-app.vercel.app/api/v1/calendar/2025/1`
4. **Create an appointment** through the UI

## 🔧 Troubleshooting

### Database Connection Issues
- Your `DATABASE_URL` is already configured correctly
- The SSL settings are properly set for Vercel
- Check Vercel logs if you see connection errors

### Build Issues
- Ensure all files are committed to GitHub
- Check that `package.json` has all dependencies
- Verify `vercel.json` configuration

### API Not Working
- Check that environment variables are set in Vercel
- Verify database migrations ran successfully
- Check Vercel function logs

## 📊 Monitoring

- **Vercel Dashboard**: Monitor deployments and performance
- **Vercel Functions**: Check serverless function logs
- **Database**: Monitor through your Vercel storage dashboard

## 🔄 Updates

To update your deployment:

1. **Make changes to your code**
2. **Push to GitHub**: `git push origin main`
3. **Vercel automatically redeploys**
4. **Run migrations if needed**: `npm run db:migrate`

## 🎯 Success!

Your appointment scheduler is now running on Vercel with your existing PostgreSQL database! 🎉
