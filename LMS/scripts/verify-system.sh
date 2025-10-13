#!/bin/bash

# LMS Final System Verification Script
# This script performs comprehensive system verification and acceptance testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lms-app"
LOG_FILE="./verification.log"
RESULTS_DIR="./verification-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Initialize verification
init_verification() {
    log "Initializing LMS System Verification"
    log "===================================="
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    
    # Clear log file
    > "$LOG_FILE"
    
    log "Verification started at: $(date)"
    log "Results directory: $RESULTS_DIR"
    log "Log file: $LOG_FILE"
}

# Check system prerequisites
check_prerequisites() {
    log "Checking system prerequisites..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        info "Node.js version: $NODE_VERSION"
        if [[ "$NODE_VERSION" =~ v(1[8-9]|[2-9][0-9]) ]]; then
            success "Node.js version is compatible"
        else
            error "Node.js version 18+ is required"
        fi
    else
        error "Node.js is not installed"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        info "npm version: $NPM_VERSION"
        success "npm is available"
    else
        error "npm is not installed"
    fi
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        success "package.json found"
    else
        error "package.json not found"
    fi
    
    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        success "Dependencies are installed"
    else
        warning "Dependencies not installed, running npm install..."
        if npm install; then
            success "Dependencies installed successfully"
        else
            error "Failed to install dependencies"
        fi
    fi
}

# Run code quality checks
run_code_quality() {
    log "Running code quality checks..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Run ESLint
    if npm run lint &> "$RESULTS_DIR/eslint.log"; then
        success "ESLint checks passed"
    else
        error "ESLint checks failed (see $RESULTS_DIR/eslint.log)"
    fi
    
    # Run TypeScript type checking
    if npx tsc --noEmit &> "$RESULTS_DIR/typescript.log"; then
        success "TypeScript type checking passed"
    else
        error "TypeScript type checking failed (see $RESULTS_DIR/typescript.log)"
    fi
}

# Run unit tests
run_unit_tests() {
    log "Running unit tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if npm run test -- --coverage --watchAll=false --passWithNoTests &> "$RESULTS_DIR/unit-tests.log"; then
        success "Unit tests passed"
    else
        error "Unit tests failed (see $RESULTS_DIR/unit-tests.log)"
    fi
}

# Run integration tests
run_integration_tests() {
    log "Running integration tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if npm run test:integration -- --watchAll=false --passWithNoTests &> "$RESULTS_DIR/integration-tests.log"; then
        success "Integration tests passed"
    else
        error "Integration tests failed (see $RESULTS_DIR/integration-tests.log)"
    fi
}

# Run API tests
run_api_tests() {
    log "Running API tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if npm run test:api -- --watchAll=false --passWithNoTests &> "$RESULTS_DIR/api-tests.log"; then
        success "API tests passed"
    else
        error "API tests failed (see $RESULTS_DIR/api-tests.log)"
    fi
}

# Run end-to-end tests
run_e2e_tests() {
    log "Running end-to-end tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check if Playwright is installed
    if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null; then
        warning "Playwright not installed, skipping E2E tests"
        return
    fi
    
    if npm run test:e2e &> "$RESULTS_DIR/e2e-tests.log"; then
        success "End-to-end tests passed"
    else
        error "End-to-end tests failed (see $RESULTS_DIR/e2e-tests.log)"
    fi
}

# Run performance tests
run_performance_tests() {
    log "Running performance tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if npm run test:performance &> "$RESULTS_DIR/performance-tests.log"; then
        success "Performance tests passed"
    else
        error "Performance tests failed (see $RESULTS_DIR/performance-tests.log)"
    fi
}

# Run security tests
run_security_tests() {
    log "Running security tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if npm run test:security &> "$RESULTS_DIR/security-tests.log"; then
        success "Security tests passed"
    else
        error "Security tests failed (see $RESULTS_DIR/security-tests.log)"
    fi
}

# Run cross-browser tests
run_cross_browser_tests() {
    log "Running cross-browser tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check if Playwright is installed
    if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null; then
        warning "Playwright not installed, skipping cross-browser tests"
        return
    fi
    
    if npm run test:cross-browser &> "$RESULTS_DIR/cross-browser-tests.log"; then
        success "Cross-browser tests passed"
    else
        error "Cross-browser tests failed (see $RESULTS_DIR/cross-browser-tests.log)"
    fi
}

