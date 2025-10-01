# Performance Testing Suite

This directory contains comprehensive performance testing tools for the Personal Shopping Assistant API.

## 🚀 Quick Start

```bash
# Run all performance tests
npm run perf:all

# Run individual tests
npm run perf:benchmark    # Detailed endpoint benchmarks
npm run perf:load         # Load testing with multiple users
npm run perf:monitor      # Continuous performance monitoring
npm run perf:analyze      # Analyze results and get recommendations
```

## 📊 Test Types

### 1. Benchmark Tests (`benchmark.js`)
- **Purpose**: Detailed performance analysis of individual API endpoints
- **Features**:
  - Response time analysis (min, max, avg, percentiles)
  - Throughput measurement (requests per second)
  - Success rate tracking
  - Memory usage monitoring
  - System resource tracking

**Example Output:**
```
✅ List Products:
   📈 Success Rate: 100.00%
   ⏱️  Response Time: 45.23ms avg
   📊 Percentiles: P50: 42.10ms, P90: 67.50ms, P95: 78.90ms
   🚀 Throughput: 1250.50 req/s
   📦 Data Size: 2.45KB avg
```

### 2. Load Tests (`load-test.js`)
- **Purpose**: Test API performance under various concurrent user loads
- **Features**:
  - Multiple concurrent user scenarios (1, 5, 10, 25, 50, 100 users)
  - Realistic user behavior simulation
  - Performance degradation analysis
  - Error rate monitoring under load

**Example Output:**
```
👥 50 Concurrent Users:
   📈 Requests/sec: 1250.50
   ⏱️  Avg Response Time: 45.23ms
   📊 Response Time P95: 78.90ms
   ❌ Error Rate: 0.00%
   ✅ Success Rate: 100.00%
```

### 3. Performance Monitor (`monitor.js`)
- **Purpose**: Continuous real-time performance monitoring
- **Features**:
  - Live performance metrics
  - Alert system for performance degradation
  - Historical performance tracking
  - System resource monitoring

**Example Output:**
```
[14:30:15] ✅ RPS: 125.5 | Avg: 45ms | Errors: 0.0% | Uptime: 100.0%
[14:30:20] ✅ RPS: 130.2 | Avg: 42ms | Errors: 0.0% | Uptime: 100.0%
```

### 4. Performance Analyzer (`optimize.js`)
- **Purpose**: Analyze test results and provide optimization recommendations
- **Features**:
  - Bottleneck identification
  - Performance rating system
  - Optimization recommendations
  - Detailed analysis reports

**Example Output:**
```
🚨 BOTTLENECKS DETECTED (3):
🔴 HIGH RESPONSE TIME:
   • Load Test (100 users): 1250.50 (threshold: 1000)

💡 RECOMMENDATIONS:
📋 Performance:
   🔴 Optimize Response Times
      Response times are poor. Current average: 1250.50ms
      Actions:
        • Implement database query optimization
        • Add Redis caching for frequently accessed data
        • Optimize API endpoint logic
```

## ⚙️ Configuration

All performance tests can be configured via `config.json`:

```json
{
  "performance": {
    "baseUrl": "http://localhost:3001",
    "concurrentUsers": [1, 5, 10, 25, 50, 100],
    "testDuration": 60000,
    "thresholds": {
      "responseTime": {
        "excellent": 100,
        "good": 500,
        "acceptable": 1000,
        "poor": 2000
      }
    }
  }
}
```

## 📈 Performance Thresholds

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Response Time | < 100ms | < 500ms | < 1000ms | < 2000ms |
| Success Rate | > 99% | > 95% | > 90% | > 80% |
| Throughput | > 1000 req/s | > 500 req/s | > 100 req/s | > 50 req/s |
| Error Rate | < 1% | < 5% | < 10% | < 20% |

## 📁 Results

All test results are saved to `./tests/performance/results/`:

- `benchmark-{timestamp}.json` - Detailed benchmark results
- `load-test-report-{timestamp}.json` - Load test results
- `metrics-{timestamp}.json` - Monitoring data
- `analysis-{timestamp}.json` - Analysis and recommendations

## 🔧 Prerequisites

1. **Backend Server Running**: Ensure the API server is running on `http://localhost:3001`
2. **Database Available**: PostgreSQL database should be accessible
3. **Node.js**: Version 14 or higher
4. **Sufficient Resources**: Performance tests can be resource-intensive

## 🚨 Important Notes

### Before Running Tests
1. **Start the backend server**: `npm run dev`
2. **Ensure database is seeded**: `npm run db:seed`
3. **Close other resource-intensive applications**

### During Tests
- **Monitor system resources** - Tests can be CPU/memory intensive
- **Don't run multiple test suites simultaneously** - This can skew results
- **Allow tests to complete** - Interrupting tests may corrupt results

### After Tests
- **Review results** - Check for performance bottlenecks
- **Implement recommendations** - Apply suggested optimizations
- **Re-run tests** - Verify improvements after optimizations

## 🎯 Best Practices

### Running Performance Tests
1. **Start with benchmarks** - Get baseline performance metrics
2. **Run load tests** - Test under realistic load conditions
3. **Use monitoring** - Track performance over time
4. **Analyze results** - Get optimization recommendations
5. **Implement fixes** - Apply suggested improvements
6. **Re-test** - Verify performance improvements

### Interpreting Results
- **Response Time**: Lower is better, focus on P95 and P99 percentiles
- **Throughput**: Higher is better, but consider response time trade-offs
- **Error Rate**: Should be as low as possible, ideally 0%
- **Success Rate**: Should be as high as possible, ideally 100%

### Optimization Strategy
1. **Identify bottlenecks** - Use analyzer to find performance issues
2. **Prioritize fixes** - Address high-priority issues first
3. **Test incrementally** - Verify each optimization
4. **Monitor continuously** - Track performance over time

## 🛠️ Troubleshooting

### Common Issues

**"Connection refused" errors:**
- Ensure backend server is running on correct port
- Check if port 3001 is available

**"Database connection failed":**
- Verify PostgreSQL is running
- Check database credentials in environment variables

**"Out of memory" errors:**
- Reduce concurrent users in load tests
- Close other applications
- Increase Node.js memory limit: `node --max-old-space-size=4096`

**Slow test execution:**
- Check system resources (CPU, memory, disk)
- Ensure database is properly indexed
- Consider running tests on more powerful hardware

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Review the results files for detailed error information
3. Ensure all prerequisites are met
4. Try running individual test components to isolate issues

## 📚 Additional Resources

- [Performance Testing Best Practices](https://docs.example.com/performance-testing)
- [Node.js Performance Optimization](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
