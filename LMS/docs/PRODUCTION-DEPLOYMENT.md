# Production Deployment Guide

This guide provides comprehensive instructions for deploying the Multi-Tenant Learning Management System to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
  - [Docker Compose (Recommended)](#docker-compose-recommended)
  - [Kubernetes](#kubernetes)
  - [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Security Considerations](#security-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **CPU**: 2+ cores (4+ recommended for production)
- **RAM**: 4GB+ (8GB+ recommended for production)
- **Storage**: 50GB+ SSD storage
- **Network**: Stable internet connection

### Software Requirements

- **Docker**: 20.10+ (for containerized deployment)
- **Docker Compose**: 2.0+ (for containerized deployment)
- **Kubernetes**: 1.20+ (for Kubernetes deployment)
- **Node.js**: 18+ (for manual deployment)
- **PostgreSQL**: 13+ (for manual database setup)
- **Redis**: 6+ (for manual cache setup)

### SSL Certificates

- Valid SSL certificates for your domain
- For development: Self-signed certificates are acceptable
- For production: Use certificates from a trusted CA (Let's Encrypt recommended)

## Deployment Options

### Docker Compose (Recommended)

Docker Compose provides the easiest and most reliable deployment method for most production environments.

#### Quick Start

1. **Clone and prepare the repository**:
   ```bash
   git clone <repository-url>
   cd lms
   ```

2. **Configure environment variables**:
   ```bash
   cp env.production.example .env.production
   # Edit .env.production with your actual values
   ```

3. **Generate SSL certificates** (if needed):
   ```bash
   mkdir -p ssl
   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
   ```

4. **Deploy using the deployment script**:
   ```bash
   chmod +x scripts/deploy-production.sh
   ./scripts/deploy-production.sh
   ```

#### Manual Docker Compose Deployment

1. **Build and start services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Check service status**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **View logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

#### Services Included

- **lms-app**: Main application
- **postgres**: PostgreSQL database
- **redis**: Redis cache
- **nginx**: Reverse proxy and load balancer
- **prometheus**: Metrics collection
- **grafana**: Monitoring dashboard

### Kubernetes

For large-scale deployments or cloud environments, Kubernetes provides better scalability and management.

#### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Helm (optional, for easier management)

#### Deployment Steps

1. **Create namespace**:
   ```bash
   kubectl create namespace lms-production
   ```

2. **Create secrets**:
   ```bash
   kubectl create secret generic lms-secrets \
     --from-literal=DATABASE_URL="postgresql://user:pass@postgres:5432/lms" \
     --from-literal=NEXTAUTH_SECRET="your-secret" \
     --namespace=lms-production
   ```

3. **Deploy application**:
   ```bash
   kubectl apply -f k8s/lms-deployment.yaml
   ```

4. **Check deployment status**:
   ```bash
   kubectl get pods -n lms-production
   kubectl get services -n lms-production
   ```

#### Scaling

```bash
# Scale horizontally
kubectl scale deployment lms-app --replicas=5 -n lms-production

# Enable auto-scaling
kubectl apply -f k8s/lms-hpa.yaml
```

### Manual Deployment

For environments where containers are not suitable or for development purposes.

#### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Nginx (optional, for reverse proxy)

#### Deployment Steps

1. **Install dependencies**:
   ```bash
   npm ci --only=production
   ```

2. **Set up database**:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Build application**:
   ```bash
   npm run build
   ```

4. **Start application**:
   ```bash
   npm start
   ```

## Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Cache
REDIS_URL="redis://host:6379"

# Email
SMTP_HOST="smtp.provider.com"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-password"

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"
```

### Optional Environment Variables

```bash
# Monitoring
GRAFANA_PASSWORD="your-grafana-password"

# Security
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="your-encryption-key"

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_FILE_UPLOADS=true

# Performance
CACHE_TTL=3600
SESSION_TIMEOUT=86400000
```

## Security Considerations

### SSL/TLS Configuration

- Use strong SSL/TLS configurations
- Enable HSTS headers
- Use modern cipher suites
- Regular certificate renewal

### Database Security

- Use strong passwords
- Enable SSL connections
- Regular security updates
- Backup encryption

### Application Security

- Regular dependency updates
- Security headers implementation
- Rate limiting
- Input validation
- SQL injection prevention

### Network Security

- Firewall configuration
- VPN access for admin functions
- DDoS protection
- Intrusion detection

## Monitoring and Logging

### Application Monitoring

- **Health Checks**: `/api/health` endpoint
- **Metrics**: Prometheus metrics at `/api/metrics`
- **Logs**: Structured JSON logging

### Infrastructure Monitoring

- **System Metrics**: CPU, memory, disk usage
- **Database Metrics**: Connection pools, query performance
- **Cache Metrics**: Hit rates, memory usage
- **Network Metrics**: Bandwidth, latency

### Alerting

Configure alerts for:
- High CPU/memory usage
- Database connection issues
- Application errors
- SSL certificate expiration
- Disk space low

### Log Management

- Centralized logging with ELK stack
- Log rotation and retention policies
- Security event logging
- Performance monitoring

## Backup and Recovery

### Database Backups

```bash
# Automated daily backups
pg_dump -h localhost -U lms_user lms > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h localhost -U lms_user lms < backup_20231201.sql
```

### File Backups

- Regular backup of uploads directory
- S3 bucket versioning
- Cross-region replication

### Recovery Procedures

1. **Database Recovery**:
   - Stop application
   - Restore database from backup
   - Run migrations if needed
   - Restart application

2. **Full System Recovery**:
   - Provision new infrastructure
   - Restore database
   - Restore files
   - Update DNS
   - Verify functionality

## Scaling

### Horizontal Scaling

- Load balancer configuration
- Multiple application instances
- Database read replicas
- Cache clustering

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Implement caching strategies
- CDN integration

### Auto-scaling

- Kubernetes HPA
- Cloud provider auto-scaling
- Database connection pooling
- Cache warming strategies

## Troubleshooting

### Common Issues

1. **Application won't start**:
   - Check environment variables
   - Verify database connectivity
   - Check port availability
   - Review application logs

2. **Database connection errors**:
   - Verify database credentials
   - Check network connectivity
   - Review database logs
   - Test connection manually

3. **Performance issues**:
   - Monitor resource usage
   - Check database query performance
   - Review cache hit rates
   - Analyze application logs

4. **SSL certificate issues**:
   - Verify certificate validity
   - Check certificate chain
   - Review Nginx configuration
   - Test SSL configuration

### Debugging Commands

```bash
# Check application status
curl -f http://localhost:3000/api/health

# View application logs
docker logs lms-app

# Check database connectivity
docker exec lms-postgres pg_isready

# Test Redis connectivity
docker exec lms-redis redis-cli ping

# Check Nginx status
docker exec lms-nginx nginx -t

# View system resources
docker stats
```

### Support

For additional support:
- Check application logs
- Review monitoring dashboards
- Consult documentation
- Contact support team

## Maintenance

### Regular Tasks

- **Daily**: Monitor system health
- **Weekly**: Review logs and metrics
- **Monthly**: Security updates
- **Quarterly**: Performance optimization

### Updates

- **Application Updates**: Follow semantic versioning
- **Dependency Updates**: Regular security patches
- **Infrastructure Updates**: OS and container updates
- **Database Updates**: Schema migrations

### Performance Optimization

- Database query optimization
- Cache tuning
- CDN configuration
- Resource monitoring