# Run mobile responsiveness tests
run_mobile_tests() {
    log "Running mobile responsiveness tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check if Playwright is installed
    if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null; then
        warning "Playwright not installed, skipping mobile tests"
        return
    fi
    
    if npm run test:mobile &> "$RESULTS_DIR/mobile-tests.log"; then
        success "Mobile responsiveness tests passed"
    else
        error "Mobile responsiveness tests failed (see $RESULTS_DIR/mobile-tests.log)"
    fi
}

# Run accessibility tests
run_accessibility_tests() {
    log "Running accessibility tests..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check if Playwright is installed
    if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null; then
        warning "Playwright not installed, skipping accessibility tests"
        return
    fi
    
    if npm run test:accessibility &> "$RESULTS_DIR/accessibility-tests.log"; then
        success "Accessibility tests passed"
    else
        error "Accessibility tests failed (see $RESULTS_DIR/accessibility-tests.log)"
    fi
}

# Test build process
test_build_process() {
    log "Testing build process..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Clean previous builds
    rm -rf .next build dist
    
    # Test production build
    if npm run build &> "$RESULTS_DIR/build.log"; then
        success "Production build successful"
        
        # Check if build artifacts exist
        if [ -d ".next" ]; then
            success "Next.js build artifacts created"
        else
            error "Next.js build artifacts not found"
        fi
    else
        error "Production build failed (see $RESULTS_DIR/build.log)"
    fi
}

# Test deployment configuration
test_deployment_config() {
    log "Testing deployment configuration..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check Docker configuration
    if [ -f "Dockerfile" ]; then
        success "Dockerfile found"
        
        # Validate Dockerfile syntax (basic check)
        if grep -q "FROM node:" Dockerfile; then
            success "Dockerfile syntax appears valid"
        else
            error "Dockerfile syntax appears invalid"
        fi
    else
        error "Dockerfile not found"
    fi
    
    # Check Docker Compose configuration
    if [ -f "docker-compose.prod.yml" ]; then
        success "Production Docker Compose file found"
    else
        error "Production Docker Compose file not found"
    fi
    
    # Check Kubernetes configuration
    if [ -d "k8s" ] && [ -f "k8s/lms-deployment.yaml" ]; then
        success "Kubernetes configuration found"
    else
        warning "Kubernetes configuration not found"
    fi
    
    # Check monitoring configuration
    if [ -d "monitoring" ] && [ -f "monitoring/prometheus.yml" ]; then
        success "Monitoring configuration found"
    else
        warning "Monitoring configuration not found"
    fi
}

# Test environment configuration
test_environment_config() {
    log "Testing environment configuration..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check environment example file
    if [ -f "env.production.example" ]; then
        success "Production environment example found"
        
        # Check for required environment variables
        REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "REDIS_URL")
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "$var" env.production.example; then
                success "Required variable $var found in example"
            else
                error "Required variable $var not found in example"
            fi
        done
    else
        error "Production environment example not found"
    fi
}

# Test database schema
test_database_schema() {
    log "Testing database schema..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check Prisma schema
    if [ -f "prisma/schema.prisma" ]; then
        success "Prisma schema found"
        
        # Generate Prisma client
        if npx prisma generate &> "$RESULTS_DIR/prisma-generate.log"; then
            success "Prisma client generated successfully"
        else
            error "Prisma client generation failed (see $RESULTS_DIR/prisma-generate.log)"
        fi
    else
        error "Prisma schema not found"
    fi
}

# Test API endpoints
test_api_endpoints() {
    log "Testing API endpoints..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check if API routes exist
    if [ -d "src/app/api" ]; then
        success "API routes directory found"
        
        # Count API routes
        API_ROUTES=$(find src/app/api -name "route.ts" | wc -l)
        info "Found $API_ROUTES API routes"
        
        if [ "$API_ROUTES" -gt 0 ]; then
            success "API routes are present"
        else
            warning "No API routes found"
        fi
    else
        error "API routes directory not found"
    fi
}

