#!/bin/bash

# LMS Production Build Script
# This script builds the application for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lms-app"
DOCKER_IMAGE="lms-app"
DOCKER_TAG="latest"
BUILD_DIR="./build"
DIST_DIR="./dist"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18 or later."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18 or later is required. Current version: $(node -v)"
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm."
    fi
    
    # Check if Docker is installed (for containerized builds)
    if ! command -v docker &> /dev/null; then
        warning "Docker is not installed. Containerized builds will be skipped."
    fi
    
    success "Prerequisites check completed"
}

# Clean previous builds
clean_build() {
    log "Cleaning previous builds..."
    
    rm -rf "$BUILD_DIR"
    rm -rf "$DIST_DIR"
    rm -rf .next
    rm -rf node_modules/.cache
    
    success "Previous builds cleaned"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Install production dependencies
    npm ci --only=production
    
    # Install all dependencies for build
    npm ci
    
    success "Dependencies installed"
}

# Run linting and type checking
run_checks() {
    log "Running code quality checks..."
    
    # Run ESLint
    if npm run lint; then
        success "ESLint checks passed"
    else
        error "ESLint checks failed"
    fi
    
    # Run TypeScript type checking
    if npx tsc --noEmit; then
        success "TypeScript type checking passed"
    else
        error "TypeScript type checking failed"
    fi
    
    success "Code quality checks completed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Run unit tests
    if npm run test -- --coverage --watchAll=false; then
        success "Unit tests passed"
    else
        error "Unit tests failed"
    fi
    
    # Run integration tests
    if npm run test:integration -- --watchAll=false; then
        success "Integration tests passed"
    else
        error "Integration tests failed"
    fi
    
    success "All tests passed"
}

# Generate Prisma client
generate_prisma() {
    log "Generating Prisma client..."
    
    npx prisma generate
    
    success "Prisma client generated"
}

# Build the application
build_application() {
    log "Building application..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build Next.js application
    npm run build
    
    # Create build directory
    mkdir -p "$BUILD_DIR"
    
    # Copy built files
    cp -r .next "$BUILD_DIR/"
    cp -r public "$BUILD_DIR/"
    cp -r prisma "$BUILD_DIR/"
    cp package*.json "$BUILD_DIR/"
    cp next.config.js "$BUILD_DIR/" 2>/dev/null || true
    
    success "Application built successfully"
}

# Create Docker image
build_docker_image() {
    if ! command -v docker &> /dev/null; then
        warning "Docker not available, skipping Docker image build"
        return
    fi
    
    log "Building Docker image..."
    
    # Build Docker image
    docker build -t "$DOCKER_IMAGE:$DOCKER_TAG" .
    
    # Tag with timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    docker tag "$DOCKER_IMAGE:$DOCKER_TAG" "$DOCKER_IMAGE:$TIMESTAMP"
    
    success "Docker image built: $DOCKER_IMAGE:$DOCKER_TAG"
    success "Docker image tagged: $DOCKER_IMAGE:$TIMESTAMP"
}

# Create production package
create_production_package() {
    log "Creating production package..."
    
    # Create dist directory
    mkdir -p "$DIST_DIR"
    
    # Copy build files
    cp -r "$BUILD_DIR"/* "$DIST_DIR/"
    
    # Copy deployment files
    cp docker-compose.prod.yml "$DIST_DIR/"
    cp Dockerfile "$DIST_DIR/"
    cp -r nginx "$DIST_DIR/"
    cp -r k8s "$DIST_DIR/"
    cp -r monitoring "$DIST_DIR/"
    cp scripts/deploy-production.sh "$DIST_DIR/"
    cp env.production.example "$DIST_DIR/"
    
    # Create deployment README
    cat > "$DIST_DIR/README.md" << EOF
# LMS Production Deployment

This package contains the built LMS application ready for production deployment.

## Quick Start

1. Copy \`env.production.example\` to \`.env.production\` and configure your environment variables
2. Run \`chmod +x deploy-production.sh\`
3. Run \`./deploy-production.sh\`

## Deployment Options

### Docker Compose (Recommended)
\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Kubernetes
\`\`\`bash
kubectl apply -f k8s/
\`\`\`

### Manual Deployment
1. Install dependencies: \`npm ci --only=production\`
2. Run migrations: \`npx prisma migrate deploy\`
3. Start application: \`npm start\`

## Monitoring

- Grafana Dashboard: http://localhost:3001
- Prometheus Metrics: http://localhost:9090
- Application Health: http://localhost:3000/api/health

## Support

For support and documentation, visit the project repository.
EOF
    
    # Create tarball
    tar -czf "${PROJECT_NAME}-production-$(date +%Y%m%d_%H%M%S).tar.gz" -C "$DIST_DIR" .
    
    success "Production package created in $DIST_DIR"
}

# Show build summary
show_summary() {
    log "Build Summary:"
    echo ""
    echo "Build Directory: $BUILD_DIR"
    echo "Distribution Directory: $DIST_DIR"
    echo "Docker Image: $DOCKER_IMAGE:$DOCKER_TAG"
    echo ""
    echo "Next Steps:"
    echo "1. Review the build in $DIST_DIR"
    echo "2. Configure environment variables"
    echo "3. Deploy using the deployment script"
    echo ""
    echo "Deployment Commands:"
    echo "  Docker Compose: docker-compose -f docker-compose.prod.yml up -d"
    echo "  Kubernetes: kubectl apply -f k8s/"
    echo "  Script: ./deploy-production.sh"
}

# Main build function
main() {
    log "Starting LMS Production Build"
    log "============================="
    
    # Parse command line arguments
    case "${1:-build}" in
        "build")
            check_prerequisites
            clean_build
            install_dependencies
            run_checks
            run_tests
            generate_prisma
            build_application
            build_docker_image
            create_production_package
            show_summary
            success "Production build completed successfully!"
            ;;
        "clean")
            clean_build
            success "Build cleaned successfully!"
            ;;
        "test")
            run_tests
            ;;
        "docker")
            build_docker_image
            ;;
        "package")
            create_production_package
            ;;
        *)
            echo "Usage: $0 {build|clean|test|docker|package}"
            echo ""
            echo "Commands:"
            echo "  build   - Full production build (default)"
            echo "  clean   - Clean build directories"
            echo "  test    - Run tests only"
            echo "  docker  - Build Docker image only"
            echo "  package - Create production package only"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
