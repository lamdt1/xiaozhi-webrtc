#!/bin/bash

# WebRTC Implementation Test Runner
# Runs comprehensive tests for the enhanced RTCPeerConnection implementation

set -e

echo "🚀 Starting WebRTC Implementation Tests"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_RESULTS_DIR="./test-results"
DOCKER_COMPOSE_FILE="docker-compose.test.yml"
APP_URL="http://localhost:51001"

# Create test results directory
mkdir -p $TEST_RESULTS_DIR

echo -e "${BLUE}📁 Test results will be saved to: $TEST_RESULTS_DIR${NC}"

# Function to print status
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if service is healthy
check_service_health() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Checking $service_name health..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $DOCKER_COMPOSE_FILE ps $service_name | grep -q "healthy"; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to become healthy"
    return 1
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    if docker-compose -f $DOCKER_COMPOSE_FILE run --rm test-runner; then
        print_success "Unit tests completed successfully"
        return 0
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Function to run browser tests
run_browser_tests() {
    print_status "Running browser compatibility tests..."
    
    if docker-compose -f $DOCKER_COMPOSE_FILE run --rm browser-test-runner; then
        print_success "Browser tests completed successfully"
        return 0
    else
        print_error "Browser tests failed"
        return 1
    fi
}

# Function to run performance benchmarks
run_performance_tests() {
    print_status "Running performance benchmarks..."
    
    # Install puppeteer if not already installed
    if ! command -v puppeteer &> /dev/null; then
        print_status "Installing Puppeteer..."
        npm install -g puppeteer
    fi
    
    # Run performance tests
    cd tests
    if node performance-benchmark.js; then
        print_success "Performance tests completed successfully"
        cd ..
        return 0
    else
        print_error "Performance tests failed"
        cd ..
        return 1
    fi
}

# Function to generate test report
generate_test_report() {
    print_status "Generating comprehensive test report..."
    
    local report_file="$TEST_RESULTS_DIR/test-summary.md"
    
    cat > $report_file << EOF
# WebRTC Implementation Test Report

**Generated:** $(date)
**Test Environment:** Docker
**Application URL:** $APP_URL

## Test Results Summary

### Unit Tests
- **Status:** $(if [ -f "$TEST_RESULTS_DIR/coverage/coverage-summary.txt" ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- **Coverage:** $(if [ -f "$TEST_RESULTS_DIR/coverage/coverage-summary.txt" ]; then cat "$TEST_RESULTS_DIR/coverage/coverage-summary.txt"; else echo "N/A"; fi)

### Browser Compatibility Tests
- **Status:** $(if [ -f "$TEST_RESULTS_DIR/browser-test-report.json" ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- **Browsers Tested:** Chrome, Firefox
- **Success Rate:** $(if [ -f "$TEST_RESULTS_DIR/browser-test-report.json" ]; then jq -r '.summary.successRate' "$TEST_RESULTS_DIR/browser-test-report.json" 2>/dev/null || echo "N/A"; else echo "N/A"; fi)%

### Performance Benchmarks
- **Status:** $(if [ -f "$TEST_RESULTS_DIR/performance-benchmark-report.json" ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- **Success Rate:** $(if [ -f "$TEST_RESULTS_DIR/performance-benchmark-report.json" ]; then jq -r '.summary.successRate' "$TEST_RESULTS_DIR/performance-benchmark-report.json" 2>/dev/null || echo "N/A"; else echo "N/A"; fi)%

## Detailed Results

### Unit Test Results
\`\`\`
$(if [ -f "$TEST_RESULTS_DIR/coverage/coverage-summary.txt" ]; then cat "$TEST_RESULTS_DIR/coverage/coverage-summary.txt"; else echo "Unit test results not available"; fi)
\`\`\`

### Browser Test Results
\`\`\`json
$(if [ -f "$TEST_RESULTS_DIR/browser-test-report.json" ]; then cat "$TEST_RESULTS_DIR/browser-test-report.json"; else echo "Browser test results not available"; fi)
\`\`\`

### Performance Benchmark Results
\`\`\`json
$(if [ -f "$TEST_RESULTS_DIR/performance-benchmark-report.json" ]; then cat "$TEST_RESULTS_DIR/performance-benchmark-report.json"; else echo "Performance test results not available"; fi)
\`\`\`

## Recommendations

Based on the test results, the following recommendations are made:

1. **Code Quality:** Ensure all unit tests pass with >80% coverage
2. **Browser Compatibility:** Verify WebRTC functionality across all supported browsers
3. **Performance:** Monitor connection establishment time and resource usage
4. **Security:** Validate ICE server configuration and data channel security

## Next Steps

1. Review failed tests and address issues
2. Update documentation based on test results
3. Implement performance optimizations if needed
4. Schedule regular test runs in CI/CD pipeline

---
*This report was generated automatically by the WebRTC test suite.*
EOF

    print_success "Test report generated: $report_file"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Stop and remove containers
    docker-compose -f $DOCKER_COMPOSE_FILE down -v
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    local exit_code=0
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    print_status "Starting test environment..."
    
    # Start test services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    if ! check_service_health "xiaozhi-webrtc-test"; then
        print_error "Failed to start test application"
        exit 1
    fi
    
    # Run tests
    print_status "Running test suite..."
    
    # Unit tests
    if ! run_unit_tests; then
        exit_code=1
    fi
    
    # Browser tests
    if ! run_browser_tests; then
        exit_code=1
    fi
    
    # Performance tests
    if ! run_performance_tests; then
        exit_code=1
    fi
    
    # Generate report
    generate_test_report
    
    # Print final results
    echo ""
    echo "======================================"
    if [ $exit_code -eq 0 ]; then
        print_success "All tests completed successfully! 🎉"
    else
        print_error "Some tests failed. Please check the results above."
    fi
    echo "======================================"
    
    exit $exit_code
}

# Run main function
main "$@"
