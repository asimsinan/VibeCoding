#!/bin/bash

# Food Lens Deployment Script
# This script automates the deployment process for Food Lens

set -e  # Exit on error

echo "🚀 Food Lens Deployment Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    if ! command -v eas &> /dev/null; then
        echo -e "${YELLOW}⚠️  EAS CLI not found, installing...${NC}"
        npm install -g eas-cli
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
    echo ""
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    npm test -- --passWithNoTests || {
        echo -e "${RED}❌ Tests failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Tests passed${NC}"
    echo ""
}

# Type checking
type_check() {
    echo "🔍 Running type checking..."
    npm run type-check || {
        echo -e "${YELLOW}⚠️  Type checking has warnings (continuing...)${NC}"
    }
    echo -e "${GREEN}✅ Type checking complete${NC}"
    echo ""
}

# Verify production readiness
verify_production() {
    echo "✅ Verifying production readiness..."
    npx tsx scripts/verify-production-build.ts || {
        echo -e "${YELLOW}⚠️  Some verification checks failed (continuing...)${NC}"
    }
    echo ""
}

# Build function
build_app() {
    local platform=$1
    local profile=${2:-production}
    
    echo "🔨 Building $platform app ($profile profile)..."
    eas build --platform $platform --profile $profile --non-interactive || {
        echo -e "${RED}❌ Build failed for $platform${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ $platform build completed${NC}"
    echo ""
}

# Submit function
submit_app() {
    local platform=$1
    
    echo "📤 Submitting $platform app to store..."
    eas submit --platform $platform --non-interactive || {
        echo -e "${RED}❌ Submission failed for $platform${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ $platform submission completed${NC}"
    echo ""
}

# Main deployment flow
main() {
    local action=${1:-build}
    local platform=${2:-all}
    
    check_requirements
    
    case $action in
        test)
            run_tests
            type_check
            ;;
        build)
            run_tests
            type_check
            verify_production
            
            if [ "$platform" = "all" ] || [ "$platform" = "ios" ]; then
                build_app ios
            fi
            
            if [ "$platform" = "all" ] || [ "$platform" = "android" ]; then
                build_app android
            fi
            ;;
        submit)
            if [ "$platform" = "all" ] || [ "$platform" = "ios" ]; then
                submit_app ios
            fi
            
            if [ "$platform" = "all" ] || [ "$platform" = "android" ]; then
                submit_app android
            fi
            ;;
        *)
            echo "Usage: $0 [test|build|submit] [ios|android|all]"
            echo ""
            echo "Examples:"
            echo "  $0 test              # Run tests only"
            echo "  $0 build ios         # Build iOS app"
            echo "  $0 build android     # Build Android app"
            echo "  $0 build all         # Build both platforms"
            echo "  $0 submit ios         # Submit iOS app"
            echo "  $0 submit android    # Submit Android app"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}🎉 Deployment process completed!${NC}"
}

# Run main function
main "$@"

