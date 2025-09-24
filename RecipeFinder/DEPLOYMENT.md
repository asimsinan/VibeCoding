# Recipe Finder App - Vercel Deployment Guide

This guide will help you deploy the Recipe Finder app to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com) (free tier available)
- [GitHub account](https://github.com) (if not already connected)
- Node.js 18+ installed locally
- Git installed locally

## Pre-Deployment Setup

### 1. Prepare Your Repository

Make sure your code is committed to a Git repository:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Recipe Finder App"

# Create a GitHub repository and push
git remote add origin https://github.com/yourusername/recipe-finder-app.git
git push -u origin main
```

### 2. Build the Application

Before deploying, ensure the TypeScript code is compiled:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test the build locally
npm start
```

## Vercel Deployment

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository containing your Recipe Finder app

3. **Configure Project Settings**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `./` (leave as default)
   - **Install Command**: `npm install`

4. **Environment Variables**
   Add these environment variables in the Vercel dashboard:
   ```
   NODE_ENV=production
   CORS_ORIGINS=https://your-app-name.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete
   - Your app will be available at `https://your-app-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Directory**
   ```bash
   # Navigate to your project directory
   cd /path/to/recipe-finder-app

   # Deploy
   vercel

   # Follow the prompts:
   # - Set up and deploy? Y
   # - Which scope? (select your account)
   # - Link to existing project? N
   # - Project name: recipe-finder-app
   # - Directory: ./
   # - Override settings? N
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add NODE_ENV
   # Enter: production

   vercel env add CORS_ORIGINS
   # Enter: https://your-app-name.vercel.app
   ```

5. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Update CORS Origins

After deployment, update the `CORS_ORIGINS` environment variable in Vercel:

1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Update `CORS_ORIGINS` with your actual Vercel domain:
   ```
   https://your-app-name.vercel.app,https://www.your-app-name.vercel.app
   ```

### 2. Test Your Deployment

1. **Visit your app**: `https://your-app-name.vercel.app`
2. **Test search functionality**: Try searching for ingredients
3. **Test API endpoints**: 
   - `https://your-app-name.vercel.app/health`
   - `https://your-app-name.vercel.app/api/v1/recipes/search`

### 3. Custom Domain (Optional)

If you have a custom domain:

1. Go to Vercel dashboard → Project Settings → Domains
2. Add your custom domain
3. Update `CORS_ORIGINS` environment variable to include your custom domain
4. Redeploy the application

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure all dependencies are in `package.json`
   - Check that TypeScript compilation succeeds locally
   - Verify Node.js version compatibility

2. **CORS Errors**
   - Update `CORS_ORIGINS` environment variable
   - Ensure your domain is included in the CORS origins list

3. **Database Issues**
   - SQLite database is created automatically
   - Sample data is loaded on first run
   - Database persists between deployments

4. **Static Files Not Loading**
   - Ensure `public` folder is in the root directory
   - Check that static file serving is configured correctly

### Debugging

1. **Check Vercel Logs**
   - Go to Vercel dashboard → Functions tab
   - View function logs for errors

2. **Test Locally with Production Settings**
   ```bash
   NODE_ENV=production npm start
   ```

3. **Verify Environment Variables**
   ```bash
   vercel env ls
   ```

## Performance Optimization

### 1. Enable Compression
The app already includes compression middleware for better performance.

### 2. Database Optimization
- SQLite database is optimized for read-heavy workloads
- Consider upgrading to a managed database for high traffic

### 3. Caching
- Implement Redis caching for frequently accessed recipes
- Use CDN for static assets

## Monitoring and Analytics

### 1. Vercel Analytics
- Enable Vercel Analytics in your project settings
- Monitor performance and usage

### 2. Error Tracking
- Consider adding error tracking (Sentry, LogRocket, etc.)
- Monitor API errors and user experience

## Security Considerations

### 1. Environment Variables
- Never commit sensitive data to version control
- Use Vercel's environment variable system

### 2. CORS Configuration
- Only allow necessary origins
- Regularly review and update CORS settings

### 3. Rate Limiting
- The app includes rate limiting middleware
- Monitor for abuse and adjust limits as needed

## Scaling

### 1. Vercel Pro Features
- Upgrade to Vercel Pro for higher limits
- Enable serverless functions scaling

### 2. Database Scaling
- Consider migrating to PostgreSQL or MongoDB
- Implement database connection pooling

### 3. CDN
- Vercel automatically provides CDN for static assets
- Consider additional CDN for global performance

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Recipe Finder App Issues**: Create an issue in your GitHub repository

---

**Happy Deploying! 🚀**

Your Recipe Finder app should now be live and accessible to users worldwide!