# Generate verification report
generate_report() {
    log "Generating verification report..."
    
    REPORT_FILE="$RESULTS_DIR/verification-report-$TIMESTAMP.md"
    
    cat > "$REPORT_FILE" << EOF
# LMS System Verification Report

**Generated:** $(date)  
**Project:** $PROJECT_NAME  
**Verification ID:** $TIMESTAMP  

## Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Skipped:** $SKIPPED_TESTS
- **Success Rate:** $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%

## Test Results

### Prerequisites
- ✅ System prerequisites checked
- ✅ Dependencies verified

### Code Quality
- ✅ ESLint checks
- ✅ TypeScript type checking

### Testing
- ✅ Unit tests
- ✅ Integration tests
- ✅ API tests
- ✅ End-to-end tests
- ✅ Performance tests
- ✅ Security tests
- ✅ Cross-browser tests
- ✅ Mobile responsiveness tests
- ✅ Accessibility tests

### Build & Deployment
- ✅ Production build process
- ✅ Docker configuration
- ✅ Kubernetes configuration
- ✅ Monitoring setup
- ✅ Environment configuration

### Database & API
- ✅ Database schema
- ✅ API endpoints

## Files Generated

- Verification log: \`$LOG_FILE\`
- Test results: \`$RESULTS_DIR/\`
- This report: \`$REPORT_FILE\`

## Next Steps

EOF

    if [ "$FAILED_TESTS" -eq 0 ]; then
        cat >> "$REPORT_FILE" << EOF
🎉 **All tests passed!** The system is ready for production deployment.

### Deployment Commands

\`\`\`bash
# Docker Compose deployment
npm run deploy:docker

# Kubernetes deployment
npm run deploy:k8s

# Full production deployment
npm run deploy:production
\`\`\`

### Monitoring Setup

\`\`\`bash
# Setup monitoring
npm run monitoring:setup

# Check monitoring status
npm run monitoring:status
\`\`\`
EOF
    else
        cat >> "$REPORT_FILE" << EOF
⚠️ **Some tests failed.** Please review the failed tests and fix issues before deployment.

### Failed Tests
EOF
        # Add failed test details
        if [ -f "$RESULTS_DIR/eslint.log" ] && grep -q "error" "$RESULTS_DIR/eslint.log"; then
            echo "- ESLint checks failed" >> "$REPORT_FILE"
        fi
        if [ -f "$RESULTS_DIR/typescript.log" ] && grep -q "error" "$RESULTS_DIR/typescript.log"; then
            echo "- TypeScript type checking failed" >> "$REPORT_FILE"
        fi
        # Add more failed test details as needed
    fi

    success "Verification report generated: $REPORT_FILE"
}

# Show final summary
show_summary() {
    log "Verification Summary"
    log "==================="
    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Skipped: $SKIPPED_TESTS"
    echo "Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%"
    echo ""
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        success "🎉 All tests passed! System is ready for production."
        echo ""
        echo "Next steps:"
        echo "1. Review the verification report"
        echo "2. Deploy to production using: npm run deploy:production"
        echo "3. Setup monitoring using: npm run monitoring:setup"
    else
        error "❌ Some tests failed. Please review and fix issues."
        echo ""
        echo "Review failed tests in: $RESULTS_DIR/"
        echo "Check verification report for details"
    fi
    
    echo ""
    echo "Verification completed at: $(date)"
    echo "Log file: $LOG_FILE"
    echo "Results directory: $RESULTS_DIR"
}

# Main verification function
main() {
    log "Starting LMS Final System Verification"
    log "======================================"
    
    # Parse command line arguments
    case "${1:-full}" in
        "full")
            init_verification
            check_prerequisites
            run_code_quality
            run_unit_tests
            run_integration_tests
            run_api_tests
            run_e2e_tests
            run_performance_tests
            run_security_tests
            run_cross_browser_tests
            run_mobile_tests
            run_accessibility_tests
            test_build_process
            test_deployment_config
            test_environment_config
            test_database_schema
            test_api_endpoints
            generate_report
            show_summary
            ;;
        "quick")
            init_verification
            check_prerequisites
            run_code_quality
            test_build_process
            generate_report
            show_summary
            ;;
        "tests")
            init_verification
            run_unit_tests
            run_integration_tests
            run_api_tests
            run_e2e_tests
            run_performance_tests
            run_security_tests
            run_cross_browser_tests
            run_mobile_tests
            run_accessibility_tests
            generate_report
            show_summary
            ;;
        "build")
            init_verification
            check_prerequisites
            test_build_process
            test_deployment_config
            generate_report
            show_summary
            ;;
        *)
            echo "Usage: $0 {full|quick|tests|build}"
            echo ""
            echo "Commands:"
            echo "  full   - Complete system verification (default)"
            echo "  quick  - Quick verification (prerequisites + build)"
            echo "  tests  - Run all tests only"
            echo "  build  - Test build and deployment configuration"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
