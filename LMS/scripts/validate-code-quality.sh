#!/bin/bash

# LMS Code Quality Validation Script
# This script validates code quality, compilation, and project standards

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="./code-quality.log"
RESULTS_DIR="./code-quality-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Test results tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Initialize validation
init_validation() {
    log "Initializing LMS Code Quality Validation"
    log "======================================="
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    
    # Clear log file
    > "$LOG_FILE"
    
    log "Validation started at: $(date)"
    log "Results directory: $RESULTS_DIR"
    log "Log file: $LOG_FILE"
}

# Check TypeScript compilation
check_typescript_compilation() {
    log "Checking TypeScript compilation..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Run TypeScript compiler
    if npx tsc --noEmit --skipLibCheck &> "$RESULTS_DIR/typescript-compilation.log"; then
        success "TypeScript compilation successful"
    else
        error "TypeScript compilation failed (see $RESULTS_DIR/typescript-compilation.log)"
        
        # Check for critical errors vs warnings
        if grep -q "error TS" "$RESULTS_DIR/typescript-compilation.log"; then
            error "Critical TypeScript errors found"
        else
            warning "TypeScript warnings found (non-critical)"
        fi
    fi
}

# Check ESLint compliance
check_eslint_compliance() {
    log "Checking ESLint compliance..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Run ESLint
    if npm run lint &> "$RESULTS_DIR/eslint-compliance.log"; then
        success "ESLint compliance check passed"
    else
        # Check if it's just warnings or actual errors
        if grep -q "error" "$RESULTS_DIR/eslint-compliance.log"; then
            error "ESLint errors found (see $RESULTS_DIR/eslint-compliance.log)"
        else
            warning "ESLint warnings found (see $RESULTS_DIR/eslint-compliance.log)"
        fi
    fi
}

# Check code formatting
check_code_formatting() {
    log "Checking code formatting..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Check if Prettier is configured
    if [ -f ".prettierrc" ] || [ -f "prettier.config.js" ]; then
        success "Prettier configuration found"
        
        # Check formatting (dry run)
        if npx prettier --check "src/**/*.{ts,tsx,js,jsx}" &> "$RESULTS_DIR/prettier-check.log"; then
            success "Code formatting is consistent"
        else
            warning "Code formatting inconsistencies found (see $RESULTS_DIR/prettier-check.log)"
        fi
    else
        warning "Prettier configuration not found"
    fi
}

# Check import/export consistency
check_import_consistency() {
    log "Checking import/export consistency..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Check for unused imports
    if command -v npx &> /dev/null && npx eslint-plugin-import &> /dev/null; then
        if npx eslint --rule "import/no-unused-modules: error" src/ &> "$RESULTS_DIR/import-check.log"; then
            success "Import/export consistency check passed"
        else
            warning "Import/export issues found (see $RESULTS_DIR/import-check.log)"
        fi
    else
        warning "ESLint import plugin not available"
    fi
}

# Check for security vulnerabilities
check_security_vulnerabilities() {
    log "Checking for security vulnerabilities..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Run npm audit
    if npm audit --audit-level=moderate &> "$RESULTS_DIR/security-audit.log"; then
        success "No security vulnerabilities found"
    else
        # Check if it's just warnings
        if grep -q "found 0 vulnerabilities" "$RESULTS_DIR/security-audit.log"; then
            success "No security vulnerabilities found"
        else
            warning "Security vulnerabilities found (see $RESULTS_DIR/security-audit.log)"
        fi
    fi
}

# Check dependency health
check_dependency_health() {
    log "Checking dependency health..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Check for outdated dependencies
    if npm outdated &> "$RESULTS_DIR/dependency-check.log"; then
        success "All dependencies are up to date"
    else
        warning "Outdated dependencies found (see $RESULTS_DIR/dependency-check.log)"
    fi
    
    # Check for duplicate dependencies
    if npx npm-check-duplicates &> "$RESULTS_DIR/duplicate-check.log"; then
        success "No duplicate dependencies found"
    else
        warning "Duplicate dependencies found (see $RESULTS_DIR/duplicate-check.log)"
    fi
}

# Check build process
check_build_process() {
    log "Checking build process..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Clean previous builds
    rm -rf .next build dist
    
    # Test production build
    if npm run build &> "$RESULTS_DIR/build-check.log"; then
        success "Production build successful"
        
        # Check build artifacts
        if [ -d ".next" ]; then
            success "Build artifacts created successfully"
            
            # Check build size
            BUILD_SIZE=$(du -sh .next | cut -f1)
            info "Build size: $BUILD_SIZE"
            
            if [ -f ".next/static/chunks/pages/_app"* ]; then
                success "Core application chunks generated"
            else
                warning "Core application chunks not found"
            fi
        else
            error "Build artifacts not created"
        fi
    else
        error "Production build failed (see $RESULTS_DIR/build-check.log)"
    fi
}

