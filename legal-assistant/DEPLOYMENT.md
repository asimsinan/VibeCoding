# Vercel Deployment Guide

## Environment Variables

Add these to your Vercel project settings:

```
# Database
POSTGRES_URL="postgres://2a5093677537855355e37a9b939a1c2c2bcc3cb3f882213b5052c08f8a990835:sk_okrOml9vmvFf36uQJEnHo@db.prisma.io:5432/postgres?sslmode=require"

DATABASE_URL="postgres://2a5093677537855355e37a9b939a1c2c2bcc3cb3f882213b5052c08f8a990835:sk_okrOml9vmvFf36uQJEnHo@db.prisma.io:5432/postgres?sslmode=require"

PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19va3JPbWw5dm12RmYzNnVRSkVuSG8iLCJhcGlfa2V5IjoiMDFLOE5FUjJKUlBWRkpSQTFON1g2UFdXWkIiLCJ0ZW5hbnRfaWQiOiIyYTUwOTM2Nzc1Mzc4NTUzNTVlMzdhOWI5MzlhMWMyYzJiY2MzY2IzZjg4MjIxM2I1MDUyYzA4ZjhhOTkwODM1IiwiaW50ZXJuYWxfc2VjcmV0IjoiNjk0NmY4ZjAtMmRiMC00YTU5LWI4MzEtMjM0MmQxZTkyM2YyIn0.8nKAPY-ib_J4-E7wLou513-CI0d5_38yWuoyBktZCEk"

# Add your other variables
GEMINI_API_KEY="your-gemini-key"
NEXTAUTH_SECRET="generate-a-secret"
NODE_ENV="production"
```

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Add environment variables from above
   - Deploy

3. **Run Database Migrations**
   ```bash
   # After first deployment, run migrations
   npx prisma migrate deploy
   ```

4. **Domain**
   - Default: kavekaka.vercel.app
   - Custom: Add in Vercel dashboard → Settings → Domains

## Post-Deployment Checklist

- [ ] Database schema pushed to Prisma
- [ ] Environment variables configured
- [ ] Custom domain added (if needed)
- [ ] API routes working
- [ ] File uploads configured with Vercel Blob (optional)

