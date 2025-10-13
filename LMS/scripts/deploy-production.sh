#!/bin/bash

# LMS Production Deployment Script
# This script handles the complete production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lms-app"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_FILE="./deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file $ENV_FILE not found. Please copy env.production.example to $ENV_FILE and configure it."
    fi
    
    # Check if SSL certificates exist
    if [ ! -f "./ssl/cert.pem" ] || [ ! -f "./ssl/key.pem" ]; then
        warning "SSL certificates not found. Please add your SSL certificates to ./ssl/ directory."
        warning "For development, you can generate self-signed certificates:"
        warning "mkdir -p ssl && openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes"
    fi
    
    success "Prerequisites check completed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p logs/nginx
    mkdir -p ssl
    mkdir -p backups
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    success "Directories created"
}

# Backup existing data
backup_data() {
    log "Creating backup of existing data..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup database if it exists
    if docker ps | grep -q "lms-postgres"; then
        log "Backing up database..."
        docker exec lms-postgres pg_dump -U lms_user lms > "$BACKUP_PATH/database.sql"
        success "Database backup created"
    fi
    
    # Backup uploads directory
    if [ -d "uploads" ]; then
        log "Backing up uploads..."
        cp -r uploads "$BACKUP_PATH/"
        success "Uploads backup created"
    fi
    
    # Backup environment file
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_PATH/"
        success "Environment file backup created"
    fi
    
    success "Backup completed: $BACKUP_PATH"
}

# Build and start services
deploy_services() {
    log "Building and starting services..."
    
    # Pull latest images
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build application
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    # Start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    success "Services started"
}

# Wait for services to be ready
wait_for_services() {
    log "Waiting for services to be ready..."
    
    # Wait for database
    log "Waiting for database..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker exec lms-postgres pg_isready -U lms_user -d lms &> /dev/null; then
            success "Database is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        error "Database failed to start within 60 seconds"
    fi
    
    # Wait for Redis
    log "Waiting for Redis..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker exec lms-redis redis-cli ping &> /dev/null; then
            success "Redis is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        error "Redis failed to start within 30 seconds"
    fi
    
    # Wait for application
    log "Waiting for application..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            success "Application is ready"
            break
        fi
        sleep 5
        timeout=$((timeout - 5))
    done
    
    if [ $timeout -le 0 ]; then
        error "Application failed to start within 120 seconds"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    docker exec lms-app npx prisma migrate deploy
    
    success "Database migrations completed"
}

# Run health checks
health_check() {
    log "Running health checks..."
    
    # Check application health
    if curl -f http://localhost:3000/api/health; then
        success "Application health check passed"
    else
        error "Application health check failed"
    fi
    
    # Check database connection
    if docker exec lms-app npx prisma db pull --schema=./prisma/schema.prisma &> /dev/null; then
        success "Database connection check passed"
    else
        error "Database connection check failed"
    fi
    
    # Check Redis connection
    if docker exec lms-redis redis-cli ping | grep -q "PONG"; then
        success "Redis connection check passed"
    else
        error "Redis connection check failed"
    fi
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo ""
    echo "Services:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo ""
    echo "Application URL: https://localhost"
    echo "Grafana Dashboard: http://localhost:3001"
    echo "Prometheus Metrics: http://localhost:9090"
    echo ""
    echo "Logs:"
    echo "  Application: docker logs lms-app"
    echo "  Nginx: docker logs lms-nginx"
    echo "  Database: docker logs lms-postgres"
    echo "  Redis: docker logs lms-redis"
    echo ""
    echo "Monitoring:"
    echo "  docker stats"
    echo "  docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    ls -t "$BACKUP_DIR"/backup_* 2>/dev/null | tail -n +6 | xargs -r rm -rf
    
    success "Old backups cleaned up"
}

# Main deployment function
main() {
    log "Starting LMS Production Deployment"
    log "=================================="
    
    # Parse command line arguments
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_directories
            backup_data
            deploy_services
            wait_for_services
            run_migrations
            health_check
            show_status
            cleanup_backups
            success "Deployment completed successfully!"
            ;;
        "backup")
            backup_data
            ;;
        "restart")
            log "Restarting services..."
            docker-compose -f "$DOCKER_COMPOSE_FILE" restart
            wait_for_services
            health_check
            success "Services restarted successfully!"
            ;;
        "stop")
            log "Stopping services..."
            docker-compose -f "$DOCKER_COMPOSE_FILE" down
            success "Services stopped successfully!"
            ;;
        "logs")
            docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
            ;;
        "status")
            show_status
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 {deploy|backup|restart|stop|logs|status|health}"
            echo ""
            echo "Commands:"
            echo "  deploy  - Full deployment (default)"
            echo "  backup  - Create backup of current data"
            echo "  restart - Restart all services"
            echo "  stop    - Stop all services"
            echo "  logs    - Show logs from all services"
            echo "  status  - Show deployment status"
            echo "  health  - Run health checks"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