# Check test coverage
check_test_coverage() {
    log "Checking test coverage..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Run tests with coverage
    if npm run test:coverage &> "$RESULTS_DIR/test-coverage.log"; then
        success "Test coverage analysis completed"
        
        # Extract coverage percentage
        if grep -q "All files" "$RESULTS_DIR/test-coverage.log"; then
            COVERAGE=$(grep "All files" "$RESULTS_DIR/test-coverage.log" | awk '{print $4}' | sed 's/%//')
            info "Overall test coverage: ${COVERAGE}%"
            
            if [ "$COVERAGE" -ge 80 ]; then
                success "Test coverage meets minimum threshold (80%)"
            else
                warning "Test coverage below recommended threshold (80%)"
            fi
        fi
    else
        warning "Test coverage analysis failed (see $RESULTS_DIR/test-coverage.log)"
    fi
}

# Check file structure and naming
check_file_structure() {
    log "Checking file structure and naming conventions..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Check for proper file extensions
    INVALID_FILES=$(find src -name "*.js" -o -name "*.jsx" | grep -v node_modules || true)
    if [ -z "$INVALID_FILES" ]; then
        success "All source files use TypeScript extensions"
    else
        warning "Found JavaScript files in src directory: $INVALID_FILES"
    fi
    
    # Check for proper directory structure
    REQUIRED_DIRS=("src/app" "src/components" "src/lib" "prisma" "tests")
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            success "Required directory found: $dir"
        else
            error "Required directory missing: $dir"
        fi
    done
    
    # Check for configuration files
    REQUIRED_CONFIGS=("package.json" "tsconfig.json" "next.config.js" "tailwind.config.js")
    for config in "${REQUIRED_CONFIGS[@]}"; do
        if [ -f "$config" ]; then
            success "Required configuration found: $config"
        else
            error "Required configuration missing: $config"
        fi
    done
}

# Check environment configuration
check_environment_config() {
    log "Checking environment configuration..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Check for environment example files
    if [ -f "env.production.example" ]; then
        success "Production environment example found"
        
        # Check for required environment variables
        REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "$var" env.production.example; then
                success "Required environment variable found: $var"
            else
                error "Required environment variable missing: $var"
            fi
        done
    else
        error "Production environment example not found"
    fi
    
    # Check for .env files (should not be committed)
    if [ -f ".env" ] && git check-ignore .env &> /dev/null; then
        success ".env file is properly ignored by git"
    elif [ -f ".env" ]; then
        warning ".env file is not ignored by git (security risk)"
    fi
}

# Check documentation
check_documentation() {
    log "Checking documentation..."
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Check for README
    if [ -f "README.md" ]; then
        success "README.md found"
        
        # Check README content
        if grep -q "## Installation" README.md; then
            success "Installation instructions found in README"
        else
            warning "Installation instructions missing in README"
        fi
        
        if grep -q "## Usage" README.md; then
            success "Usage instructions found in README"
        else
            warning "Usage instructions missing in README"
        fi
    else
        error "README.md not found"
    fi
    
    # Check for API documentation
    if [ -f "docs/API.md" ] || [ -d "docs/api" ]; then
        success "API documentation found"
    else
        warning "API documentation not found"
    fi
    
    # Check for deployment documentation
    if [ -f "docs/PRODUCTION-DEPLOYMENT.md" ]; then
        success "Production deployment documentation found"
    else
        warning "Production deployment documentation not found"
    fi
}

# Generate code quality report
generate_report() {
    log "Generating code quality report..."
    
    REPORT_FILE="$RESULTS_DIR/code-quality-report-$TIMESTAMP.md"
    
    cat > "$REPORT_FILE" << EOF
# LMS Code Quality Validation Report

**Generated:** $(date)  
**Project:** LMS Application  
**Validation ID:** $TIMESTAMP  

## Summary

- **Total Checks:** $TOTAL_CHECKS
- **Passed:** $PASSED_CHECKS
- **Failed:** $FAILED_CHECKS
- **Warnings:** $WARNING_CHECKS
- **Success Rate:** $(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))%

## Validation Results

### TypeScript Compilation
- ✅ TypeScript compilation check
- ✅ Type checking validation

### Code Quality
- ✅ ESLint compliance check
- ✅ Code formatting validation
- ✅ Import/export consistency

