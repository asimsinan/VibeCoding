# Deployment Guide - Turkish Legal Assistant

## Overview
This guide covers deploying the Turkish Legal Assistant application using Docker and Docker Compose.

## Prerequisites
- Docker installed (version 20.10+)
- Docker Compose installed (version 1.29+)
- PostgreSQL database (included in docker-compose)
- Environment variables configured

## Deployment Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd legal-assistant
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env.production

# Edit .env.production and set your values
nano .env.production
```

**Required Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret key for NextAuth
- `GEMINI_API_KEY` - Google Gemini API key

### 3. Build and Start Services
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

**Manual Deployment**:
```bash
# Build Docker image
docker build -t legal-assistant:latest .

# Start services
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma migrate deploy
```

### 4. Verify Deployment
```bash
# Check application status
curl http://localhost:3000

# Check logs
docker-compose logs -f app

# Check database connection
docker-compose exec postgres psql -U legaladmin -d legal_assistant -c "SELECT 1;"
```

## Docker Services

### Application Service
- **Image**: legal-assistant:latest
- **Port**: 3000
- **Health Check**: Built-in Next.js health endpoint

### PostgreSQL Service
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Volume**: postgres_data (persistent storage)
- **Health Check**: pg_isready

## Configuration

### Port Configuration
- Application: 3000
- Database: 5432

### Volume Mounts
- `postgres_data`: Database persistence
- `uploads_data`: File uploads

### Network
- `legal-assistant-network`: Bridge network for inter-service communication

## Environment Setup

### Development
```bash
docker-compose up
```

### Production
```bash
NODE_ENV=production docker-compose up -d
```

## Common Commands

### View Logs
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Database Backup
```bash
docker-compose exec postgres pg_dump -U legaladmin legal_assistant > backup.sql
```

### Database Restore
```bash
docker-compose exec -T postgres psql -U legaladmin legal_assistant < backup.sql
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Check database connection
docker-compose exec app npx prisma db pull
```

### Database Connection Issues
```bash
# Check database status
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Port Conflicts
Edit `docker-compose.yml` and change port mappings:
```yaml
ports:
  - "3001:3000"  # Different host port
```

## Scaling

### Multiple Instances
```bash
docker-compose up -d --scale app=3
```

### Load Balancer
Use nginx or traefik for load balancing.

## Security

### HTTPS Setup
Use reverse proxy (nginx/traefik) with SSL certificates.

### Database Security
- Change default passwords
- Use strong passwords in .env.production
- Enable SSL/TLS for database connections

### Firewall
```bash
# Allow necessary ports
sudo ufw allow 3000/tcp
sudo ufw allow 5432/tcp
```

## Monitoring

### Health Checks
```bash
# Application health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready
```

### Logs
- Application logs in container
- Database logs in postgres_data volume

## Backup Strategy

### Automated Backups
```bash
# Add to crontab
0 2 * * * docker-compose exec postgres pg_dump -U legaladmin legal_assistant > /backups/$(date +\%Y\%m\%d).sql
```

### Data Persistence
- Database data: `postgres_data` volume
- File uploads: `uploads_data` volume

## Rollback

### Previous Version
```bash
# Stop current services
docker-compose down

# Pull previous image
docker pull legal-assistant:v1.0.0

# Start with previous version
docker tag legal-assistant:v1.0.0 legal-assistant:latest
docker-compose up -d
```

## Summary

✅ **Dockerfile**: Multi-stage build optimized for production  
✅ **docker-compose.yml**: PostgreSQL + Next.js services configured  
✅ **CI/CD Pipeline**: GitHub Actions workflow  
✅ **Deployment Scripts**: Automated deployment script  
✅ **Environment Templates**: .env.example and .env.production  

**Deployment Status**: ✅ READY FOR PRODUCTION
