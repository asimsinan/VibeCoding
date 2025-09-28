#!/bin/bash

# Production Deployment Script for Mental Health Journal App
# This script handles the complete deployment process including validation, building, and deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="moodtracker"
PRODUCTION_URL="https://moodtracker.app"
BACKUP_DIR="./backups"
LOG_FILE="./deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ and try again."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18+ is required. Current version: $(node -v)"
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm and try again."
    fi
    
    # Check if required environment variables are set
    if [ -z "$NEXT_PUBLIC_API_BASE_URL" ]; then
        warning "NEXT_PUBLIC_API_BASE_URL is not set. Using default value."
        export NEXT_PUBLIC_API_BASE_URL="$PRODUCTION_URL/api"
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup current build
    if [ -d ".next" ]; then
        cp -r .next "$BACKUP_PATH/"
        success "Build backup created: $BACKUP_PATH"
    fi
    
    # Backup environment files
    if [ -f ".env.production" ]; then
        cp .env.production "$BACKUP_PATH/"
    fi
    
    # Backup package files
    cp package*.json "$BACKUP_PATH/"
    
    success "Backup created: $BACKUP_PATH"
}

# Run security audit
run_security_audit() {
    log "Running security audit..."
    
    if [ -f "scripts/security-audit.js" ]; then
        node scripts/security-audit.js
        if [ $? -eq 0 ]; then
            success "Security audit passed"
        else
            warning "Security audit found issues. Please review before deploying."
        fi
    else
        warning "Security audit script not found. Skipping security check."
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Clean install for production
    rm -rf node_modules package-lock.json
    npm install --production=false
    
    if [ $? -eq 0 ]; then
        success "Dependencies installed successfully"
    else
        error "Failed to install dependencies"
    fi
}

# Run tests
run_tests() {
    log "Running test suite..."
    
    # Run unit tests
    npm run test:unit
    if [ $? -ne 0 ]; then
        error "Unit tests failed"
    fi
    
    # Run integration tests
    npm run test:integration
    if [ $? -ne 0 ]; then
        error "Integration tests failed"
    fi
    
    # Run E2E tests
    npm run test:e2e
    if [ $? -ne 0 ]; then
        error "E2E tests failed"
    fi
    
    success "All tests passed"
}

# Type checking
run_type_check() {
    log "Running TypeScript type check..."
    
    npm run type-check
    if [ $? -eq 0 ]; then
        success "Type check passed"
    else
        error "Type check failed"
    fi
}

# Linting
run_linting() {
    log "Running ESLint..."
    
    npm run lint
    if [ $? -eq 0 ]; then
        success "Linting passed"
    else
        error "Linting failed"
    fi
}

# Build application
build_application() {
    log "Building application for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    npm run build
    if [ $? -eq 0 ]; then
        success "Application built successfully"
    else
        error "Build failed"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    log "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log "Installing Vercel CLI..."
        npm install -g vercel@latest
    fi
    
    # Deploy to production
    vercel --prod --yes
    if [ $? -eq 0 ]; then
        success "Deployed to Vercel successfully"
    else
        error "Vercel deployment failed"
    fi
}

# Deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker and try again."
    fi
    
    # Build Docker image
    docker build -t "$APP_NAME:latest" .
    if [ $? -ne 0 ]; then
        error "Docker build failed"
    fi
    
    # Stop existing container
    docker stop "$APP_NAME" 2>/dev/null || true
    docker rm "$APP_NAME" 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name "$APP_NAME" \
        -p 3000:3000 \
        --env-file .env.production \
        --restart unless-stopped \
        "$APP_NAME:latest"
    
    if [ $? -eq 0 ]; then
        success "Docker deployment successful"
    else
        error "Docker deployment failed"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f -s "$PRODUCTION_URL/api/health" > /dev/null; then
        success "Health check passed - Application is responding"
    else
        error "Health check failed - Application is not responding"
    fi
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."
    
    # Clear CDN cache (if using Vercel)
    if command -v vercel &> /dev/null; then
        vercel --prod --force
    fi
    
    # Send deployment notification (if webhook is configured)
    if [ -n "$DEPLOYMENT_WEBHOOK_URL" ]; then
        curl -X POST "$DEPLOYMENT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚀 Mental Health Journal App deployed successfully to production\"}"
    fi
    
    success "Post-deployment tasks completed"
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -n1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_PATH="$BACKUP_DIR/$LATEST_BACKUP"
        
        # Restore build
        if [ -d "$BACKUP_PATH/.next" ]; then
            rm -rf .next
            cp -r "$BACKUP_PATH/.next" .
        fi
        
        # Restore environment
        if [ -f "$BACKUP_PATH/.env.production" ]; then
            cp "$BACKUP_PATH/.env.production" .
        fi
        
        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Main deployment function
main() {
    log "Starting production deployment for Mental Health Journal App..."
    
    # Parse command line arguments
    DEPLOYMENT_METHOD="vercel"
    SKIP_TESTS=false
    FORCE_DEPLOY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --method)
                DEPLOYMENT_METHOD="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            --rollback)
                rollback
                exit 0
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --method METHOD     Deployment method (vercel|docker) [default: vercel]"
                echo "  --skip-tests        Skip running tests"
                echo "  --force             Force deployment even if tests fail"
                echo "  --rollback          Rollback to previous version"
                echo "  --help              Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Run deployment steps
    check_prerequisites
    create_backup
    run_security_audit
    
    if [ "$SKIP_TESTS" = false ]; then
        install_dependencies
        run_tests
        run_type_check
        run_linting
    else
        warning "Skipping tests as requested"
        install_dependencies
    fi
    
    build_application
    
    case $DEPLOYMENT_METHOD in
        vercel)
            deploy_vercel
            ;;
        docker)
            deploy_docker
            ;;
        *)
            error "Unknown deployment method: $DEPLOYMENT_METHOD"
            ;;
    esac
    
    health_check
    post_deployment
    
    success "🎉 Production deployment completed successfully!"
    log "Application is available at: $PRODUCTION_URL"
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"