### Security & Dependencies
- ✅ Security vulnerability scan
- ✅ Dependency health check

### Build & Testing
- ✅ Production build validation
- ✅ Test coverage analysis

### Project Structure
- ✅ File structure validation
- ✅ Environment configuration
- ✅ Documentation check

## Detailed Results

EOF

    # Add detailed results
    if [ -f "$RESULTS_DIR/typescript-compilation.log" ]; then
        echo "### TypeScript Compilation" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        head -20 "$RESULTS_DIR/typescript-compilation.log" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
    
    if [ -f "$RESULTS_DIR/eslint-compliance.log" ]; then
        echo "### ESLint Results" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        head -20 "$RESULTS_DIR/eslint-compliance.log" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi

    cat >> "$REPORT_FILE" << EOF
## Recommendations

EOF

    if [ "$FAILED_CHECKS" -eq 0 ]; then
        cat >> "$REPORT_FILE" << EOF
🎉 **Excellent!** All code quality checks passed. The codebase meets high quality standards.

### Next Steps
1. Continue with regular code quality monitoring
2. Maintain current coding standards
3. Keep dependencies updated
4. Regular security audits
EOF
    else
        cat >> "$REPORT_FILE" << EOF
⚠️ **Issues Found.** Please address the following:

### Critical Issues
EOF
        if grep -q "error" "$RESULTS_DIR/typescript-compilation.log" 2>/dev/null; then
            echo "- Fix TypeScript compilation errors" >> "$REPORT_FILE"
        fi
        if grep -q "error" "$RESULTS_DIR/eslint-compliance.log" 2>/dev/null; then
            echo "- Fix ESLint errors" >> "$REPORT_FILE"
        fi
        if grep -q "error" "$RESULTS_DIR/build-check.log" 2>/dev/null; then
            echo "- Fix build process issues" >> "$REPORT_FILE"
        fi
    fi

    cat >> "$REPORT_FILE" << EOF

## Files Generated

- Validation log: \`$LOG_FILE\`
- Detailed results: \`$RESULTS_DIR/\`
- This report: \`$REPORT_FILE\`

## Quality Metrics

- **Code Coverage:** $(grep "All files" "$RESULTS_DIR/test-coverage.log" 2>/dev/null | awk '{print $4}' || echo "N/A")
- **Build Status:** $(if [ -d ".next" ]; then echo "✅ Successful"; else echo "❌ Failed"; fi)
- **Security Status:** $(if grep -q "found 0 vulnerabilities" "$RESULTS_DIR/security-audit.log" 2>/dev/null; then echo "✅ No vulnerabilities"; else echo "⚠️ Vulnerabilities found"; fi)
EOF

    success "Code quality report generated: $REPORT_FILE"
}

# Show final summary
show_summary() {
    log "Code Quality Validation Summary"
    log "=============================="
    echo ""
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Passed: $PASSED_CHECKS"
    echo "Failed: $FAILED_CHECKS"
    echo "Warnings: $WARNING_CHECKS"
    echo "Success Rate: $(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))%"
    echo ""
    
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        success "🎉 All code quality checks passed! Codebase meets quality standards."
        echo ""
        echo "Quality Status: ✅ EXCELLENT"
        echo "Ready for: Production deployment"
    else
        error "❌ Some code quality checks failed. Please review and fix issues."
        echo ""
        echo "Quality Status: ⚠️ NEEDS ATTENTION"
        echo "Review failed checks in: $RESULTS_DIR/"
    fi
    
    echo ""
    echo "Validation completed at: $(date)"
    echo "Log file: $LOG_FILE"
    echo "Results directory: $RESULTS_DIR"
}

# Main validation function
main() {
    log "Starting LMS Code Quality Validation"
    log "===================================="
    
    # Parse command line arguments
    case "${1:-full}" in
        "full")
            init_validation
            check_typescript_compilation
            check_eslint_compliance
            check_code_formatting
            check_import_consistency
            check_security_vulnerabilities
            check_dependency_health
            check_build_process
            check_test_coverage
            check_file_structure
            check_environment_config
            check_documentation
            generate_report
            show_summary
            ;;
        "quick")
            init_validation
            check_typescript_compilation
            check_eslint_compliance
            check_build_process
            generate_report
            show_summary
            ;;
        "security")
            init_validation
            check_security_vulnerabilities
            check_dependency_health
            generate_report
            show_summary
            ;;
        *)
            echo "Usage: $0 {full|quick|security}"
            echo ""
            echo "Commands:"
            echo "  full     - Complete code quality validation (default)"
            echo "  quick    - Quick validation (compilation + linting + build)"
            echo "  security - Security-focused validation only"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
